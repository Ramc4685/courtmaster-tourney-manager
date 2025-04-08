
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { tournamentFormSchema, TournamentFormValues } from "./types";
import BasicInfoTab from "./BasicInfoTab";
import FormatTab from "./FormatTab";
import DivisionsTab from "./DivisionsTab";
import RegistrationTab from "./RegistrationTab";
import ScoringTab from "./ScoringTab";

interface CreateTournamentFormProps {
  onSubmit: (data: TournamentFormValues) => void;
}

const CreateTournamentForm: React.FC<CreateTournamentFormProps> = ({ onSubmit }) => {
  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
      registrationEnabled: false,
      divisions: [],
      scoringRules: {
        pointsToWin: 11,
        mustWinByTwo: true,
      },
      categoryRegistrationRules: [],
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
