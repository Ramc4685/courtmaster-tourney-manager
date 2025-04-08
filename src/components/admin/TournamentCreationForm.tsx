
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { tournamentFormSchema, TournamentFormValues, TournamentFormat } from "./tournament/types";
import BasicInfoTab from "./tournament/BasicInfoTab";
import FormatTab from "./tournament/FormatTab";
import DivisionsTab from "./tournament/DivisionsTab";
import RegistrationTab from "./tournament/RegistrationTab";
import ScoringTab from "./tournament/ScoringTab";

export interface CreateTournamentFormProps {
  onSubmit: (data: TournamentFormValues) => void;
}

const CreateTournamentForm: React.FC<CreateTournamentFormProps> = ({ onSubmit }) => {
  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
      format: TournamentFormat.SINGLE_ELIMINATION,
      registrationEnabled: false,
      divisions: [],
      scoringRules: {
        pointsToWin: 11,
        mustWinByTwo: true,
      },
      categoryRegistrationRules: [],
      requirePlayerProfile: false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <BasicInfoTab form={form} />

        <Tabs defaultValue="format" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="divisions">Divisions</TabsTrigger>
            <TabsTrigger value="registration">Registration</TabsTrigger>
            <TabsTrigger value="scoring">Scoring</TabsTrigger>
          </TabsList>
          <TabsContent value="format">
            <FormatTab form={form} />
          </TabsContent>
          <TabsContent value="divisions">
            <DivisionsTab form={form} />
          </TabsContent>
          <TabsContent value="registration">
            <RegistrationTab form={form} />
          </TabsContent>
          <TabsContent value="scoring">
            <ScoringTab form={form} />
          </TabsContent>
        </Tabs>

        <Button type="submit" className="w-full">
          Create Tournament
        </Button>
      </form>
    </Form>
  );
};

export default CreateTournamentForm;
