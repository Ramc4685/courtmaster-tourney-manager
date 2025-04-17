import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Paper } from '@mui/material';
import { BasicInfoStep } from './steps/BasicInfoStep';
import CategoriesStep from './steps/CategoriesStep';
import { GameSettingsStep } from './steps/GameSettingsStep';
import { RegistrationStep } from './steps/RegistrationStep';
import { ReviewStep } from './steps/ReviewStep';
import { useTournament } from '@/contexts/tournament/useTournament';
import { useToast } from '@/hooks/use-toast';
import { GameType } from '@/types/tournament-enums';
import { WizardFormValues } from './types';
import { tournamentFormSchema } from '../types';
import { WizardNavigation } from './WizardNavigation';
import { WizardProvider } from './WizardContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const steps = [
  { id: 'basic-info', title: 'Basic Details' },
  { id: 'categories', title: 'Categories' },
  { id: 'scoring', title: 'Scoring Rules' },
  { id: 'registration', title: 'Registration' },
  { id: 'review', title: 'Review & Create' }
];

export const TournamentWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const { createTournament } = useTournament();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<WizardFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: '',
      location: '',
      gameType: GameType.BADMINTON,
      description: '',
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      divisionDetails: [],
      registrationEnabled: true,
      registrationDeadline: new Date(),
      requirePlayerProfile: false,
      maxTeams: 16,
      scoringRules: {
        pointsToWin: 21,
        mustWinByTwo: true,
        maxPoints: 30,
      },
    },
    mode: 'onChange',
  });

  const handleNext = async () => {
    const fields = getFieldsToValidate(currentStep);
    const isValid = await form.trigger(fields);
    
    if (isValid) {
      setValidationErrors([]);
      setCurrentStep((prevStep) => prevStep + 1);
    } else {
      const errors = fields.map(field => {
        const error = form.formState.errors[field];
        return error ? `${field}: ${error.message}` : null;
      }).filter((error): error is string => error !== null);
      
      setValidationErrors(errors);
      
      toast({
        title: "Validation Error",
        description: "Please fix the errors before proceeding",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    setValidationErrors([]);
    setCurrentStep((prevStep) => prevStep - 1);
  };

  const getFieldsToValidate = (step: number): (keyof WizardFormValues)[] => {
    switch (step) {
      case 0: // Basic Info
        return ['name', 'location', 'gameType', 'startDate', 'endDate'];
      case 1: // Categories
        return ['divisionDetails'];
      case 2: // Game Settings
        return ['scoringRules'];
      case 3: // Registration
        return ['registrationEnabled', 'registrationDeadline', 'maxTeams'];
      default:
        return [];
    }
  };

  const handleCreateTournament = async (data: WizardFormValues) => {
    try {
      console.log('Starting tournament creation with data:', data);
      setIsSubmitting(true);
      
      const tournament = await createTournament(data);
      console.log('Tournament created successfully:', tournament);
      
      toast({
        title: "Success",
        description: "Tournament created successfully",
      });
      
      // Navigate to the tournament details page
      navigate(`/tournaments/${tournament.id}`);
    } catch (error) {
      console.error('Error creating tournament:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create tournament",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep />;
      case 1:
        return <CategoriesStep />;
      case 2:
        return <GameSettingsStep />;
      case 3:
        return <RegistrationStep />;
      case 4:
        return <ReviewStep />;
      default:
        return null;
    }
  };

  const wizardContextValue = {
    currentStep,
    steps,
    form,
  };

  return (
    <WizardProvider value={wizardContextValue}>
      <FormProvider {...form}>
        <Box sx={{ width: '100%', p: 3 }}>
          <Paper sx={{ p: 3 }}>
            <WizardNavigation steps={steps} />

            {validationErrors.length > 0 && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Box sx={{ mt: 2, mb: 2 }}>
              {renderStep()}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
              <button
                type="button"
                disabled={currentStep === 0}
                onClick={handleBack}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              {currentStep === steps.length - 1 ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={form.handleSubmit(handleCreateTournament)}
                  className="px-6 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Tournament'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Next
                </button>
              )}
            </Box>
          </Paper>
        </Box>
      </FormProvider>
    </WizardProvider>
  );
};
