
import React from "react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { TournamentFormValues } from "./types";
import { TournamentFormat, GameType } from "@/types/tournament-enums";

interface FormatTabProps {
  form: UseFormReturn<TournamentFormValues>;
}

const FormatTab: React.FC<FormatTabProps> = ({ form }) => {
  // Get current format for conditional fields
  const gameType = form.watch("gameType");
  
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="gameType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tournament Format</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tournament format" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={GameType.SINGLE_ELIMINATION}>Single Elimination</SelectItem>
                <SelectItem value={GameType.DOUBLE_ELIMINATION}>Double Elimination</SelectItem>
                <SelectItem value={GameType.ROUND_ROBIN}>Round Robin</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              {gameType === GameType.SINGLE_ELIMINATION && 
                "Teams are eliminated after one loss. The last team standing wins."}
              {gameType === GameType.DOUBLE_ELIMINATION && 
                "Teams must lose twice to be eliminated. The last team standing wins."}
              {gameType === GameType.ROUND_ROBIN && 
                "Each team plays against every other team once. The team with the most wins is the champion."}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator className="my-4" />
      
      {/* Registration settings section - connects tournament format with registration requirements */}
      <div>
        <h3 className="text-lg font-medium mb-4">Registration Settings</h3>
        
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="registrationEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Enable Registration</FormLabel>
                  <FormDescription>
                    Allow players and teams to register for this tournament
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

          {form.watch("registrationEnabled") && (
            <>
              <FormField
                control={form.control}
                name="registrationDeadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Deadline</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? new Date(field.value).toISOString().slice(0, 10) : ""}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined;
                          field.onChange(date);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Last day players can register for this tournament
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Format-specific registration settings */}
              {gameType === GameType.SINGLE_ELIMINATION && (
                <FormField
                  control={form.control}
                  name="maxTeams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Teams</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={2}
                          placeholder="Enter maximum number of teams"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        For Single Elimination, team count should ideally be a power of 2 (e.g., 8, 16, 32)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {gameType === GameType.DOUBLE_ELIMINATION && (
                <FormField
                  control={form.control}
                  name="maxTeams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Teams</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={2}
                          placeholder="Enter maximum number of teams"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        For Double Elimination, recommended team count is a power of 2 for optimal bracket formation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {gameType === GameType.ROUND_ROBIN && (
                <FormField
                  control={form.control}
                  name="maxTeams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Teams</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={2}
                          max={16}
                          placeholder="Enter maximum number of teams"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        For Round Robin, recommended maximum is 16 teams to keep match count manageable
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormatTab;
