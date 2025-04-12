import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { WizardFormValues } from '../types';
import { v4 as uuidv4 } from 'uuid';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Division } from '@/types/tournament-enums';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

export const DivisionsStep = () => {
  const form = useFormContext<WizardFormValues>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'divisionDetails',
  });

  const handleAddDivision = () => {
    append({
      id: uuidv4(),
      name: '',
      type: Division.ADVANCED,
      categories: [],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tournament Divisions</h3>
        <Button onClick={handleAddDivision} type="button">
          Add Division
        </Button>
      </div>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No divisions added yet. Click the button above to add your first division.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  Division {index + 1}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name={`divisionDetails.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Division Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter division name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`divisionDetails.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Division Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select division type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={Division.BEGINNER}>Beginner</SelectItem>
                          <SelectItem value={Division.INTERMEDIATE}>Intermediate</SelectItem>
                          <SelectItem value={Division.ADVANCED}>Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}; 