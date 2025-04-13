
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GameType } from '@/types/tournament-enums';

const tournamentFormSchema = z.object({
  name: z.string().min(3, {
    message: "Tournament name must be at least 3 characters.",
  }),
  date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date.",
  }),
  location: z.string().min(3, {
    message: "Location must be at least 3 characters.",
  }),
  format: z.string(),
});

type TournamentFormValues = z.infer<typeof tournamentFormSchema>;

interface TournamentCreationFormProps {
  onSubmit: (data: TournamentFormValues) => void;
}

export const TournamentCreationForm: React.FC<TournamentCreationFormProps> = ({ onSubmit }) => {
  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: '',
      date: new Date().toISOString().split('T')[0],
      location: '',
      format: GameType.BADMINTON,
    },
  });

  const handleSubmit = (data: TournamentFormValues) => {
    onSubmit(data);
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Tournament Creation</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Tournament name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Tournament location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Format</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={GameType.SINGLE_ELIMINATION}>Single Elimination</SelectItem>
                      <SelectItem value={GameType.DOUBLE_ELIMINATION}>Double Elimination</SelectItem>
                      <SelectItem value={GameType.ROUND_ROBIN}>Round Robin</SelectItem>
                      <SelectItem value={GameType.BADMINTON}>Badminton</SelectItem>
                      <SelectItem value={GameType.TENNIS}>Tennis</SelectItem>
                      <SelectItem value={GameType.PICKLEBALL}>Pickleball</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the tournament format
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4">
              <Button className="w-full" type="submit">
                Create Tournament
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
