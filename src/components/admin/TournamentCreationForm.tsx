
import React, { useState } from "react";
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
import { CalendarIcon, Trophy, Plus, X } from "lucide-react";
import { TournamentFormat, GameType, Division, PlayType } from "@/types/tournament-enums";
import { tournamentFormSchema, TournamentFormValues, DivisionInterface, Category } from "./tournament/types";
import { v4 as uuidv4 } from 'uuid';

export interface CreateTournamentFormProps {
  onSubmit: (data: TournamentFormValues) => void;
}

const CreateTournamentForm: React.FC<CreateTournamentFormProps> = ({ onSubmit }) => {
  const [divisions, setDivisions] = useState<DivisionInterface[]>([]);
  const [showDivisionForm, setShowDivisionForm] = useState(false);
  const [newDivision, setNewDivision] = useState<DivisionInterface>({
    id: uuidv4(),
    name: "",
    type: Division.MENS,
    categories: []
  });

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      name: "",
      location: "",
      gameType: GameType.BADMINTON,
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      registrationEnabled: false,
      maxTeams: 8,
      registrationDeadline: new Date(),
      scoringRules: {
        pointsToWin: 21,
        mustWinByTwo: true,
        maxPoints: 30
      },
      divisionDetails: [],
      requirePlayerProfile: false
    },
  });

  const handleAddDivision = () => {
    if (newDivision.name.trim() === "") return;
    setDivisions([...divisions, newDivision]);
    setNewDivision({
      id: uuidv4(),
      name: "",
      type: Division.MENS,
      categories: []
    });
    setShowDivisionForm(false);
  };

  const handleAddCategory = (divisionId: string) => {
    const updatedDivisions = divisions.map(division => {
      if (division.id === divisionId) {
        const newCategory: Category = {
          id: uuidv4(),
          name: "",
          playType: PlayType.SINGLES,
        };
        return {
          ...division,
          categories: [...division.categories, newCategory]
        };
      }
      return division;
    });
    setDivisions(updatedDivisions);
  };

  const handleRemoveDivision = (divisionId: string) => {
    setDivisions(divisions.filter(division => division.id !== divisionId));
  };

  const handleRemoveCategory = (divisionId: string, categoryId: string) => {
    const updatedDivisions = divisions.map(division => {
      if (division.id === divisionId) {
        return {
          ...division,
          categories: division.categories.filter(category => category.id !== categoryId)
        };
      }
      return division;
    });
    setDivisions(updatedDivisions);
  };

  const handleUpdateDivision = (divisionId: string, field: keyof DivisionInterface, value: any) => {
    const updatedDivisions = divisions.map(division => {
      if (division.id === divisionId) {
        return {
          ...division,
          [field]: value
        };
      }
      return division;
    });
    setDivisions(updatedDivisions);
  };

  const handleUpdateCategory = (divisionId: string, categoryId: string, field: keyof Category, value: any) => {
    const updatedDivisions = divisions.map(division => {
      if (division.id === divisionId) {
        return {
          ...division,
          categories: division.categories.map(category => {
            if (category.id === categoryId) {
              return {
                ...category,
                [field]: value
              };
            }
            return category;
          })
        };
      }
      return division;
    });
    setDivisions(updatedDivisions);
  };

  const handleSubmit = (data: TournamentFormValues) => {
    onSubmit({
      ...data,
      divisionDetails: divisions
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-md border-0">
      <CardHeader className="bg-card-foreground/5 border-b">
        <CardTitle className="text-3xl font-bold">Create New Tournament</CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
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
                            value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
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
                            value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
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
                  name="gameType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Game Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 text-base rounded-md">
                            <SelectValue placeholder="Select game type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(GameType).map((type) => (
                            <SelectItem key={type} value={type} className="text-base">
                              {type.replace(/_/g, " ")}
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

                {form.watch("registrationEnabled") && (
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
                              value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
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
                  onClick={() => setShowDivisionForm(true)}
                >
                  <Plus className="mr-1 h-4 w-4" /> Add Division
                </Button>
              </div>

              {showDivisionForm && (
                <div className="mb-4 p-4 border rounded-lg">
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Division Name</label>
                      <Input
                        value={newDivision.name}
                        onChange={(e) => setNewDivision({ ...newDivision, name: e.target.value })}
                        placeholder="Enter division name"
                        className="h-10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Division Type</label>
                      <Select
                        value={newDivision.type}
                        onValueChange={(value) => setNewDivision({ ...newDivision, type: value as Division })}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select division type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(Division).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowDivisionForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAddDivision}
                      >
                        Add Division
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {divisions.length === 0 ? (
                <div className="text-muted-foreground text-center py-6">
                  No divisions added yet. Add divisions to organize your tournament.
                </div>
              ) : (
                <div className="space-y-4">
                  {divisions.map((division) => (
                    <div key={division.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium">{division.name}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDivision(division.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {division.categories.map((category) => (
                          <div key={category.id} className="pl-4 border-l-2">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="text-base font-medium">{category.name}</h5>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveCategory(division.id, category.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid gap-2">
                              <div>
                                <label className="block text-sm font-medium mb-1">Play Type</label>
                                <Select
                                  value={category.playType}
                                  onValueChange={(value) => handleUpdateCategory(division.id, category.id, 'playType', value)}
                                >
                                  <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select play type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.values(PlayType).map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type.replace(/_/g, " ")}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddCategory(division.id)}
                          className="ml-4"
                        >
                          <Plus className="mr-1 h-4 w-4" /> Add Category
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
