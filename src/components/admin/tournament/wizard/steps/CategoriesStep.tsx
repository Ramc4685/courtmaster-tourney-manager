import React from 'react';
import { useFormContext } from 'react-hook-form';
import { WizardFormValues } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormField } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import { DivisionLevels } from '../../types';
import { TournamentFormat, PlayType } from '@/types/tournament-enums';
import { Input } from "@/components/ui/input";

export const CategoriesStep = () => {
  const { watch, setValue } = useFormContext<WizardFormValues>();
  const divisionDetails = watch('divisionDetails');

  const generateCategoryName = (divisionLevel: string, type: string, playType: string) => {
    const nameParts = [];
    if (divisionLevel !== DivisionLevels.STANDARD) {
      nameParts.push(divisionLevel);
    }
    nameParts.push(type, playType);
    return nameParts.join(' ').toUpperCase();
  };

  const handleAddCategory = (divisionIndex: number) => {
    const currentDivision = divisionDetails[divisionIndex];
    const updatedCategories = [
      ...(currentDivision.categories || []),
      {
        id: uuidv4(),
        name: "",
        playType: PlayType.SINGLES,
      },
    ];

    setValue(`divisionDetails.${divisionIndex}.categories`, updatedCategories);
  };

  const handleRemoveCategory = (divisionIndex: number, categoryIndex: number) => {
    const currentDivision = divisionDetails[divisionIndex];
    const updatedCategories = currentDivision.categories.filter((_, index) => index !== categoryIndex);
    setValue(`divisionDetails.${divisionIndex}.categories`, updatedCategories);
  };

  const updateCategoryName = (
    divisionIndex: number,
    categoryIndex: number,
    divisionLevel: string,
    type: string,
    playType: string
  ) => {
    const newName = generateCategoryName(divisionLevel, type, playType);
    setValue(`divisionDetails.${divisionIndex}.categories.${categoryIndex}.name`, newName);
  };

  if (!divisionDetails?.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please create at least one division first
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {divisionDetails.map((division, divisionIndex) => (
        <Card key={division.id}>
          <CardHeader>
            <CardTitle>{division.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!division.categories?.length && (
              <p className="text-center text-muted-foreground">
                No categories added yet
              </p>
            )}
            {division.categories?.map((category, categoryIndex) => (
              <div key={category.id} className="flex items-end gap-4">
                <FormField
                  name={`divisionDetails.${divisionIndex}.categories.${categoryIndex}.name`}
                  render={({ field }) => (
                    <div className="flex-1">
                      <Input {...field} placeholder="Category name" />
                    </div>
                  )}
                />
                <FormField
                  name={`divisionDetails.${divisionIndex}.categories.${categoryIndex}.playType`}
                  render={({ field }) => (
                    <div className="w-48">
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select play type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(PlayType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemoveCategory(divisionIndex, categoryIndex)}
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => handleAddCategory(divisionIndex)}
              className="w-full"
            >
              Add Category
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 