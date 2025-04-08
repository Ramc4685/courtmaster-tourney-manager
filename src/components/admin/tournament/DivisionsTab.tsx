import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { TournamentFormValues, CategoryType } from "./types";

interface DivisionsTabProps {
  form: UseFormReturn<TournamentFormValues>;
}

const DivisionsTab: React.FC<DivisionsTabProps> = ({ form }) => {
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
      { name: "", type: CategoryType.MENS_SINGLES },
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
                          <SelectItem value={CategoryType.MENS_SINGLES}>Men's Singles</SelectItem>
                          <SelectItem value={CategoryType.WOMENS_SINGLES}>Women's Singles</SelectItem>
                          <SelectItem value={CategoryType.MENS_DOUBLES}>Men's Doubles</SelectItem>
                          <SelectItem value={CategoryType.WOMENS_DOUBLES}>Women's Doubles</SelectItem>
                          <SelectItem value={CategoryType.MIXED_DOUBLES}>Mixed Doubles</SelectItem>
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
  );
};

export default DivisionsTab; 