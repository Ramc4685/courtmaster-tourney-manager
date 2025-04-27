
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
  // Get current format for conditional fields
  const gameType = form.watch("gameType");
  
  return (
    <div className="space-y-6 animate-fade-in">
      <FormField
        control={form.control}
        name="gameType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tournament Format</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="input-focus">
                  <SelectValue placeholder="Select a tournament format" />
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
