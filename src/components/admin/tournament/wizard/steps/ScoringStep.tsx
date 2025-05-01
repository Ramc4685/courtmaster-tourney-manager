import React from 'react';
import { Control } from 'react-hook-form';
import { TournamentFormValues } from '../types';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ScoringStepProps {
  control: Control<TournamentFormValues>;
}

const ScoringStep: React.FC<ScoringStepProps> = ({ control }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Scoring Rules</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-4">
        <FormField
          control={control}
          name="scoringRules.pointsToWinSet"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Points to Win Set</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
              </FormControl>
              <FormDescription>Points required to win a standard set.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="scoringRules.setsToWinMatch"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sets to Win Match</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
              </FormControl>
              <FormDescription>Number of sets required to win the match.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="scoringRules.maxSets"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Sets per Match</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
              </FormControl>
              <FormDescription>The maximum number of sets allowed in a match.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="scoringRules.maxPointsPerSet"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Points per Set</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
              </FormControl>
              <FormDescription>The maximum score a player/team can reach in a set (e.g., 30 in badminton).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="scoringRules.mustWinByTwo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 col-span-1 md:col-span-2">
              <div className="space-y-0.5">
                <FormLabel>Must Win by Two Points</FormLabel>
                <FormDescription>
                  Require a player/team to lead by two points to win the set (up to max points).
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

        <FormField
          control={control}
          name="scoringRules.tiebreakerFormat"
          render={({ field }) => (
            <FormItem className="col-span-1 md:col-span-2">
              <FormLabel>Tiebreaker Format (Optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tiebreaker format if applicable" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="standard_tiebreak_7">Standard Tiebreak (First to 7, win by 2)</SelectItem>
                  <SelectItem value="super_tiebreak_10">Super Tiebreak (First to 10, win by 2)</SelectItem>
                  {/* Add other common tiebreaker formats */}
                  <SelectItem value="none">No Tiebreaker</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Specify the format for tiebreakers if used (e.g., in final set).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default ScoringStep;

