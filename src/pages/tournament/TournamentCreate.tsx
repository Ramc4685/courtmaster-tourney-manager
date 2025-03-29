
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTournament } from "@/contexts/TournamentContext";
import { useToast } from "@/hooks/use-toast";
import TournamentScoringForm from "@/components/tournament/TournamentScoringForm";
import { TournamentCategory, TournamentFormat } from "@/types/tournament";
import TournamentCategorySection from "@/components/tournament/TournamentCategorySection";
import { createDefaultCategories } from "@/utils/categoryUtils";

const formSchema = z.object({
  name: z.string().min(3, { message: "Tournament name must be at least 3 characters" }),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  maxPoints: z.number().min(1, { message: "Maximum points must be at least 1" }),
  maxSets: z.number().min(1, { message: "Maximum sets must be at least 1" }),
  requireTwoPointLead: z.boolean().default(true),
  maxTwoPointLeadScore: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const TournamentCreate = () => {
  const navigate = useNavigate();
  const { createTournament, loadCategoryDemoData } = useTournament();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<TournamentCategory[]>(createDefaultCategories());
  // Default format is MULTI_STAGE (no longer showing in UI but used as fallback)
  const defaultFormat: TournamentFormat = "MULTI_STAGE";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: new Date().toISOString().slice(0, 10),
      maxPoints: 21,
      maxSets: 3,
      requireTwoPointLead: true,
      maxTwoPointLeadScore: 30,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      console.log("Creating tournament with categories:", categories);
      
      // Create the tournament using the default format
      const newTournament = createTournament({
        name: values.name,
        description: values.description,
        format: defaultFormat,
        status: "DRAFT",
        startDate: new Date(values.startDate),
        endDate: values.endDate ? new Date(values.endDate) : undefined,
        teams: [],
        courts: [],
        categories: categories,
        scoringSettings: {
          maxPoints: values.maxPoints,
          maxSets: values.maxSets,
          requireTwoPointLead: values.requireTwoPointLead,
          maxTwoPointLeadScore: values.maxTwoPointLeadScore,
        },
      });
      
      // After tournament is created, load demo data for categories that have it enabled
      const categoriesToLoadDemoData = categories.filter(c => c.addDemoData);
      if (categoriesToLoadDemoData.length > 0) {
        console.log(`Loading demo data for ${categoriesToLoadDemoData.length} categories`);
        
        // Process demo data loading with delay to ensure tournament is created first
        setTimeout(() => {
          categoriesToLoadDemoData.forEach(category => {
            // Use category-specific format or fallback to default
            const categoryFormat = category.format || defaultFormat;
            console.log(`Loading demo data for category ${category.name} with format ${categoryFormat}`);
            loadCategoryDemoData(newTournament.id, category.id, categoryFormat);
          });
        }, 100);
      }
      
      toast({
        title: "Tournament created",
        description: "Your tournament has been created successfully",
      });
      
      navigate(`/tournaments/${newTournament.id}`);
    } catch (error) {
      console.error("Error creating tournament:", error);
      toast({
        title: "Error",
        description: "There was an error creating the tournament",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create Tournament</CardTitle>
            <CardDescription>
              Set up your new tournament with basic details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter tournament description"
                          {...field}
                        />
                      </FormControl>
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
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <TournamentCategorySection 
                  categories={categories}
                  onCategoriesChange={setCategories}
                  parentFormat={defaultFormat}
                />

                <TournamentScoringForm 
                  maxPoints={form.watch('maxPoints')}
                  maxSets={form.watch('maxSets')}
                  requireTwoPointLead={form.watch('requireTwoPointLead')}
                  maxTwoPointLeadScore={form.watch('maxTwoPointLeadScore')}
                  onMaxPointsChange={(value) => form.setValue('maxPoints', value)}
                  onMaxSetsChange={(value) => form.setValue('maxSets', value)}
                  onRequireTwoPointLeadChange={(value) => form.setValue('requireTwoPointLead', value)}
                  onMaxTwoPointLeadScoreChange={(value) => form.setValue('maxTwoPointLeadScore', value)}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/tournaments")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Tournament"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TournamentCreate;
