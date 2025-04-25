
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Division, TournamentFormat, PlayType } from '@/types/tournament-enums';
import { Category, CategoryType, DivisionLevel } from '@/components/admin/tournament/types';
import { PlusCircle, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Define the schema for categories
const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: 'Category name is required' }),
  type: z.string(),
  playType: z.nativeEnum(PlayType),
  level: z.string(),
  format: z.nativeEnum(TournamentFormat),
  seeded: z.boolean().default(false)
});

// Define the schema for the form
const formSchema = z.object({
  categories: z.array(categorySchema)
});

// Define the types based on the schema
type CategoryFormValues = z.infer<typeof categorySchema>;
type FormValues = z.infer<typeof formSchema>;

interface CategoriesStepProps {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
}

const CategoriesStep: React.FC<CategoriesStepProps> = ({ categories, onCategoriesChange }) => {
  // Initialize form with existing categories or defaults
  const defaultValues: FormValues = {
    categories: categories.length > 0 
      ? categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          type: cat.type || '',
          playType: cat.playType || PlayType.SINGLES,
          level: cat.type || 'STANDARD',
          format: cat.format || TournamentFormat.SINGLE_ELIMINATION,
          seeded: cat.seeded || false
        }))
      : [{
          id: crypto.randomUUID(),
          name: 'Men\'s Singles',
          type: 'STANDARD',
          playType: PlayType.SINGLES,
          level: 'INTERMEDIATE',
          format: TournamentFormat.SINGLE_ELIMINATION,
          seeded: false
        }]
  };

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'categories'
  });

  const handleAddCategory = () => {
    append({
      id: crypto.randomUUID(),
      name: '',
      type: 'STANDARD',
      playType: PlayType.SINGLES,
      level: 'INTERMEDIATE',
      format: TournamentFormat.SINGLE_ELIMINATION,
      seeded: false
    });
  };

  const onSubmit = (data: FormValues) => {
    const transformedCategories = data.categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      division: cat.playType === PlayType.SINGLES 
        ? (cat.level === 'BEGINNER' ? Division.JUNIORS 
           : cat.level === 'INTERMEDIATE' ? Division.INTERMEDIATE
           : cat.level === 'ADVANCED' ? Division.ADVANCED
           : Division.SENIORS)
        : Division.MIXED,
      playType: cat.playType,
      format: cat.format,
      seeded: cat.seeded
    }));
    
    onCategoriesChange(transformedCategories);
  };

  // Auto-save when form changes
  React.useEffect(() => {
    const subscription = control.watch((value, { name }) => {
      if (value.categories) {
        handleSubmit(onSubmit)();
      }
    });
    return () => subscription.unsubscribe();
  }, [control, handleSubmit, onSubmit]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Tournament Categories</h3>
        <Button 
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddCategory}
          className="flex items-center"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> 
          Add Category
        </Button>
      </div>

      {fields.map((field, index) => (
        <Card key={field.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="grow space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`categories.${index}.name`}>Category Name</Label>
                    <Controller
                      control={control}
                      name={`categories.${index}.name`}
                      render={({ field }) => (
                        <Input {...field} placeholder="e.g. Men's Singles A" />
                      )}
                    />
                    {errors.categories?.[index]?.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.categories[index]?.name?.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`categories.${index}.playType`}>Play Type</Label>
                    <Controller
                      control={control}
                      name={`categories.${index}.playType`}
                      render={({ field }) => (
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select play type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={PlayType.SINGLES}>Singles</SelectItem>
                            <SelectItem value={PlayType.DOUBLES}>Doubles</SelectItem>
                            <SelectItem value={PlayType.MIXED}>Mixed Doubles</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`categories.${index}.level`}>Level</Label>
                    <Controller
                      control={control}
                      name={`categories.${index}.level`}
                      render={({ field }) => (
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BEGINNER">Beginner</SelectItem>
                            <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                            <SelectItem value="ADVANCED">Advanced</SelectItem>
                            <SelectItem value="SENIORS">Seniors</SelectItem>
                            <SelectItem value="OPEN">Open</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`categories.${index}.format`}>Format</Label>
                    <Controller
                      control={control}
                      name={`categories.${index}.format`}
                      render={({ field }) => (
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={TournamentFormat.SINGLE_ELIMINATION}>Single Elimination</SelectItem>
                            <SelectItem value={TournamentFormat.DOUBLE_ELIMINATION}>Double Elimination</SelectItem>
                            <SelectItem value={TournamentFormat.ROUND_ROBIN}>Round Robin</SelectItem>
                            <SelectItem value={TournamentFormat.GROUP_KNOCKOUT}>Group + Knockout</SelectItem>
                            <SelectItem value={TournamentFormat.SWISS}>Swiss System</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Controller
                    control={control}
                    name={`categories.${index}.seeded`}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id={`categories.${index}.seeded`}
                      />
                    )}
                  />
                  <Label htmlFor={`categories.${index}.seeded`}>Enable Seeding</Label>
                </div>
              </div>

              <Button 
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </form>
  );
};

export default CategoriesStep;
