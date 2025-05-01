import React from 'react';
import { Control, useFormContext } from 'react-hook-form';
import { TournamentFormValues } from '../types';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface RegistrationStepProps {
  control: Control<TournamentFormValues>;
}

const RegistrationStep: React.FC<RegistrationStepProps> = ({ control }) => {
  const { watch } = useFormContext<TournamentFormValues>();
  const registrationEnabled = watch('registration.enabled');

  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return '';
    // Ensure date is treated as local time, not UTC, for input display
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="registration.enabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Enable Online Registration</FormLabel>
              <FormDescription>
                Allow players/teams to register for the tournament online.
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {registrationEnabled && (
        <div className="space-y-4 rounded-lg border p-4">
          <FormField
            control={control}
            name="registration.deadline"
            render={({ field: { value, onChange, ...fieldProps } }) => (
              <FormItem>
                <FormLabel>Registration Deadline</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...fieldProps}
                    value={formatDateForInput(value)}
                    onChange={(e) => {
                      // Parse date as local time
                      const dateValue = e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined;
                      onChange(dateValue);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="registration.maxEntries"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Entries (Overall)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Leave blank for unlimited" {...field} onChange={e => field.onChange(parseInt(e.target.value) || undefined)} />
                </FormControl>
                <FormDescription>
                  Set an overall limit for the total number of players/teams.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Option to set max entries per category - might need more complex logic if enabled */}
          {/* <FormField
            control={control}
            name="registration.maxEntriesPerCategory"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Set maximum entries per category</FormLabel>
              </FormItem>
            )}
          /> */}

          <FormField
            control={control}
            name="registration.allowWaitlist"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Allow Waitlist</FormLabel>
                <FormDescription>
                  If enabled, registrations beyond the limit will be added to a waitlist.
                </FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="registration.requirePlayerProfile"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Require Player Profile</FormLabel>
                 <FormDescription>
                  Require participants to have a complete profile before registering.
                </FormDescription>
              </FormItem>
            )}
          />
          
           <FormField
            control={control}
            name="registration.waiverRequired"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Require Digital Waiver</FormLabel>
                 <FormDescription>
                  Participants must accept a digital waiver during registration.
                </FormDescription>
              </FormItem>
            )}
          />

          {/* Fee Amount - Future Implementation */}
          {/* <FormField
            control={control}
            name="registration.feeAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration Fee (Optional)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter fee amount" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} />
                </FormControl>
                <FormDescription>
                  Payment processing integration is required for fees.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          /> */}
        </div>
      )}
    </div>
  );
};

export default RegistrationStep;

