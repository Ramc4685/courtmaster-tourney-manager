
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tournamentFormSchema, TournamentFormValues } from './types';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import FormatTab from './FormatTab';

interface CreateTournamentFormProps {
  onSubmit: (data: TournamentFormValues) => void;
  defaultValues?: Partial<TournamentFormValues>;
}

const CreateTournamentForm: React.FC<CreateTournamentFormProps> = ({ 
  onSubmit,
  defaultValues 
}) => {
  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: '',
      location: '',
      gameType: 'SINGLE_ELIMINATION',
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
      ...defaultValues,
    },
  });

  const handleSubmit = (data: TournamentFormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-6">
          <FormatTab form={form} />
          
          <div className="flex justify-end">
            <Button type="submit">Create Tournament</Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default CreateTournamentForm;
