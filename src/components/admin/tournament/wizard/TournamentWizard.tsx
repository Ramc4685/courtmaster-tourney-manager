
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { tournamentFormSchema, TournamentFormValues, Category } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategoriesStep from './steps/CategoriesStep';
import { useToast } from '@/components/ui/use-toast';
import { tournamentService } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { GameType, Division, TournamentFormat, TournamentStatus, TournamentStageEnum, PlayType } from '@/types/tournament-enums';
import { Tournament } from '@/types/tournament';
import { v4 as uuidv4 } from 'uuid';

interface TournamentWizardProps {
  onComplete?: (data: TournamentFormValues) => void;
}

export default function TournamentWizard({ onComplete }: TournamentWizardProps) {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: '',
      location: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(),
      gameType: GameType.BADMINTON,
      divisionDetails: [],
      registrationEnabled: false,
      maxTeams: 32,
      scoringRules: {
        pointsToWin: 21,
        mustWinByTwo: true,
        maxPoints: 30,
      },
    },
  });

  const handleNext = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      if (step < 3) {
        setStep(step + 1);
      } else {
        handleCreateTournament();
      }
    } else {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please check the form for errors.",
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCreateTournament = async () => {
    try {
      const values = form.getValues();
      const tournament: Tournament = {
        id: '', // Will be set by the service
        name: values.name,
        location: values.location,
        description: values.description || '',
        startDate: values.startDate,
        endDate: values.endDate,
        registrationDeadline: values.registrationDeadline,
        format: TournamentFormat.SINGLE_ELIMINATION, // Default format
        status: TournamentStatus.DRAFT,
        currentStage: TournamentStageEnum.GROUP_STAGE,
        registrationEnabled: values.registrationEnabled,
        requirePlayerProfile: values.requirePlayerProfile || false,
        maxTeams: values.maxTeams,
        teams: [],
        matches: [],
        courts: [],
        categories: values.divisionDetails.flatMap(division => 
          division.categories.map(cat => ({
            id: '',  // Will be set by the service
            name: cat.name,
            division: division.type,
            type: cat.type || 'standard',
            playType: cat.playType || PlayType.SINGLES,
            format: cat.format || TournamentFormat.SINGLE_ELIMINATION,
            teams: []
          }))
        ),
        scoringSettings: {
          matchFormat: 'standard',
          pointsToWin: values.scoringRules.pointsToWin,
          maxSets: 3,
          mustWinByTwo: values.scoringRules.mustWinByTwo,
          maxPoints: values.scoringRules.maxPoints,
          requireTwoPointLead: true,
          maxTwoPointLeadScore: values.scoringRules.maxPoints,
          setsToWin: 2
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Submitting tournament data:', tournament);

      const createdTournament = await tournamentService.createTournament(tournament);
      
      toast({
        title: "Success",
        description: "Tournament created successfully!",
      });

      if (onComplete) {
        onComplete(values);
      }

      navigate(`/tournaments/${createdTournament.id}`);
    } catch (error) {
      console.error('Failed to create tournament:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create tournament. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-8">
      <Tabs defaultValue="step1" value={`step${step}`}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="step1" disabled={step !== 1}>
            Tournament Info
          </TabsTrigger>
          <TabsTrigger value="step2" disabled={step !== 2}>
            Categories
          </TabsTrigger>
          <TabsTrigger value="step3" disabled={step !== 3}>
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="step2">
          <Card>
            <CardContent className="pt-6">
              <CategoriesStep 
                categories={categories}
                onCategoriesChange={setCategories}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="step3">
          <Card>
            <CardContent className="pt-6">
              {/* Settings Step */}
              <div className="space-y-4">
                {/* Step 3 Form Fields */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleNext}
        >
          {step < 3 ? 'Next' : 'Create Tournament'}
        </Button>
      </div>
    </div>
  );
}
