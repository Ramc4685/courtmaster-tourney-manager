import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form'; // Import FormProvider
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { tournamentFormSchema, TournamentFormValues, Category, DivisionFormValues } from '../types'; // Updated import
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { GameType, Division, TournamentFormat, TournamentStatus, TournamentStageEnum, PlayType } from '@/types/tournament-enums';
import { v4 as uuidv4 } from 'uuid';
import { BasicInfoStep } from './steps/BasicInfoStep'; // Import BasicInfoStep
import CategoriesStep from './steps/CategoriesStep';
import RegistrationStep from './steps/RegistrationStep'; // Assuming this step exists or will be created
import ScoringStep from './steps/ScoringStep'; // Assuming this step exists or will be created
import ReviewStep from './steps/ReviewStep'; // Assuming this step exists or will be created
import { tournamentService } from '@/services/api';
import { useAuth } from '@/contexts/auth/AuthContext'; // Import useAuth
import { Tournament } from '@/types/tournament'; // Import Tournament type

interface TournamentWizardProps {
  onComplete?: (data: Tournament) => void; // Return the created Tournament object
}

const TournamentWizard: React.FC<TournamentWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user
  const totalSteps = 5; // Update total steps (Basic, Categories, Registration, Scoring, Review)

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
    mode: 'onChange', // Validate on change for better UX
  });

  const handleNext = async () => {
    // Trigger validation for the current step's fields
    let fieldsToValidate: (keyof TournamentFormValues)[] = [];
    if (step === 1) fieldsToValidate = ['name', 'location', 'gameType', 'startDate', 'endDate', 'description'];
    if (step === 2) fieldsToValidate = ['divisionDetails'];
    if (step === 3) fieldsToValidate = ['registration'];
    if (step === 4) fieldsToValidate = ['scoringRules'];
    
    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid) {
      if (step < totalSteps) {
        setStep(step + 1);
      } else {
        // Final step, trigger submission
        handleCreateTournament();
      }
    } else {
      console.error("Validation Errors:", form.formState.errors);
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please check the form for errors before proceeding.",
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCreateTournament = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to create a tournament.",
      });
      return;
    }

    // Ensure all fields are validated before final submission
    const isValid = await form.trigger();
    if (!isValid) {
      console.error("Final Validation Errors:", form.formState.errors);
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please review all steps for errors before creating the tournament.",
      });
      setStep(1); // Go back to the first step with errors
      return;
    }

    try {
      const values = form.getValues();
      
      // --- MODIFIED: Create a simplified payload for the tournaments table --- 
      const tournamentPayload = {
        name: values.name,
        description: values.description || '',
        start_date: values.startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        end_date: values.endDate.toISOString().split('T')[0],     // Format as YYYY-MM-DD
        registration_deadline: values.registration.deadline?.toISOString(), // Keep as timestamptz
        venue: values.location, // Assuming location maps to venue
        status: 'draft', // Default status (use lowercase as per DB enum)
        organizerId: user.id, // Assign current user as organizer (use camelCase)
        // Add other direct fields from the 'tournaments' table schema if needed
        // e.g., format: values.format (if format is a direct column)
      };
      // --- END MODIFICATION ---

      console.log('Submitting simplified tournament payload:', tournamentPayload);

      // Send only the simplified payload
      const createdTournament = await tournamentService.createTournament(tournamentPayload);
      
      // TODO: After successful tournament creation, add logic here to:
      // 1. Create Divisions: Iterate through values.divisionDetails and call a service to insert them, linking to createdTournament.id
      // 2. Create Categories within Divisions: Similar logic for categories.
      // 3. Potentially update tournament settings (if stored separately or as JSONB)

      toast({
        title: "Success",
        description: "Tournament created successfully! (Divisions/Settings saving is temporarily disabled)",
      });

      if (onComplete) {
        onComplete(createdTournament);
      }

      navigate(`/tournaments/${createdTournament.id}`);
    } catch (error) {
      console.error('Failed to create tournament:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create tournament: ${error instanceof Error ? error.message : 'Please try again.'}`,
      });
    }
  };

  return (
    // Wrap with FormProvider to pass form context to nested steps
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleCreateTournament)} className="space-y-8">
        <Tabs defaultValue="step1" value={`step${step}`} onValueChange={(value) => setStep(parseInt(value.replace('step', '')))}>
          <TabsList className="grid w-full grid-cols-5"> {/* Updated grid-cols */} 
            <TabsTrigger value="step1">1. Basic Info</TabsTrigger>
            <TabsTrigger value="step2">2. Categories</TabsTrigger>
            <TabsTrigger value="step3">3. Registration</TabsTrigger>
            <TabsTrigger value="step4">4. Scoring</TabsTrigger>
            <TabsTrigger value="step5">5. Review</TabsTrigger>
          </TabsList>

          {/* Keep content outside TabsContent for conditional rendering based on step state */}
        </Tabs>

        {/* Conditionally render step components */} 
        <Card>
          <CardContent className="pt-6">
            {step === 1 && <BasicInfoStep />} 
            {step === 2 && <CategoriesStep control={form.control} watch={form.watch} />} 
            {step === 3 && <RegistrationStep control={form.control} />} 
            {step === 4 && <ScoringStep control={form.control} />} 
            {step === 5 && <ReviewStep />} 
          </CardContent>
        </Card>

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
            type="button" // Changed to type="button" to prevent form submission on Next
            onClick={handleNext}
            disabled={form.formState.isSubmitting} // Disable while submitting
          >
            {form.formState.isSubmitting ? 'Creating...' : (step < totalSteps ? 'Next' : 'Create Tournament')}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

export default TournamentWizard;

