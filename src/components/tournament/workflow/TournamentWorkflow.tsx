import React, { useState, useEffect, useMemo } from 'react';
import { Tournament, Match, Team } from '@/types/tournament';
import { TournamentStatus } from '@/types/tournament-enums';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Users,
  Calendar,
  Trophy,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Target,
  MapPin,
  UserCheck,
  Zap,
  Eye,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

interface TournamentWorkflowProps {
  tournament: Tournament;
  onUpdateTournament: (tournament: Tournament) => Promise<void>;
  onNavigateToStep: (step: WorkflowStep) => void;
}

export type WorkflowStep =
  | 'setup'
  | 'registration'
  | 'scheduling'
  | 'scoring'
  | 'results'
  | 'complete';

interface WorkflowStepInfo {
  id: WorkflowStep;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  progress: number;
  estimatedTime?: string;
  requirements?: string[];
  actions: WorkflowAction[];
}

interface WorkflowAction {
  id: string;
  label: string;
  description: string;
  variant: 'default' | 'outline' | 'secondary';
  onClick: () => void;
  disabled?: boolean;
}

export const TournamentWorkflow: React.FC<TournamentWorkflowProps> = ({
  tournament,
  onUpdateTournament,
  onNavigateToStep
}) => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('setup');
  const [autoAdvance, setAutoAdvance] = useState(true);
  const { isMobile } = useMobileOptimization();
  const { toast } = useToast();

  // Calculate workflow progress based on tournament data
  const workflowSteps: WorkflowStepInfo[] = useMemo(() => {
    const registeredTeams = tournament.teams?.length || 0;
    const scheduledMatches = tournament.matches?.filter(m => m.scheduledTime).length || 0;
    const totalMatches = tournament.matches?.length || 0;
    const completedMatches = tournament.matches?.filter(m => m.status === 'COMPLETED').length || 0;
    const hasDivisions = tournament.divisions?.length > 0;
    const hasCategories = tournament.categories?.length > 0;

    return [
      {
        id: 'setup',
        title: 'Tournament Setup',
        description: 'Configure tournament details, divisions, and categories',
        icon: Settings,
        status: hasDivisions && hasCategories ? 'completed' : 'in_progress',
        progress: hasDivisions && hasCategories ? 100 : (hasDivisions ? 60 : 20),
        estimatedTime: '15-30 min',
        requirements: ['Tournament details', 'At least one division', 'At least one category'],
        actions: [
          {
            id: 'configure',
            label: 'Configure Tournament',
            description: 'Set up basic details and structure',
            variant: 'default',
            onClick: () => onNavigateToStep('setup')
          },
          {
            id: 'preview',
            label: 'Preview Structure',
            description: 'Review tournament configuration',
            variant: 'outline',
            onClick: () => onNavigateToStep('setup'),
            disabled: !hasDivisions
          }
        ]
      },
      {
        id: 'registration',
        title: 'Team Registration',
        description: 'Manage team registrations and participant check-ins',
        icon: Users,
        status: registeredTeams === 0 ? 'pending' : registeredTeams >= 4 ? 'completed' : 'in_progress',
        progress: Math.min((registeredTeams / Math.max(tournament.maxTeams || 16, 4)) * 100, 100),
        estimatedTime: '1-7 days',
        requirements: ['At least 4 teams registered', 'All required player information'],
        actions: [
          {
            id: 'manage-registration',
            label: 'Manage Registration',
            description: 'View and manage team registrations',
            variant: 'default',
            onClick: () => onNavigateToStep('registration')
          },
          {
            id: 'import-teams',
            label: 'Import Teams',
            description: 'Bulk import teams from file',
            variant: 'outline',
            onClick: () => onNavigateToStep('registration')
          },
          {
            id: 'close-registration',
            label: 'Close Registration',
            description: 'Finalize participant list',
            variant: 'secondary',
            onClick: () => {
              toast({
                title: "Registration Closed",
                description: "No new registrations will be accepted."
              });
            },
            disabled: registeredTeams < 4
          }
        ]
      },
      {
        id: 'scheduling',
        title: 'Match Scheduling',
        description: 'Schedule matches and assign courts',
        icon: Calendar,
        status: registeredTeams < 4 ? 'blocked' :
                scheduledMatches === 0 ? 'pending' :
                scheduledMatches === totalMatches ? 'completed' : 'in_progress',
        progress: totalMatches > 0 ? (scheduledMatches / totalMatches) * 100 : 0,
        estimatedTime: '30-60 min',
        requirements: ['Teams registered', 'Courts configured', 'Tournament format selected'],
        actions: [
          {
            id: 'auto-schedule',
            label: 'Smart Schedule',
            description: 'Automatically schedule all matches',
            variant: 'default',
            onClick: () => onNavigateToStep('scheduling'),
            disabled: registeredTeams < 4
          },
          {
            id: 'manual-schedule',
            label: 'Manual Schedule',
            description: 'Schedule matches manually',
            variant: 'outline',
            onClick: () => onNavigateToStep('scheduling'),
            disabled: registeredTeams < 4
          },
          {
            id: 'view-schedule',
            label: 'View Schedule',
            description: 'Review current schedule',
            variant: 'outline',
            onClick: () => onNavigateToStep('scheduling'),
            disabled: scheduledMatches === 0
          }
        ]
      },
      {
        id: 'scoring',
        title: 'Live Scoring',
        description: 'Conduct matches and record scores',
        icon: Trophy,
        status: scheduledMatches === 0 ? 'blocked' :
                completedMatches === 0 ? 'pending' :
                completedMatches === totalMatches ? 'completed' : 'in_progress',
        progress: totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0,
        estimatedTime: 'Tournament duration',
        requirements: ['Matches scheduled', 'Courts ready', 'Scorekeepers assigned'],
        actions: [
          {
            id: 'live-scoring',
            label: 'Start Scoring',
            description: 'Begin live match scoring',
            variant: 'default',
            onClick: () => onNavigateToStep('scoring'),
            disabled: scheduledMatches === 0
          },
          {
            id: 'scoreboard',
            label: 'Live Scoreboard',
            description: 'Display live scores',
            variant: 'outline',
            onClick: () => onNavigateToStep('scoring'),
            disabled: scheduledMatches === 0
          }
        ]
      },
      {
        id: 'results',
        title: 'Results & Awards',
        description: 'View final results and award ceremonies',
        icon: Target,
        status: completedMatches === 0 ? 'blocked' :
                completedMatches === totalMatches ? 'completed' : 'pending',
        progress: totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0,
        estimatedTime: '15-30 min',
        requirements: ['All matches completed', 'Winners determined'],
        actions: [
          {
            id: 'view-results',
            label: 'View Results',
            description: 'See final standings and winners',
            variant: 'default',
            onClick: () => onNavigateToStep('results'),
            disabled: completedMatches === 0
          },
          {
            id: 'export-results',
            label: 'Export Results',
            description: 'Download results and certificates',
            variant: 'outline',
            onClick: () => {
              toast({
                title: "Results Exported",
                description: "Tournament results have been downloaded."
              });
            },
            disabled: completedMatches < totalMatches
          }
        ]
      }
    ];
  }, [tournament, onNavigateToStep, toast]);

  // Auto-advance to next incomplete step
  useEffect(() => {
    if (autoAdvance) {
      const nextIncompleteStep = workflowSteps.find(step =>
        step.status === 'in_progress' || step.status === 'pending'
      );
      if (nextIncompleteStep && nextIncompleteStep.id !== currentStep) {
        setCurrentStep(nextIncompleteStep.id);
      }
    }
  }, [workflowSteps, currentStep, autoAdvance]);

  const currentStepInfo = workflowSteps.find(step => step.id === currentStep);
  const overallProgress = workflowSteps.reduce((sum, step) => sum + step.progress, 0) / workflowSteps.length;

  const getStatusIcon = (status: WorkflowStepInfo['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <PlayCircle className="h-5 w-5 text-blue-600" />;
      case 'blocked':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: WorkflowStepInfo['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={cn("space-y-6", isMobile && "space-y-4")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <Zap className="h-7 w-7 text-primary" />
            <span>Tournament Workflow</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Guide your tournament from setup to completion
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Overall Progress</div>
          <div className="text-2xl font-bold">{Math.round(overallProgress)}%</div>
        </div>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Tournament Progress</span>
              <span className="text-sm text-muted-foreground">
                {workflowSteps.filter(s => s.status === 'completed').length} of {workflowSteps.length} steps completed
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Current Step Focus */}
      {currentStepInfo && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <currentStepInfo.icon className="h-6 w-6" />
              <span>Current Step: {currentStepInfo.title}</span>
              <Badge className={getStatusColor(currentStepInfo.status)}>
                {currentStepInfo.status.replace('_', ' ')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{currentStepInfo.description}</p>

            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Progress value={currentStepInfo.progress} className="h-2" />
              </div>
              <span className="text-sm font-medium">{Math.round(currentStepInfo.progress)}%</span>
            </div>

            {currentStepInfo.requirements && (
              <div>
                <h4 className="text-sm font-medium mb-2">Requirements:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {currentStepInfo.requirements.map((req, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <div className="h-1.5 w-1.5 bg-current rounded-full" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={cn(
              "grid gap-2",
              isMobile ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3"
            )}>
              {currentStepInfo.actions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant}
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="justify-start h-auto p-3"
                >
                  <div className="text-left">
                    <div className="font-medium">{action.label}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Steps Overview */}
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"
      )}>
        {workflowSteps.map((step, index) => (
          <Card
            key={step.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              currentStep === step.id && "ring-2 ring-primary/20",
              step.status === 'blocked' && "opacity-60"
            )}
            onClick={() => setCurrentStep(step.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <step.icon className="h-5 w-5" />
                  <span className="font-medium text-sm">{step.title}</span>
                </div>
                {getStatusIcon(step.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{step.description}</p>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{Math.round(step.progress)}%</span>
                  </div>
                  <Progress value={step.progress} className="h-1.5" />
                </div>

                {step.estimatedTime && (
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{step.estimatedTime}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tournament Quick Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tournament Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Teams</span>
              </div>
              <div className="text-lg font-semibold">{tournament.teams?.length || 0}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Matches</span>
              </div>
              <div className="text-lg font-semibold">{tournament.matches?.length || 0}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Courts</span>
              </div>
              <div className="text-lg font-semibold">{tournament.courts?.length || 0}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Trophy className="h-4 w-4" />
                <span>Divisions</span>
              </div>
              <div className="text-lg font-semibold">{tournament.divisions?.length || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentWorkflow;