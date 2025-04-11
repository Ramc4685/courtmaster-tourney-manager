
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { CalendarIcon, Trophy, Plus } from "lucide-react";
import { TournamentFormat } from "@/types/tournament-enums";
import { tournamentFormSchema, TournamentFormValues } from "./tournament/types";

export interface CreateTournamentFormProps {
  onSubmit: (data: TournamentFormValues) => void;
}

const CreateTournamentForm: React.FC<CreateTournamentFormProps> = ({ onSubmit }) => {
  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: "",
      location: "",
      format: TournamentFormat.SINGLE_ELIMINATION,
      registrationEnabled: false,
      maxTeams: 8,
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const watchRegEnabled = form.watch("registrationEnabled");

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-md border-0">
      <CardHeader className="bg-card-foreground/5 border-b">
        <CardTitle className="text-3xl font-bold">Create New Tournament</CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Tournament Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter tournament name" 
                          {...field} 
                          className="h-12 text-base rounded-md" 
                        />
                      </FormControl>
                      <FormMessage className="text-destructive" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Location</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter location" 
                          {...field} 
                          className="h-12 text-base rounded-md" 
                        />
                      </FormControl>
                      <FormMessage className="text-destructive" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Start Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CalendarIcon className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            type="date"
                            {...field}
                            className="h-12 text-base pl-10 rounded-md"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-destructive" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">End Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CalendarIcon className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            type="date"
                            {...field}
                            className="h-12 text-base pl-10 rounded-md"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-destructive" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Tournament Format</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 text-base rounded-md">
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(TournamentFormat).map((format) => (
                            <SelectItem key={format} value={format} className="text-base">
                              {format.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxTeams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Max Teams</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter max teams"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 8)}
                          className="h-12 text-base rounded-md"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registrationEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-6 pt-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="h-6 w-6 rounded-md data-[state=checked]:bg-court-green"
                        />
                      </FormControl>
                      <FormLabel className="text-base font-medium">Enable Registration</FormLabel>
                    </FormItem>
                  )}
                />

                {watchRegEnabled && (
                  <FormField
                    control={form.control}
                    name="registrationDeadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Registration Deadline</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CalendarIcon className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                            <Input
                              type="date"
                              {...field}
                              className="h-12 text-base pl-10 rounded-md"
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-court-green" />
                  Divisions & Categories
                </h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-10 border-court-green text-court-green hover:bg-court-green/10"
                >
                  <Plus className="mr-1 h-4 w-4" /> Add Division
                </Button>
              </div>
              
              <div className="text-muted-foreground text-center py-6">
                No divisions added yet. Add divisions to organize your tournament.
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                className="h-12 px-6 text-base" 
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="h-12 px-6 text-base font-medium bg-court-green hover:bg-court-green/90"
              >
                Create Tournament
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateTournamentForm;
