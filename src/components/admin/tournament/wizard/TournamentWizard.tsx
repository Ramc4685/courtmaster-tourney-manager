import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { tournamentFormSchema } from '../types';
import { WizardFormValues } from './types';
import { useTournament } from '@/contexts/tournament/useTournament';
import { useToast } from '@/hooks/use-toast';
import { GameType } from '@/types/tournament-enums';
import { WizardProvider } from './WizardContext';
import { WizardNavigation } from './WizardNavigation';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { GameSettingsStep } from './steps/GameSettingsStep';
import { DivisionsStep } from './steps/DivisionsStep';
import { CategoriesStep } from './steps/CategoriesStep';
import { RegistrationStep } from './steps/RegistrationStep';
import { ReviewStep } from './steps/ReviewStep';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';

export const TournamentWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { createTournament } = useTournament();
  const { toast } = useToast();

  const form = useForm<WizardFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: '',
      location: '',
      gameType: GameType.BADMINTON,
      description: '',
      startDate: new Date(),
      endDate: new Date(),
      divisionDetails: [],
      registrationEnabled: false,
      registrationDeadline: new Date(),
      requirePlayerProfile: false,
      maxTeams: 0,
      scoringRules: {
        pointsToWin: 21,
        mustWinByTwo: true,
        maxPoints: 30,
      },
    },
  });

  const steps = [
    {
      id: uuidv4(),
      title: 'Basic Info',
      component: <BasicInfoStep />,
    },
    {
      id: uuidv4(),
      title: 'Game Settings',
      component: <GameSettingsStep />,
    },
    {
      id: uuidv4(),
      title: 'Divisions',
      component: <DivisionsStep />,
    },
    {
      id: uuidv4(),
      title: 'Categories',
      component: <CategoriesStep />,
    },
    {
      id: uuidv4(),
      title: 'Registration',
      component: <RegistrationStep />,
    },
    {
      id: uuidv4(),
      title: 'Review',
      component: <ReviewStep />,
    },
  ];

  const onSubmit = async (values: WizardFormValues) => {
    try {
      await createTournament(values);
      toast({
        title: "Success",
        description: "Tournament created successfully",
      });
      navigate('/admin/tournaments');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to create tournament",
        variant: "destructive",
      });
    }
  };

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      form.handleSubmit(onSubmit)();
    } else {
      setCurrentStep(Math.min(currentStep + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  };

  return (
    <FormProvider {...form}>
      <WizardProvider value={{ currentStep, steps, form }}>
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Create New Tournament</CardTitle>
            <WizardNavigation steps={steps} />
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {steps.map((step, index) => (
                <div key={step.id} className={index === currentStep ? 'block' : 'hidden'}>
                  {step.component}
                </div>
              ))}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                >
                  {currentStep === steps.length - 1 ? 'Create Tournament' : 'Next'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </WizardProvider>
    </FormProvider>
  );
}; 