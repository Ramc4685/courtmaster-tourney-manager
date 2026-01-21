import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { tournamentFormSchema, TournamentFormValues, Category, DivisionFormValues, validateForSubmission, ValidationIssue } from '../types';
import { useNavigate } from 'react-router-dom';
import { GameType, Division, TournamentFormat, CategoryType as EnumCategoryType } from '@/types/tournament-enums';
import { BasicInfoStep } from './steps/BasicInfoStep';
import CategoriesStep from './steps/CategoriesStep';
import RegistrationStep from './steps/RegistrationStep';
import ScoringStep from './steps/ScoringStep';
import ReviewStep from './steps/ReviewStep';
import { tournamentService } from '@/services';
import { divisionService } from '@/services/tournament/DivisionService';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useTournament } from '@/contexts/tournament/TournamentContext';
import { Tournament } from '@/types/tournament';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

interface CreateTournamentInput {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  venue: string;
  status: string;
  organizer_id: string;
}

interface TournamentWizardProps {
  onComplete?: (data: Tournament) => void; // Return the created Tournament object
}

type StepWarning = {
  level: 'warning' | 'error';
  message: string;
};

type StepWarningsMap = Record<number, StepWarning[]>;

const STEP_LABELS = ['Basic Info', 'Categories', 'Registration', 'Scoring', 'Review'] as const;

const normalizeIssuePath = (path: unknown): (string | number)[] => {
  if (!path) return [];

  if (Array.isArray(path)) {
    return path;
  }

  if (typeof path === 'string') {
    return path
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .filter(segment => segment.length > 0)
      .map(segment => {
        const numeric = Number(segment);
        return Number.isNaN(numeric) ? segment : numeric;
      });
  }

  return [];
};

const safeToISODate = (value: unknown, { includeTime = false }: { includeTime?: boolean } = {}) => {
  if (!value) return undefined;

  const date = value instanceof Date ? value : new Date(value as string);
  if (Number.isNaN(date.getTime())) return undefined;

  return includeTime ? date.toISOString() : date.toISOString().split('T')[0];
};

const reviveDates = (draftData: Partial<TournamentFormValues>) => {
  const parseDate = (value: unknown) => {
    if (!value) return value;
    if (value instanceof Date) return value;
    const parsed = new Date(value as string);
    return Number.isNaN(parsed.getTime()) ? value : parsed;
  };

  const revived: Partial<TournamentFormValues> = {
    ...draftData,
    registration: draftData.registration
      ? { ...draftData.registration }
      : draftData.registration,
  };

  if ('startDate' in revived) {
    revived.startDate = parseDate(draftData.startDate) as TournamentFormValues['startDate'];
  }

  if ('endDate' in revived) {
    revived.endDate = parseDate(draftData.endDate) as TournamentFormValues['endDate'];
  }

  if (revived.registration) {
    revived.registration.deadline = parseDate(revived.registration.deadline) as TournamentFormValues['registration']['deadline'];
  }

  return revived;
};

