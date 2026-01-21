
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
import { GameType, TournamentFormat } from "@/types/tournament-enums";

interface FormatTabProps {
  form: UseFormReturn<TournamentFormValues>;
}

const FormatTab: React.FC<FormatTabProps> = ({ form }) => {
  // Get current values for conditional fields
  const gameType = form.watch("gameType");
  const format = form.watch("format");
  
  return (
    <div className="space-y-6 animate-fade-in">
      <FormField
        control={form.control}
        name="gameType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sport Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="input-focus">
                  <SelectValue placeholder="Select a sport type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={GameType.BADMINTON}>Badminton</SelectItem>
                <SelectItem value={GameType.TENNIS}>Tennis</SelectItem>
                <SelectItem value={GameType.PICKLEBALL}>Pickleball</SelectItem>
                <SelectItem value={GameType.VOLLEYBALL}>Volleyball</SelectItem>
                <SelectItem value={GameType.SQUASH}>Squash</SelectItem>
                <SelectItem value={GameType.TABLE_TENNIS}>Table Tennis</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              {gameType === GameType.BADMINTON && 
                "Standard badminton tournament with customizable scoring rules."}
              {gameType === GameType.TENNIS && 
                "Standard tennis tournament with customizable scoring rules."}
              {gameType === GameType.PICKLEBALL && 
                "Standard pickleball tournament with customizable scoring rules."}
              {gameType === GameType.VOLLEYBALL && 
                "Standard volleyball tournament with customizable scoring rules."}
              {gameType === GameType.SQUASH && 
                "Standard squash tournament with customizable scoring rules."}
              {gameType === GameType.TABLE_TENNIS && 
                "Standard table tennis tournament with customizable scoring rules."}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="format"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tournament Format</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="input-focus">
                  <SelectValue placeholder="Select tournament format" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={TournamentFormat.SINGLE_ELIMINATION}>Single Elimination</SelectItem>
                <SelectItem value={TournamentFormat.DOUBLE_ELIMINATION}>Double Elimination</SelectItem>
                <SelectItem value={TournamentFormat.ROUND_ROBIN}>Round Robin</SelectItem>
                <SelectItem value={TournamentFormat.SWISS}>Swiss System</SelectItem>
                <SelectItem value={TournamentFormat.GROUP_KNOCKOUT}>Group + Knockout</SelectItem>
                <SelectItem value={TournamentFormat.MULTI_STAGE}>Multi-Stage</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              {format === TournamentFormat.SINGLE_ELIMINATION && 
                "Teams are eliminated after one loss. Fast and exciting format."}
              {format === TournamentFormat.DOUBLE_ELIMINATION && 
                "Teams must lose twice to be eliminated. More matches, more chances."}
              {format === TournamentFormat.ROUND_ROBIN && 
                "Every team plays every other team. Most comprehensive format."}
              {format === TournamentFormat.SWISS && 
                "Teams with similar records play each other. Balanced competition."}
              {format === TournamentFormat.GROUP_KNOCKOUT && 
                "Group stage followed by knockout rounds. Best of both worlds."}
              {format === TournamentFormat.MULTI_STAGE && 
                "Custom multi-stage tournament with flexible progression."}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator className="my-4" />
      
      {/* Registration settings section */}
      <div>
        <h3 className="text-lg font-medium mb-4">Registration Settings</h3>
        
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="registrationEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 interactive-hover">
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
                        className="input-focus"
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
                        className="input-focus"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Recommended team count for optimal scheduling
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormatTab;
