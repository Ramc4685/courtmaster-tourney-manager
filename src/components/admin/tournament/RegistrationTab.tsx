
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { UseFormReturn } from "react-hook-form";
import { TournamentFormValues } from "./types";

interface RegistrationTabProps {
  form: UseFormReturn<TournamentFormValues>;
}

const RegistrationTab: React.FC<RegistrationTabProps> = ({ form }) => {
  return (
    <div className="space-y-4 py-4">
      <FormField
        control={form.control}
        name="registrationEnabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Enable Registration</FormLabel>
              <FormDescription>
                Allow participants to register for this tournament.
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
        <FormField
          control={form.control}
          name="registrationDeadline"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Registration Deadline</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a deadline date</span>
                      )}
                      <Calendar className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date() || date > form.getValues("startDate")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Set a deadline for tournament registration. Must be before the tournament start date.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {form.watch("registrationEnabled") && (
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
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    field.onChange(isNaN(value) ? "" : value);
                  }}
                />
              </FormControl>
              <FormDescription>
                Set a maximum limit for the number of teams that can register. Leave empty for unlimited.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {form.watch("registrationEnabled") && (
        <FormField
          control={form.control}
          name="requirePlayerProfile"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Require Player Profiles</FormLabel>
                <FormDescription>
                  Require players to have complete profiles before registering.
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
      )}
    </div>
  );
};

export default RegistrationTab;
