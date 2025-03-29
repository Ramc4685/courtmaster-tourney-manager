import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox } from "@/components/ui/checkbox";
import { useTournament } from "@/contexts/tournament/useTournament";
import { TournamentCategory, TournamentFormat, CourtStatus } from "@/types/tournament";
import TournamentCategorySection from "@/components/tournament/TournamentCategorySection";
import { createDefaultCategories } from "@/utils/categoryUtils";
import { Grid3X3Icon } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Tournament name must be at least 2 characters.",
  }),
  format: z.enum(['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'SWISS', 'GROUP_KNOCKOUT', 'MULTI_STAGE']),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  divisionProgression: z.boolean().default(false),
  autoAssignCourts: z.boolean().default(false),
  numCourts: z.number().min(1).max(20).default(4),
});

type FormValues = z.infer<typeof formSchema>;

const TournamentCreate: React.FC = () => {
  const { createTournament, loadSampleData } = useTournament();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<TournamentCategory[]>(createDefaultCategories());

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      format: "SINGLE_ELIMINATION",
      description: "",
      startDate: new Date(),
      endDate: undefined,
      divisionProgression: false,
      autoAssignCourts: false,
      numCourts: 4,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network request

      // Generate courts based on numCourts value
      const courts = Array.from({ length: values.numCourts }, (_, index) => ({
        id: crypto.randomUUID(),
        name: `Court ${index + 1}`,
        number: index + 1,
        status: "AVAILABLE" as CourtStatus  // Explicitly type as CourtStatus
      }));

      const tournament = createTournament({
        ...values,
        categories: categories,
        status: "DRAFT", // Add required properties
        teams: [],      // Add required empty array
        courts: courts  // Add courts based on numCourts
      });

      navigate(`/tournaments/${tournament.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Create Tournament</h1>
        <Button variant="secondary" onClick={() => loadSampleData()}>
          <Grid3X3Icon className="h-4 w-4 mr-2" />
          Load Sample Data
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tournament Details</CardTitle>
          <CardDescription>
            Enter the details for your new tournament.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Format</FormLabel>
                    <FormControl>
                      <select className="border rounded px-3 py-2 w-full" {...field}>
                        <option value="SINGLE_ELIMINATION">Single Elimination</option>
                        <option value="DOUBLE_ELIMINATION">Double Elimination</option>
                        <option value="ROUND_ROBIN">Round Robin</option>
                        <option value="SWISS">Swiss</option>
                        <option value="GROUP_KNOCKOUT">Group Knockout</option>
                        <option value="MULTI_STAGE">Multi Stage</option>
                      </select>
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
                      <Input placeholder="Enter description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
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
                      <Input
                        type="date"
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numCourts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Courts</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="divisionProgression"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-1 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Enable Division Progression
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="autoAssignCourts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-1 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Auto Assign Courts
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <TournamentCategorySection
                categories={categories}
                onCategoriesChange={setCategories}
                parentFormat={form.watch("format") as TournamentFormat}
              />
              <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Tournament"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentCreate;