const TournamentWizard: React.FC<TournamentWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepWarnings, setStepWarnings] = useState<StepWarningsMap>({});
  const [warningsAcknowledged, setWarningsAcknowledged] = useState(true);
  const [acknowledgedWarningsKey, setAcknowledgedWarningsKey] = useState<string | null>(null);
  const [autoSaveEnabled] = useState(true);
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const { isMobile } = useMobileOptimization();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loadTournaments, setCurrentTournament } = useTournament();
  const totalSteps = STEP_LABELS.length;
  const [isCreating, setIsCreating] = useState(false);
  const aggregatedWarnings = useMemo(() => Object.values(stepWarnings).flat(), [stepWarnings]);
  const hasBlockingErrors = useMemo(
    () => aggregatedWarnings.some(issue => issue.level === 'error'),
    [aggregatedWarnings]
  );
  const warningsKey = useMemo(
    () => aggregatedWarnings.map(issue => `${issue.level}:${issue.message}`).join('|'),
    [aggregatedWarnings]
  );

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: '',
      location: '',
      gameType: GameType.BADMINTON,
      description: '',
      startDate: new Date(),
      endDate: new Date(),
      format: TournamentFormat.SINGLE_ELIMINATION,
      divisionDetails: [],
      registration: {
        enabled: false,
        deadline: undefined,
        requirePlayerProfile: false,
        maxEntries: undefined,
        maxEntriesPerCategory: false,
        allowWaitlist: true,
        feeAmount: undefined,
        waiverRequired: false,
      },
      scoringRules: {
        pointsToWinSet: 21,
        setsToWinMatch: 2,
        maxSets: 3,
        mustWinByTwo: true,
        maxPointsPerSet: 30,
        tiebreakerFormat: undefined,
      },
    },
    mode: 'onTouched',
  });

  const isSubmitting = isCreating || form.formState.isSubmitting;

  // Track when warnings change to reset acknowledgment, but only for step validation warnings
  useEffect(() => {
    if (aggregatedWarnings.length === 0) {
      setWarningsAcknowledged(true);
      setAcknowledgedWarningsKey(null);
      return;
    }

    setAcknowledgedWarningsKey(null);

    // Only reset acknowledgment if we're not currently on the review step
    // This prevents the submission process from resetting user acknowledgment
    if (step !== totalSteps) {
      setWarningsAcknowledged(false);
    }
  }, [warningsKey, aggregatedWarnings.length, step, totalSteps]);

  const handleWarningsAcknowledgedChange = useCallback((value: boolean) => {
    setWarningsAcknowledged(value);

    if (value) {
      setAcknowledgedWarningsKey(warningsKey || null);
    } else {
      setAcknowledgedWarningsKey(null);
    }
  }, [warningsKey]);

  const dedupeStepWarnings = useCallback((issues: StepWarning[]): StepWarning[] => {
    const seen = new Set<string>();
    return issues.filter(issue => {
      const key = `${issue.level}:${issue.message}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, []);

  const assignWarningsToStep = useCallback((stepNumber: number, issues: StepWarning[]) => {
    setStepWarnings(prev => {
      const updated: StepWarningsMap = { ...prev };
      if (issues.length > 0) {
        updated[stepNumber] = dedupeStepWarnings(issues);
      } else {
        delete updated[stepNumber];
      }
      return updated;
    });
  }, [dedupeStepWarnings]);

  const getCustomStepWarnings = useCallback((stepNumber: number, values: TournamentFormValues): StepWarning[] => {
    const issues: StepWarning[] = [];

    if (stepNumber === 2) {
      if (!values.divisionDetails || values.divisionDetails.length === 0) {
        issues.push({
          level: 'warning',
          message: 'No divisions added yet. Add at least one division before creating your tournament.',
        });
      } else {
        values.divisionDetails.forEach((division, index) => {
          if (!division?.categories || division.categories.length === 0) {
            const label = division?.name?.trim() || `Division ${index + 1}`;
            issues.push({
              level: 'warning',
              message: `${label} has no categories configured.`,
            });
          }
        });
      }
    }

    if (stepNumber === 3) {
      if (values.registration.enabled && !values.registration.deadline) {
        issues.push({
          level: 'warning',
          message: 'Registration deadline is required when registration is enabled.',
        });
      }
    }

    return issues;
  }, []);

  /**
   * Runs validation for the requested step, aggregates warnings, and updates the completed step state.
   * @param stepNumber Step index (1-based) that should be validated.
   * @returns Promise resolving to the list of warnings discovered for the step.
   */
  const validateStepWithWarnings = useCallback(async (stepNumber: number): Promise<StepWarning[]> => {
    const fields = getStepValidationFields(stepNumber);
    if (fields.length > 0) {
      await form.trigger(fields, { shouldFocus: false });
    }

    const fieldIssues: StepWarning[] = fields
      .map(fieldName => {
        const fieldState = form.getFieldState(fieldName as any);
        if (fieldState.error?.message) {
          return { level: 'warning', message: fieldState.error.message };
        }
        return null;
      })
      .filter((issue): issue is StepWarning => Boolean(issue));

    const customIssues = getCustomStepWarnings(stepNumber, form.getValues());
    const combinedIssues = dedupeStepWarnings([...fieldIssues, ...customIssues]);

    assignWarningsToStep(stepNumber, combinedIssues);

    setCompletedSteps(prev => {
      const updated = new Set(prev);
      if (combinedIssues.length === 0) {
        updated.add(stepNumber);
      } else {
        updated.delete(stepNumber);
      }
      return updated;
    });

    return combinedIssues;
  }, [assignWarningsToStep, dedupeStepWarnings, form, getCustomStepWarnings]);

  // Auto-save functionality
  const autoSave = useCallback(() => {
    if (autoSaveEnabled && typeof window !== 'undefined') {
      try {
        const formData = form.getValues();
        localStorage.setItem(`tournament-wizard-draft-${user?.id || 'guest'}`, JSON.stringify({
          ...formData,
          savedAt: new Date().toISOString(),
          currentStep: step
        }));
      } catch (error) {
        console.warn('Auto-save failed:', error);
      }
    }
  }, [autoSaveEnabled, user?.id, step, form]);

  // Load saved draft on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id) {
      try {
        const saved = localStorage.getItem(`tournament-wizard-draft-${user.id}`);
        if (saved) {
          const draftData = JSON.parse(saved);
          const savedDate = new Date(draftData.savedAt);
          const hoursSinceLastSave = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60);

          if (hoursSinceLastSave < 24) {
            toast({
              title: "Draft Found",
              description: "Would you like to restore your previous tournament draft?",
              action: (
                <Button
                  size="sm"
                  onClick={() => {
                    const { currentStep: savedStep, savedAt: _savedAt, ...formData } = draftData;
                    const revivedFormValues = reviveDates(formData as Partial<TournamentFormValues>);
                    form.reset(revivedFormValues);
                    setStep(typeof savedStep === 'number' ? savedStep : 1);
                    toast({
                      title: "Draft Restored",
                      description: "Your previous work has been restored."
                    });
                  }}
                >
                  Restore
                </Button>
              )
            });
          }
        }
      } catch (error) {
        console.warn('Failed to load draft:', error);
      }
    }
  }, [user?.id, form, toast]);

  // Auto-save when form values change
  useEffect(() => {
    const subscription = form.watch(() => {
      if (autoSaveTimeoutRef.current) window.clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = window.setTimeout(autoSave, 1000);
    });
    return () => {
      // In React Hook Form v7, watch() returns a subscription object with unsubscribe method
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
      if (autoSaveTimeoutRef.current) window.clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [form, autoSave]);

  // Step completion validation
  const getStepValidationFields = (stepNumber: number): (keyof TournamentFormValues)[] => {
    switch (stepNumber) {
      case 1: return ['name', 'location', 'gameType', 'startDate', 'endDate'];
      case 2: return []; // Categories/divisions are optional - allow progression
      case 3: return []; // Registration settings are optional
      case 4: return []; // Scoring rules have defaults - allow progression
      default: return [];
    }
  };

  // Removed automatic validation on step mount to prevent premature error messages
  // useEffect(() => {
  //   validateStepWithWarnings(step);
  // }, [step, validateStepWithWarnings]);

  const handleNext = async () => {
    const issues = await validateStepWithWarnings(step);

    if (issues.length > 0) {
      toast({
        variant: 'default',
        title: `${STEP_LABELS[step - 1]} needs attention`,
        description: issues
          .slice(0, 2)
          .map(issue => issue.message)
          .join(' • '),
      });
    }

    if (step < totalSteps) {
      setStep(step + 1);
      autoSave();
      return;
    }

    await handleCreateTournament();
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      autoSave();
    }
  };

  const handleStepClick = async (targetStep: number) => {
    if (targetStep === step) return;

    if (targetStep > step) {
      const issues = await validateStepWithWarnings(step);
      if (issues.length > 0) {
        toast({
          variant: 'default',
          title: `${STEP_LABELS[step - 1]} has pending items`,
          description: issues
            .slice(0, 2)
            .map(issue => issue.message)
            .join(' • '),
        });
      }
    }

    setStep(targetStep);
    autoSave();
  };

  const getStepStatus = useCallback(
    (stepNumber: number) => {
      const stepIssues = stepWarnings[stepNumber] ?? [];
      const hasError = stepIssues.some(issue => issue.level === 'error');
      const hasWarning = stepIssues.some(issue => issue.level === 'warning');

      return {
        hasError,
        hasWarning,
        isCompleted: completedSteps.has(stepNumber),
        isCurrent: stepNumber === step,
      };
    },
    [completedSteps, stepWarnings, step]
  );

  const getStepIcon = (stepNumber: number) => {
    const { hasError, hasWarning, isCompleted, isCurrent } = getStepStatus(stepNumber);

    if (hasError) {
      return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
    }

    if (isCompleted) {
      return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
    }

    if (hasWarning) {
      return <AlertCircle className="h-5 w-5 text-orange-500 dark:text-orange-400" />;
    }

    if (isCurrent) {
      return <Circle className="h-5 w-5 text-primary fill-primary" />;
    }
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  const getStepButtonClass = (stepNumber: number) => {
    const { hasError, hasWarning, isCompleted, isCurrent } = getStepStatus(stepNumber);

    if (isCurrent) {
      return 'bg-primary text-primary-foreground';
    }

    if (hasError) {
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900/50';
    }

    if (hasWarning) {
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-900/50';
    }

    if (isCompleted) {
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/50';
    }

    return 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent';
  };

  const mapPathToStep = (path: unknown): number => {
    const normalizedPath = normalizeIssuePath(path);
    const root = normalizedPath.length > 0 ? normalizedPath[0] : undefined;
    switch (root) {
      case 'name':
      case 'location':
      case 'gameType':
      case 'description':
      case 'startDate':
      case 'endDate':
      case 'format':
        return 1;
      case 'divisionDetails':
        return 2;
      case 'registration':
        return 3;
      case 'scoringRules':
        return 4;
      default:
        return 5;
    }
  };

  const applySubmissionIssuesToSteps = useCallback((issues: ValidationIssue[]) => {
    if (issues.length === 0) {
      return;
    }

    setStepWarnings(prev => {
      const updated: StepWarningsMap = { ...prev };

      issues.forEach(issue => {
        const stepNumber = mapPathToStep(issue.path);
        const existing = updated[stepNumber] ?? [];
        updated[stepNumber] = dedupeStepWarnings([
          ...existing,
          {
            level: issue.level,
            message: issue.message,
          },
        ]);
      });

      return updated;
    });
  }, [dedupeStepWarnings]);

  const refreshAllStepWarnings = useCallback(async () => {
    for (let i = 1; i <= totalSteps; i += 1) {
      await validateStepWithWarnings(i);
    }
  }, [totalSteps, validateStepWithWarnings]);

  const handleCreateTournament = async () => {
    console.log('[TournamentWizard] handleCreateTournament called');
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to create a tournament.",
      });
      return;
    }

    await refreshAllStepWarnings();
    await form.trigger();

    const values = form.getValues();
    const submissionResult = validateForSubmission(values);

    // Apply submission issues to steps for display
    applySubmissionIssuesToSteps([...submissionResult.warnings, ...submissionResult.errors]);

    if (submissionResult.errors.length > 0) {
      const primaryIssue = submissionResult.errors[0];
      const destinationStep = mapPathToStep(primaryIssue.path);

      toast({
        variant: "destructive",
        title: "Resolve critical issues",
        description: primaryIssue.message,
      });

      setStep(destinationStep);
      return;
    }

    if (submissionResult.warnings.length > 0) {
      const warningsAcknowledgedForCurrentIssues =
        warningsAcknowledged &&
        (acknowledgedWarningsKey === warningsKey || acknowledgedWarningsKey === null);

      if (!warningsAcknowledgedForCurrentIssues) {
        setWarningsAcknowledged(false);
        setAcknowledgedWarningsKey(null);

        if (step !== totalSteps) {
          setStep(totalSteps);
        }

        toast({
          variant: 'default',
          title: 'Review outstanding warnings',
          description: 'Please check the acknowledgment box below the warnings to proceed.',
        });
        return;
      }

      if (acknowledgedWarningsKey === null && warningsKey) {
        setAcknowledgedWarningsKey(warningsKey);
      }

      if (step !== totalSteps) {
        setStep(totalSteps);
      }
    }

    let createdTournament: Tournament | null = null;

    try {
      setIsCreating(true);

      const payload: CreateTournamentInput = {
        name: values.name,
        description: values.description ?? '',
        start_date: safeToISODate(values.startDate) ?? '',
        end_date: safeToISODate(values.endDate) ?? '',
        registration_deadline: safeToISODate(values.registration.deadline, { includeTime: true }),
        venue: values.location,
        status: 'draft',
        organizer_id: user.id,
      };

      console.log('Submitting tournament payload:', payload);

      // Send only the simplified payload
      try {
        createdTournament = await tournamentService.createTournament(payload);
        console.log('[TournamentWizard] Created tournament response:', JSON.stringify(createdTournament, null, 2));
        console.log('[TournamentWizard] createdTournament.id:', createdTournament?.id);

        // Fallback: If id is missing but $id exists, use $id
        if (!createdTournament?.id && (createdTournament as any)?.$id) {
          console.log('[TournamentWizard] Using $id fallback:', (createdTournament as any).$id);
          createdTournament.id = (createdTournament as any).$id;
        }
      } catch (createError) {
        console.error('[TournamentWizard] Error creating tournament:', createError);
        throw createError;
      }

      // Create divisions and categories using the DivisionService
      if (values.divisionDetails && values.divisionDetails.length > 0) {
        console.log('TRACE: Start creating divisions, count:', values.divisionDetails.length);
        try {
          // Convert division form values to DivisionEntity objects
          const divisionEntities = values.divisionDetails.map((divisionDetail: DivisionFormValues) => {
            // Convert categories to CategoryEntity objects
            const categoryEntities = divisionDetail.categories?.map((category: Category) => ({
              name: category.name,
              type: category.type as EnumCategoryType,
              playType: category.playType,
              divisionId: '', // Will be set after division creation
              format: category.format,
              capacity: category.capacity,
              createdAt: new Date(),
              updatedAt: new Date(),
            })) || [];

            return {
              name: divisionDetail.name,
              type: divisionDetail.type as Division,
              tournamentId: createdTournament.id,
              minAge: divisionDetail.minAge,
              maxAge: divisionDetail.maxAge,
              gender: divisionDetail.gender,
              capacity: divisionDetail.capacity,
              skillLevel: divisionDetail.skillLevel,
              categories: categoryEntities,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any;
          });

          console.log('TRACE: Calling divisionService.createDivisions', JSON.stringify(divisionEntities));
          // Create divisions and categories
          await divisionService.createDivisions(createdTournament.id, divisionEntities);
          console.log('TRACE: divisionService.createDivisions returned successfully');
        } catch (divisionError) {
          console.error('TRACE: Error creating divisions:', divisionError);
          try {
            await tournamentService.deleteTournament(createdTournament.id);
          } catch (rollbackError) {
            console.error('Failed to rollback tournament after division error:', rollbackError);
          }

          toast({
            variant: "destructive",
            title: "Division setup failed",
            description: "We could not save divisions or categories, so the tournament was rolled back. Please fix the issues and try again.",
          });
          return;
        }
      }

      // Clear autosave draft after successful creation
      const key = `tournament-wizard-draft-${user?.id || 'guest'}`;
      localStorage.removeItem(key);

      toast({
        title: "Success",
        description: "Tournament created successfully with divisions and categories!",
      });

      if (createdTournament) {
        await setCurrentTournament(createdTournament);
        await loadTournaments();
      }

      if (onComplete && createdTournament) {
        onComplete(createdTournament);
      }

      if (createdTournament && createdTournament.id) {
        navigate(`/tournaments/${createdTournament.id}`);
      } else {
        console.error('[TournamentWizard] Tournament created but ID is missing!', createdTournament);
        toast({
          variant: "destructive",
          title: "Warning",
          description: "Tournament created but navigation failed. Please check the tournaments list.",
        });
        navigate('/tournaments');
      }
    } catch (error) {
      console.error('Failed to create tournament:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create tournament: ${error instanceof Error ? error.message : 'Please try again.'}`,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleCreateTournament)} className="space-y-8">


        {/* Global Container Wrapper */}
        <div className="min-h-screen bg-background p-4 md:p-8 flex justify-center">
          <div className="w-full max-w-5xl space-y-8">

            {/* Mobile step navigation */}
            {isMobile ? (
              <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
                <Button variant="ghost" size="sm" onClick={handleBack} disabled={step === 1}>← Back</Button>
                <span className="text-sm font-medium">{STEP_LABELS[step - 1]}</span>
                <Button variant="ghost" size="sm" onClick={handleNext} disabled={isSubmitting}>
                  {step === totalSteps ? 'Create' : 'Next'} →
                </Button>
              </div>
            ) : (
              /* Desktop step navigation */
              <div className="flex items-center space-x-4 overflow-x-auto">
                {STEP_LABELS.map((_, index) => {
                  const stepNumber = index + 1;
                  return (
                    <button
                      key={stepNumber}
                      onClick={() => handleStepClick(stepNumber)}
                      className={cn(
                        "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        "min-w-0 flex-shrink-0",
                        getStepButtonClass(stepNumber)
                      )}
                      disabled={isSubmitting}
                    >
                      {getStepIcon(stepNumber)}
                      <span className="hidden sm:block">
                        {stepNumber}. {STEP_LABELS[stepNumber - 1]}
                      </span>
                      <span className="sm:hidden">{stepNumber}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Form Content */}
            <div className="bg-white dark:bg-card border border-border rounded-xl shadow-md p-8 md:p-12 w-full relative">
              {isSubmitting && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
                  <div className="flex flex-col items-center space-y-4 p-6 bg-card rounded-lg shadow-lg border">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-muted border-t-primary"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium">Creating Tournament</p>
                      <p className="text-xs text-muted-foreground">Setting up divisions and categories...</p>
                    </div>
                    <Progress value={75} className="w-48" />
                  </div>
                </div>
              )}


              <p className="text-muted-foreground mb-8">
                Let's get started by setting up the basic information for your tournament.
              </p>

              <div className="min-h-[400px] pb-24">
                {step === 1 && <BasicInfoStep />}
                {step === 2 && <CategoriesStep control={form.control} watch={form.watch} />}
                {step === 3 && <RegistrationStep control={form.control} />}
                {step === 4 && <ScoringStep control={form.control} />}
                {step === 5 && (
                  <ReviewStep
                    warningsByStep={stepWarnings}
                    onNavigateToStep={(targetStep) => { void handleStepClick(targetStep); }}
                    warningsAcknowledged={warningsAcknowledged}
                    onWarningsAcknowledgedChange={handleWarningsAcknowledgedChange}
                    hasBlockingErrors={hasBlockingErrors}
                    stepLabels={Array.from(STEP_LABELS)}
                  />
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-8">
              <div className="flex items-center space-x-2">
                {autoSaveEnabled && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground animate-pulse">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Saved to draft</span>
                  </div>
                )}
              </div>
              <Button
                type="button"
                data-testid="wizard-next-btn"
                onClick={handleNext}
                className="flex items-center justify-center rounded-lg h-12 px-6 bg-primary text-white text-sm font-bold shadow-sm hover:bg-opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    <span>{step < totalSteps ? 'Next' : 'Create Tournament'}</span>
                    <span className="material-symbols-outlined ml-2">arrow_forward</span>
                  </>
                )}
              </Button>
            </div>

            {step === totalSteps && completedSteps.size === totalSteps && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>All steps completed. Ready to create your tournament!</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

export default TournamentWizard;
