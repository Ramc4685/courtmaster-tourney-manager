
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TournamentFormat } from "@/types/tournament-enums";
import { tournamentFormSchema, TournamentFormValues } from "./types";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

interface CreateTournamentFormProps {
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

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Create New Tournament</CardTitle>
        <CardDescription>Fill in the tournament details to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tournament Name</label>
                  <Input
                    placeholder="Enter tournament name"
                    {...form.register("name")}
                    className="w-full"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    placeholder="Enter location"
                    {...form.register("location")}
                    className="w-full"
                  />
                  {form.formState.errors.location && (
                    <p className="text-sm text-red-500">{form.formState.errors.location.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tournament Format</label>
                  <Select
                    onValueChange={(value) => form.setValue("format", value as TournamentFormat)}
                    defaultValue={form.getValues("format")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TournamentFormat).map((format) => (
                        <SelectItem key={format} value={format}>
                          {format.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Teams</label>
                  <Input
                    type="number"
                    placeholder="Enter max teams"
                    {...form.register("maxTeams", { valueAsNumber: true })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  {...form.register("startDate")}
                  className="w-full"
                />
                {form.formState.errors.startDate && (
                  <p className="text-sm text-red-500">{form.formState.errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  {...form.register("endDate")}
                  className="w-full"
                />
                {form.formState.errors.endDate && (
                  <p className="text-sm text-red-500">{form.formState.errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="registrationEnabled"
                checked={form.watch("registrationEnabled")}
                onCheckedChange={(checked) => form.setValue("registrationEnabled", checked as boolean)}
              />
              <label htmlFor="registrationEnabled" className="text-sm font-medium">
                Enable Registration
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" type="button" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <Button type="submit">Create Tournament</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateTournamentForm;
