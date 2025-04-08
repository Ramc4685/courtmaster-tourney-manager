import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTournament } from "@/contexts/tournament/useTournament";
import { useNavigate } from "react-router-dom";

// Define the form schema with Zod
const tournamentFormSchema = z.object({
  name: z.string().min(2, {
    message: "Tournament name must be at least 2 characters.",
  }),
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
  startDate: z.date({
    required_error: "Start date is required.",
  }),
  endDate: z.date({
    required_error: "End date is required.",
  }),
  format: z.enum(["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "ROUND_ROBIN"], {
    required_error: "Tournament format is required.",
  }),
  description: z.string().optional(),
  registrationEnabled: z.boolean().default(true),
  registrationDeadline: z.date().optional(),
  scoringRules: z.string().optional(),
  divisions: z.array(z.object({
    name: z.string().min(1, { message: "Division name is required." }),
    categories: z.array(z.object({
      name: z.string().min(1, { message: "Category name is required." }),
      type: z.enum(["MENS_SINGLES", "WOMENS_SINGLES", "MENS_DOUBLES", "WOMENS_DOUBLES", "MIXED_DOUBLES"]),
    })).default([]),
  })).default([]),
});

type TournamentFormValues = z.infer<typeof tournamentFormSchema>;

const TournamentCreationForm: React.FC = () => {
  const { createTournament } = useTournament();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("basic");

  // Initialize form with default values
  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: "",
      location: "",
      registrationEnabled: true,
      divisions: [],
    },
  });

  // Handle form submission
  const onSubmit = async (data: TournamentFormValues) => {
    try {
      await createTournament(data);
      navigate("/tournaments");
    } catch (error) {
      console.error("Error creating tournament:", error);
    }
  };

  // Add a new division
  const addDivision = () => {
    const divisions = form.getValues("divisions") || [];
    form.setValue("divisions", [
      ...divisions,
      { name: "", categories: [] },
    ]);
  };

  // Remove a division
  const removeDivision = (index: number) => {
    const divisions = form.getValues("divisions") || [];
    form.setValue(
      "divisions",
      divisions.filter((_, i) => i !== index)
    );
  };

  // Add a category to a division
  const addCategory = (divisionIndex: number) => {
    const divisions = form.getValues("divisions") || [];
    const updatedDivisions = [...divisions];
    updatedDivisions[divisionIndex].categories = [
      ...updatedDivisions[divisionIndex].categories,
      { name: "", type: "MENS_SINGLES" },
    ];
    form.setValue("divisions", updatedDivisions);
  };

  // Remove a category from a division
  const removeCategory = (divisionIndex: number, categoryIndex: number) => {
    const divisions = form.getValues("divisions") || [];
    const updatedDivisions = [...divisions];
    updatedDivisions[divisionIndex].categories = 
      updatedDivisions[divisionIndex].categories.filter((_, i) => i !== categoryIndex);
    form.setValue("divisions", updatedDivisions);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create Tournament</CardTitle>
        <CardDescription>
          Fill in the details to create a new tournament
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="format">Format</TabsTrigger>
                <TabsTrigger value="divisions">Divisions</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4">
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
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter tournament location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
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
                              disabled={(date) =>
                                date < new Date()
                              }
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
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
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
                              disabled={(date) =>
                                date < new Date()
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter tournament description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Format Tab */}
              <TabsContent value="format" className="space-y-4">
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
                          <SelectItem value="SINGLE_ELIMINATION">Single Elimination</SelectItem>
                          <SelectItem value="DOUBLE_ELIMINATION">Double Elimination</SelectItem>
                          <SelectItem value="ROUND_ROBIN">Round Robin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {field.value === "SINGLE_ELIMINATION" && 
                          "Teams are eliminated after one loss. The last team standing wins."}
                        {field.value === "DOUBLE_ELIMINATION" && 
                          "Teams must lose twice to be eliminated. The last team standing wins."}
                        {field.value === "ROUND_ROBIN" && 
                          "Each team plays against every other team once. The team with the most wins is the champion."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Divisions Tab */}
              <TabsContent value="divisions" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Divisions</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addDivision}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Division
                    </Button>
                  </div>

                  {form.watch("divisions")?.map((division, divisionIndex) => (
                    <Card key={divisionIndex} className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <FormField
                          control={form.control}
                          name={`divisions.${divisionIndex}.name`}
                          render={({ field }) => (
                            <FormItem className="flex-1 mr-4">
                              <FormControl>
                                <Input placeholder="Division name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeDivision(divisionIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-medium">Categories</h4>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => addCategory(divisionIndex)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Category
                          </Button>
                        </div>

                        {division.categories?.map((category, categoryIndex) => (
                          <div key={categoryIndex} className="flex items-center gap-2">
                            <FormField
                              control={form.control}
                              name={`divisions.${divisionIndex}.categories.${categoryIndex}.name`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input placeholder="Category name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`divisions.${divisionIndex}.categories.${categoryIndex}.type`}
                              render={({ field }) => (
                                <FormItem className="w-40">
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="MENS_SINGLES">Men's Singles</SelectItem>
                                      <SelectItem value="WOMENS_SINGLES">Women's Singles</SelectItem>
                                      <SelectItem value="MENS_DOUBLES">Men's Doubles</SelectItem>
                                      <SelectItem value="WOMENS_DOUBLES">Women's Doubles</SelectItem>
                                      <SelectItem value="MIXED_DOUBLES">Mixed Doubles</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeCategory(divisionIndex, categoryIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <FormField
                  control={form.control}
                  name="registrationEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Registration</FormLabel>
                        <FormDescription>
                          Allow teams to register for this tournament
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
                                  <span>Pick a deadline</span>
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
                              disabled={(date) =>
                                date < new Date()
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="scoringRules"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scoring Rules</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter scoring rules" {...field} />
                      </FormControl>
                      <FormDescription>
                        Describe the scoring rules for this tournament
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end">
              <Button type="submit">Create Tournament</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TournamentCreationForm; 