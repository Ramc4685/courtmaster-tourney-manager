import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ChevronRight, Save, ArrowRight, Calendar, Users, Trophy } from "lucide-react";

// Form validation schema
const tournamentFormSchema = z.object({
  name: z.string().min(3, "Tournament name must be at least 3 characters"),
  sportType: z.string().min(1, "Sport type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  description: z.string().optional(),
  registrationDeadline: z.string().min(1, "Registration deadline is required"),
  maxParticipants: z.string().min(1, "Maximum participants is required"),
  entryFee: z.string().optional(),
  isTeamBased: z.boolean().default(false),
  teamSize: z.string().optional(),
});

export const TournamentWizardPage = () => {
  const [step, setStep] = useState(1);
  const [totalSteps] = useState(3);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form definition
  const form = useForm<z.infer<typeof tournamentFormSchema>>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: "",
      sportType: "",
      startDate: "",
      endDate: "",
      location: "",
      description: "",
      registrationDeadline: "",
      maxParticipants: "",
      entryFee: "",
      isTeamBased: false,
      teamSize: "",
    },
  });

  const onSubmit = (values: z.infer<typeof tournamentFormSchema>) => {
    if (step < totalSteps) {
      setStep(step + 1);
      return;
    }
    
    toast({
      title: "Tournament Creation Started",
      description: "Your tournament is being created. This feature is under development.",
    });
    
    // In a complete implementation, this would save the tournament and redirect
    navigate("/tournaments");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Tournament</h1>
          <p className="text-muted-foreground">
            Step {step} of {totalSteps}: {step === 1 ? "Basic Information" : step === 2 ? "Tournament Structure" : "Review & Create"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tournament Wizard</CardTitle>
          <CardDescription>Complete each step to create your tournament</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center">
              <div className={`rounded-full p-2 ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Calendar className="h-5 w-5" />
              </div>
              <div className={`h-1 w-12 ${step > 1 ? 'bg-primary' : 'bg-muted'}`}></div>
              <div className={`rounded-full p-2 ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Users className="h-5 w-5" />
              </div>
              <div className={`h-1 w-12 ${step > 2 ? 'bg-primary' : 'bg-muted'}`}></div>
              <div className={`rounded-full p-2 ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Trophy className="h-5 w-5" />
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tournament Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter tournament name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sportType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sport Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sport type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="basketball">Basketball</SelectItem>
                            <SelectItem value="volleyball">Volleyball</SelectItem>
                            <SelectItem value="tennis">Tennis</SelectItem>
                            <SelectItem value="soccer">Soccer</SelectItem>
                            <SelectItem value="badminton">Badminton</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter tournament description" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {step === 2 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isTeamBased"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Team-Based Tournament</FormLabel>
                          <FormDescription>
                            Switch on for team registration, off for individual players
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
                  
                  {form.watch("isTeamBased") && (
                    <FormField
                      control={form.control}
                      name="teamSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team Size</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Enter number of players per team" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="registrationDeadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Deadline</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Participants</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter maximum number of participants" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="entryFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Fee (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter entry fee amount" {...field} />
                        </FormControl>
                        <FormDescription>
                          Leave empty if the tournament is free to enter
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {step === 3 && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tournament Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-muted-foreground">Tournament Name</h4>
                          <p>{form.getValues("name")}</p>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-muted-foreground">Sport Type</h4>
                          <p>{form.getValues("sportType")}</p>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-muted-foreground">Dates</h4>
                          <p>{form.getValues("startDate")} to {form.getValues("endDate")}</p>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
                          <p>{form.getValues("location")}</p>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-muted-foreground">Registration Type</h4>
                          <p>{form.getValues("isTeamBased") ? "Team-based" : "Individual"}</p>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-muted-foreground">Registration Deadline</h4>
                          <p>{form.getValues("registrationDeadline")}</p>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-muted-foreground">Maximum Participants</h4>
                          <p>{form.getValues("maxParticipants")}</p>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-muted-foreground">Entry Fee</h4>
                          <p>{form.getValues("entryFee") || "Free"}</p>
                        </div>
                      </div>
                      
                      {form.getValues("description") && (
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                          <p>{form.getValues("description")}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => step > 1 && setStep(step - 1)}
                  disabled={step === 1}
                >
                  Previous
                </Button>
                
                <Button type="submit">
                  {step < totalSteps ? (
                    <>
                      Next <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Create Tournament <Save className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentWizardPage;
