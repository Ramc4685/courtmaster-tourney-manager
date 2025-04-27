
import React, { useState } from 'react';
import { Control, useFieldArray, UseFormWatch } from "react-hook-form";
import { v4 as uuidv4 } from 'uuid';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PlusCircle, Trash2 } from "lucide-react";
import { Division, PlayType, TournamentFormat } from '@/types/tournament-enums';
import { TournamentFormValues, Category } from "../../types";

interface CategoriesStepProps {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
  control: Control<TournamentFormValues>;
  watch: UseFormWatch<TournamentFormValues>;
}

const CategoriesStep: React.FC<CategoriesStepProps> = ({
  categories,
  onCategoriesChange,
  control,
  watch
}) => {
  const { fields: divisionFields, append: appendDivision, remove: removeDivision } = useFieldArray({
    control,
    name: "divisionDetails"
  });
  
  const handleAddDivision = () => {
    appendDivision({
      id: uuidv4(),
      name: `Division ${divisionFields.length + 1}`,
      type: Division.OPEN,
      categories: []
    });
  };

  const handleAddCategory = (divisionIndex: number) => {
    const divisionDetails = watch("divisionDetails");
    const updatedDivisions = [...divisionDetails];
    
    if (updatedDivisions[divisionIndex]) {
      updatedDivisions[divisionIndex].categories = [
        ...(updatedDivisions[divisionIndex].categories || []),
        {
          id: uuidv4(),
          name: `Category ${(updatedDivisions[divisionIndex].categories?.length || 0) + 1}`,
          type: "standard",
          playType: PlayType.SINGLES,
          format: TournamentFormat.SINGLE_ELIMINATION,
          seeded: true
        }
      ];
    }
    
    // This will trigger a re-render with the updated categories
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tournament Divisions & Categories</h3>
        <Button onClick={handleAddDivision} type="button" variant="outline" size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Division
        </Button>
      </div>

      {divisionFields.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              No divisions added yet. Click "Add Division" to create your first division.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {divisionFields.map((divisionField, divisionIndex) => (
            <Card key={divisionField.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <FormField
                  control={control}
                  name={`divisionDetails.${divisionIndex}.name`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Division Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter division name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  onClick={() => removeDivision(divisionIndex)}
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                >
                  <Trash2 className="h-4 w-4 text-gray-500" />
                </Button>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name={`divisionDetails.${divisionIndex}.type`}
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
                            <SelectItem value={Division.OPEN}>Open</SelectItem>
                            <SelectItem value={Division.MENS}>Men's</SelectItem>
                            <SelectItem value={Division.WOMENS}>Women's</SelectItem>
                            <SelectItem value={Division.MIXED}>Mixed</SelectItem>
                            <SelectItem value={Division.JUNIORS}>Juniors</SelectItem>
                            <SelectItem value={Division.SENIORS}>Seniors</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium">Categories</h4>
                    <Button
                      onClick={() => handleAddCategory(divisionIndex)}
                      type="button"
                      variant="outline"
                      size="sm"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </div>

                  {(watch(`divisionDetails.${divisionIndex}.categories`) || []).length === 0 ? (
                    <div className="border rounded-md p-4 text-center text-gray-500">
                      No categories added yet. Click "Add Category" to create your first category.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {watch(`divisionDetails.${divisionIndex}.categories`)?.map(
                        (category, categoryIndex) => (
                          <div key={category.id} className="border rounded-md p-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={control}
                                name={`divisionDetails.${divisionIndex}.categories.${categoryIndex}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Category Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Enter category name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={control}
                                name={`divisionDetails.${divisionIndex}.categories.${categoryIndex}.playType`}
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
                                        <SelectItem value={PlayType.SINGLES}>Singles</SelectItem>
                                        <SelectItem value={PlayType.DOUBLES}>Doubles</SelectItem>
                                        <SelectItem value={PlayType.MIXED}>Mixed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={control}
                                name={`divisionDetails.${divisionIndex}.categories.${categoryIndex}.format`}
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
                                        <SelectItem value={TournamentFormat.SINGLE_ELIMINATION}>
                                          Single Elimination
                                        </SelectItem>
                                        <SelectItem value={TournamentFormat.DOUBLE_ELIMINATION}>
                                          Double Elimination
                                        </SelectItem>
                                        <SelectItem value={TournamentFormat.ROUND_ROBIN}>
                                          Round Robin
                                        </SelectItem>
                                        <SelectItem value={TournamentFormat.GROUP_KNOCKOUT}>
                                          Group + Knockout
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesStep;
