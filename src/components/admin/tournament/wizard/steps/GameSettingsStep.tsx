import React from 'react';
import { useFormContext } from 'react-hook-form';
import { WizardFormValues } from '../types';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const GameSettingsStep = () => {
  const form = useFormContext<WizardFormValues>();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scoring Rules</CardTitle>
          <CardDescription>Configure how games will be scored</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="scoringRules.pointsToWin"
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium mb-1">Points to Win</label>
                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
              </div>
            )}
          />

          <FormField
            control={form.control}
            name="scoringRules.mustWinByTwo"
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <label>Must win by two points</label>
              </div>
            )}
          />

          <FormField
            control={form.control}
            name="scoringRules.maxPoints"
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium mb-1">Maximum Points</label>
                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
              </div>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}; 