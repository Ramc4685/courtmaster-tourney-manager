
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
import { TournamentCategory, CourtStatus, Tournament, TournamentFormat } from "@/types/tournament";
import TournamentCategorySection from "@/components/tournament/TournamentCategorySection";
import TournamentFormatSelector from "@/components/tournament/TournamentFormatSelector";
import { createDefaultCategories } from "@/utils/categoryUtils";
import { Grid3X3Icon } from "lucide-react";

// Define the component props interface
interface TournamentCreateProps {
  onTournamentCreated?: (tournament: Tournament) => void;
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Tournament name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  format: z.string().min(1, { message: "Tournament format is required" }),
  divisionProgression: z.boolean().default(false),
  autoAssignCourts: z.boolean().default(false),
  numCourts: z.number().min(1).max(20).default(4),
});

type FormValues = z.infer<typeof formSchema>;

// Update component to accept props
const TournamentCreate: React.FC<TournamentCreateProps> = ({ onTournamentCreated }) => {
  const { createTournament, loadSampleData } = useTournament();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<TournamentCategory[]>(createDefaultCategories());

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      format: "SINGLE_ELIMINATION",
      startDate: new Date(),
      endDate: undefined,
      divisionProgression: false,
      autoAssignCourts: false,
      numCourts: 4,
    },
  });

  // Set format for all categories that don't have a specific one
  const handleFormatChange = (format: TournamentFormat) => {
    form.setValue("format", format);
    
    // Update any categories that don't have a format specified
    setCategories(prevCategories => 
      prevCategories.map(cat => 
        cat.format ? cat : { ...cat, format }
      )
    );
  };

  const onSubmit = async (values: FormValues) => {
    console.log("Form submitted with values:", values);
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

      // Ensure all categories have a format
      const finalCategories = categories.map(category => ({
        ...category,
        format: category.format || values.format as TournamentFormat
      }));

      const tournament = createTournament({
        name: values.name, // Ensure name is explicitly passed
        format: values.format as TournamentFormat, // Use the main tournament format
        description: values.description,
        startDate: values.startDate,
        endDate: values.endDate,
        divisionProgression: values.divisionProgression,
        autoAssignCourts: values.autoAssignCourts,
        categories: finalCategories, // Use categories with formats
        status: "DRAFT", // Add required properties
        teams: [],      // Add required empty array
        courts: courts  // Add courts based on numCourts
      });

      // Call the onTournamentCreated callback if provided
      if (onTournamentCreated) {
        console.log("Calling onTournamentCreated with tournament:", tournament);
        onTournamentCreated(tournament);
      } else {
        console.log("No onTournamentCreated provided, navigating to:", `/tournament/${tournament.id}`);
        navigate(`/tournament/${tournament.id}`);
      }
    } catch (error) {
      console.error("Error creating tournament:", error);
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
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Tournament Format</FormLabel>
                    <FormControl>
                      <TournamentFormatSelector
                        value={field.value as TournamentFormat}
                        onValueChange={(value) => handleFormatChange(value)}
                      />
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
              
              {/* Tournament Category Section */}
              <div className="pt-4 border-t mt-6">
                <h3 className="text-lg font-medium mb-4">Tournament Categories</h3>
                <TournamentCategorySection
                  categories={categories}
                  onCategoriesChange={setCategories}
                />
              </div>
              
              <CardFooter className="px-0 pt-6">
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
