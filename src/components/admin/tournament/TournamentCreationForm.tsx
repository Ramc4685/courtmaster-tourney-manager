import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TournamentFormat, CategoryType } from '@/types/tournament-enums';
import { tournamentFormSchema, TournamentFormValues } from './types';
import { useTournament } from '@/contexts/tournament/useTournament';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import DivisionsTab from './DivisionsTab';

const TournamentCreationForm = React.forwardRef<HTMLFormElement, {}>(({  }, ref) => {
  const navigate = useNavigate();
  const { createTournament } = useTournament();
  const { toast } = useToast();

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: '',
      location: '',
      gameType: GameType.BADMINTON,
      format: TournamentFormat.SINGLE_ELIMINATION,
      registrationEnabled: false,
      divisions: [],
      requirePlayerProfile: false,
      maxTeams: undefined,
      scoringRules: {
        pointsToWin: 21,
        mustWinByTwo: true,
        maxPoints: 30,
      },
    },
  });

  const onSubmit = async (values: TournamentFormValues) => {
    try {
      // Convert string dates to Date objects
      const data = {
        ...values,
        startDate: values.startDate ? new Date(values.startDate) : undefined,
        endDate: values.endDate ? new Date(values.endDate) : undefined,
        registrationDeadline: values.registrationDeadline ? new Date(values.registrationDeadline) : undefined,
      };

      const tournament = await createTournament(data);
      toast({
        title: "Tournament Created",
        description: `Successfully created tournament: ${tournament.name}`,
      });
      navigate(`/tournament/${tournament.id}`);
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast({
        title: "Error",
        description: "Failed to create tournament. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto" ref={ref}>
      <CardHeader>
        <CardTitle>Create New Tournament</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Game Type</label>
                  <select 
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    {...form.register('gameType')}
                  >
                    {Object.values(GameType).map(type => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <FormField
                  label="Tournament Name"
                  {...form.register('name')}
                  error={form.formState.errors.name?.message}
                />
                <FormField
                  label="Location"
                  {...form.register('location')}
                  error={form.formState.errors.location?.message}
                />
                <FormField
                  type="date"
                  label="Start Date"
                  {...form.register('startDate')}
                  error={form.formState.errors.startDate?.message}
                />
                <FormField
                  type="date"
                  label="End Date"
                  {...form.register('endDate')}
                  error={form.formState.errors.endDate?.message}
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="format" className="text-sm font-medium">Tournament Format</label>
                  <select 
                    id="format"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    {...form.register('format')}
                  >
                    {Object.values(TournamentFormat).map(format => (
                      <option key={format} value={format}>
                        {format.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <FormField
                  type="number"
                  label="Max Teams"
                  {...form.register('maxTeams', { valueAsNumber: true })}
                  error={form.formState.errors.maxTeams?.message}
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="registrationEnabled"
                    className="rounded border-gray-300"
                    {...form.register('registrationEnabled')}
                  />
                  <label htmlFor="registrationEnabled" className="text-sm font-medium">
                    Enable Registration
                  </label>
                </div>
                {form.watch('registrationEnabled') && (
                  <FormField
                    type="date"
                    label="Registration Deadline"
                    {...form.register('registrationDeadline')}
                    error={form.formState.errors.registrationDeadline?.message}
                  />
                )}
              </div>
            </div>

            <DivisionsTab form={form} />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => navigate('/tournaments')}>
                Cancel
              </Button>
              <Button type="submit">Create Tournament</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
});

TournamentCreationForm.displayName = "TournamentCreationForm";

export default TournamentCreationForm;