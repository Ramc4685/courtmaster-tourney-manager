import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { tournamentFormSchema, TournamentFormValues, Category } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategoriesStep from './steps/CategoriesStep'; // Import as default
import { useToast } from '@/components/ui/use-toast';
import { tournamentService } from '@/services/api';
import { useRouter } from 'next/router';

interface TournamentWizardProps {
  onComplete?: (data: TournamentFormValues) => void;
}

export default function TournamentWizard({ onComplete }: TournamentWizardProps) {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: '',
      location: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(),
      gameType: 'BADMINTON',
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
      // Update the form values with the categories
      values.divisionDetails = [
        {
          id: 'default-division',
          name: 'Default Division',
          type: 'OPEN',
          categories: categories
        }
      ];

      console.log('Submitting tournament data:', values);

      // Call API service to create tournament
      const createdTournament = await tournamentService.createTournament(values);
      
      toast({
        title: "Success",
        description: "Tournament created successfully!",
      });

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete(values);
      }

      // Redirect to tournament management page
      router.push(`/admin/tournaments/${createdTournament.id}`);
    } catch (error) {
      console.error('Failed to create tournament:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create tournament. Please try again.",
      });
    }
  };

  const handleCategoriesChange = (updatedCategories: Category[]) => {
    setCategories(updatedCategories);
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

        <TabsContent value="step1">
          <Card>
            <CardContent className="pt-6">
              {/* Tournament Info Step */}
              <div className="space-y-4">
                {/* Step 1 Form Fields */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="step2">
          <Card>
            <CardContent className="pt-6">
              {/* Categories Step */}
              <CategoriesStep 
                categories={categories}
                onCategoriesChange={handleCategoriesChange}
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
