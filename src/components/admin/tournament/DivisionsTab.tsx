
import React from "react";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { TournamentFormValues } from "./types";
import { CategoryType, TournamentFormat, PlayType, DivisionType } from "@/types/tournament-enums";
import { v4 as uuidv4 } from "uuid";

interface DivisionsTabProps {
  form: UseFormReturn<TournamentFormValues>;
}

const DivisionsTab: React.FC<DivisionsTabProps> = ({ form }) => {
  const { fields: divisionFields, append: appendDivision, remove: removeDivision } = useFieldArray({
    control: form.control,
    name: "divisions",
  });

  const handleAddDivision = () => {
    appendDivision({
      id: uuidv4(),
      name: "",
      type: DivisionType.MENS,
      categories: [],
    });
  };

  const handleAddCategory = (divisionIndex: number) => {
    const divisions = form.getValues("divisions");
    const division = divisions[divisionIndex];
    division.categories.push({
      id: uuidv4(),
      name: "",
      playType: PlayType.SINGLES,
      format: TournamentFormat.SINGLE_ELIMINATION,
    });
    form.setValue("divisions", divisions);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Divisions & Categories</h3>
        <Button type="button" onClick={handleAddDivision}>
          <Plus className="h-4 w-4 mr-2" />
          Add Division
        </Button>
      </div>

      {divisionFields.map((division, divisionIndex) => (
        <Card key={division.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Division {divisionIndex + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeDivision(divisionIndex)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`divisions.${divisionIndex}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Division Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Men's Division" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`divisions.${divisionIndex}.type`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Division Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select division type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(DivisionType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Categories</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddCategory(divisionIndex)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>

              {division.categories?.map((category, categoryIndex) => (
                <Card key={category.id}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`divisions.${divisionIndex}.categories.${categoryIndex}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Elite Singles" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`divisions.${divisionIndex}.categories.${categoryIndex}.playType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Play Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select play type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(PlayType).map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type.replace(/_/g, " ")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`divisions.${divisionIndex}.categories.${categoryIndex}.format`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tournament Format</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select format" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(TournamentFormat).map((format) => (
                                  <SelectItem key={format} value={format}>
                                    {format.replace(/_/g, " ")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DivisionsTab;
