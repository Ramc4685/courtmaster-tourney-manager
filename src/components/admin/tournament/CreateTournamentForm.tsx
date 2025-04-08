import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { tournamentFormSchema, TournamentFormValues } from "./types";
import BasicInfoTab from "./BasicInfoTab";
import DivisionsTab from "./DivisionsTab";
import RegistrationTab from "./RegistrationTab";

const CreateTournamentForm: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: "",
      location: "",
      startDate: new Date(),
      endDate: new Date(),
      description: "",
      registrationEnabled: true,
      divisions: [],
    },
  });

  const onSubmit = async (data: TournamentFormValues) => {
    try {
      // TODO: Implement tournament creation
      console.log("Form data:", data);
      toast({
        title: "Success",
        description: "Tournament created successfully",
      });
      navigate("/admin/tournaments");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create tournament",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Tournament</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="divisions">Divisions & Categories</TabsTrigger>
              <TabsTrigger value="registration">Registration</TabsTrigger>
            </TabsList>
            <TabsContent value="basic">
              <BasicInfoTab form={form} />
            </TabsContent>
            <TabsContent value="divisions">
              <DivisionsTab form={form} />
            </TabsContent>
            <TabsContent value="registration">
              <RegistrationTab form={form} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/admin/tournaments")}
        >
          Cancel
        </Button>
        <Button type="submit">Create Tournament</Button>
      </div>
    </form>
  );
};

export default CreateTournamentForm;
