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
import { UseFormReturn } from "react-hook-form";
import { TournamentFormValues, TournamentFormat } from "./types";

interface FormatTabProps {
  form: UseFormReturn<TournamentFormValues>;
}

const FormatTab: React.FC<FormatTabProps> = ({ form }) => {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="format"
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
                <SelectItem value={TournamentFormat.SINGLE_ELIMINATION}>Single Elimination</SelectItem>
                <SelectItem value={TournamentFormat.DOUBLE_ELIMINATION}>Double Elimination</SelectItem>
                <SelectItem value={TournamentFormat.ROUND_ROBIN}>Round Robin</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              {field.value === TournamentFormat.SINGLE_ELIMINATION && 
                "Teams are eliminated after one loss. The last team standing wins."}
              {field.value === TournamentFormat.DOUBLE_ELIMINATION && 
                "Teams must lose twice to be eliminated. The last team standing wins."}
              {field.value === TournamentFormat.ROUND_ROBIN && 
                "Each team plays against every other team once. The team with the most wins is the champion."}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default FormatTab; 