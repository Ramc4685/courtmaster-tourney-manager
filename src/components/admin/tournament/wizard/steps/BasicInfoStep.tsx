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
                name="tournament-name"
                placeholder="Enter tournament name" 
                aria-describedby="tournament-name-description"
                autoComplete="off"
                {...field} 
              />
            </FormControl>
            <FormMessage id="tournament-name-description" />
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
                name="tournament-location"
                placeholder="Enter tournament location" 
                aria-describedby="tournament-location-description"
                autoComplete="address-level1"
                {...field} 
              />
            </FormControl>
            <FormMessage id="tournament-location-description" />
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
                name="tournament-description"
                placeholder="Enter tournament description" 
                aria-describedby="tournament-description-description"
                className="min-h-[100px]"
                {...field} 
              />
            </FormControl>
            <FormMessage id="tournament-description-description" />
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
                <SelectTrigger 
                  id="game-type" 
                  name="game-type"
                  aria-describedby="game-type-description"
                >
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
            <FormMessage id="game-type-description" />
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
                  name="start-date"
                  type="date" 
                  aria-describedby="start-date-description"
                  autoComplete="off"
                  {...field}
                  value={formatDateForInput(value)}
                  onChange={(e) => onChange(new Date(e.target.value))}
                />
              </FormControl>
              <FormMessage id="start-date-description" />
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
                  name="end-date"
                  type="date" 
                  aria-describedby="end-date-description"
                  autoComplete="off"
                  {...field}
                  value={formatDateForInput(value)}
                  onChange={(e) => onChange(new Date(e.target.value))}
                />
              </FormControl>
              <FormMessage id="end-date-description" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}; 