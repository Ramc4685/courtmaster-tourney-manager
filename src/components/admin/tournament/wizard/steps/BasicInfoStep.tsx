
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { WizardFormValues } from '../types';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GameType } from '@/types/tournament-enums';

export const BasicInfoStep = () => {
  const { control } = useFormContext<WizardFormValues>();

  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="tournament-name">Tournament Name</FormLabel>
            <FormControl>
              <Input 
                id="tournament-name"
                placeholder="Enter tournament name" 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="tournament-location">Location</FormLabel>
            <FormControl>
              <Input 
                id="tournament-location"
                placeholder="Enter tournament location"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="tournament-description">Description</FormLabel>
            <FormControl>
              <Textarea 
                id="tournament-description"
                placeholder="Enter tournament description" 
                className="min-h-[100px]"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="gameType"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="game-type">Game Type</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger id="game-type">
                  <SelectValue placeholder="Select game type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.values(GameType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="startDate"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel htmlFor="start-date">Start Date</FormLabel>
              <FormControl>
                <Input 
                  id="start-date"
                  type="date" 
                  {...field}
                  value={formatDateForInput(value)}
                  onChange={(e) => onChange(new Date(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="endDate"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel htmlFor="end-date">End Date</FormLabel>
              <FormControl>
                <Input 
                  id="end-date"
                  type="date" 
                  {...field}
                  value={formatDateForInput(value)}
                  onChange={(e) => onChange(new Date(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
