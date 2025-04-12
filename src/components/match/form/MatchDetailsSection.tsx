import React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "@/components/match/StandaloneMatchForm";

interface MatchDetailsSectionProps {
  form: UseFormReturn<FormValues>;
}

const MatchDetailsSection: React.FC<MatchDetailsSectionProps> = ({ form }) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="scheduledDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Match Date/Time (Optional)</FormLabel>
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
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="courtName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Court Name (Optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter court name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="tournamentName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tournament Name (Optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter tournament name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Division/Category (Optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter division or category" />
              </FormControl>
              <FormDescription>
                Ex: Men's Singles, Mixed Doubles, Open Division, etc.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={form.control}
        name="isPublic"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Make match publicly viewable</FormLabel>
              <FormDescription>
                Anyone with the link will be able to view this match's scores
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </>
  );
};

export default MatchDetailsSection;
