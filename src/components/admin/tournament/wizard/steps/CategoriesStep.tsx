
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { v4 as uuidv4 } from 'uuid';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { categorySchema } from '../../types';
import { PlayType, TournamentFormat, Division } from '@/types/tournament-enums';
import { PlusCircle, Trash2 } from 'lucide-react';

// Import Category interface from types file
import { Category } from '../../types';

interface CategoriesStepProps {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
}

const CategoriesStep: React.FC<CategoriesStepProps> = ({ categories, onCategoriesChange }) => {
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);

  useEffect(() => {
    onCategoriesChange(localCategories);
  }, [localCategories, onCategoriesChange]);

  const categoryForm = useForm<Category>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      id: '',
      name: '',
      playType: PlayType.SINGLES,
      format: TournamentFormat.SINGLE_ELIMINATION,
      division: Division.OPEN,
    },
  });

  const divisionOptions = [
    {
      value: Division.OPEN,
      label: 'Open'
    },
    {
      value: Division.MENS,
      label: 'Mens'
    },
    {
      value: Division.WOMENS,
      label: 'Womens'
    },
    {
      value: Division.MIXED,
      label: 'Mixed'
    },
    {
      value: Division.JUNIOR,
      label: 'Juniors'
    },
    {
      value: Division.SENIORS,
      label: 'Seniors'
    },
    {
      value: Division.BEGINNER,
      label: 'Beginner'
    },
    {
      value: Division.INTERMEDIATE,
      label: 'Intermediate'
    },
    {
      value: Division.ADVANCED,
      label: 'Advanced'
    },
    {
      value: Division.PRO,
      label: 'Pro'
    },
  ];

  const playTypeOptions = [
    {
      value: PlayType.SINGLES,
      label: 'Singles'
    },
    {
      value: PlayType.DOUBLES,
      label: 'Doubles'
    },
    {
      value: PlayType.MIXED,
      label: 'Mixed'
    },
  ];

  const formatOptions = [
    {
      value: TournamentFormat.SINGLE_ELIMINATION,
      label: 'Single Elimination'
    },
    {
      value: TournamentFormat.DOUBLE_ELIMINATION,
      label: 'Double Elimination'
    },
    {
      value: TournamentFormat.ROUND_ROBIN,
      label: 'Round Robin'
    },
  ];

  const addCategory = () => {
    const newCategory: Category = {
      id: uuidv4(),
      name: `Category ${localCategories.length + 1}`,
      playType: PlayType.SINGLES,
      format: TournamentFormat.SINGLE_ELIMINATION,
      division: Division.OPEN,
    };
    setLocalCategories([...localCategories, newCategory]);
  };

  const removeCategory = (id: string) => {
    setLocalCategories(localCategories.filter(category => category.id !== id));
  };

  const updateCategory = (id: string, updatedValues: Partial<Category>) => {
    setLocalCategories(localCategories.map(category =>
      category.id === id ? { ...category, ...updatedValues } : category
    ));
  };

  const getDivisionColor = (division: string) => {
    switch (division) {
      case Division.OPEN: return 'bg-blue-100 text-blue-800';
      case Division.MENS: return 'bg-green-100 text-green-800';
      case Division.WOMENS: return 'bg-purple-100 text-purple-800';
      case Division.MIXED: return 'bg-amber-100 text-amber-800';
      case Division.JUNIOR: return 'bg-indigo-100 text-indigo-800';
      case Division.SENIORS: return 'bg-teal-100 text-teal-800';
      case Division.BEGINNER: return 'bg-lime-100 text-lime-800';
      case Division.INTERMEDIATE: return 'bg-orange-100 text-orange-800';
      case Division.ADVANCED: return 'bg-fuchsia-100 text-fuchsia-800';
      case Division.PRO: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Categories</h2>
        <Button size="sm" onClick={addCategory}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <ScrollArea className="rounded-md border p-4 h-[400px]">
        <div className="flex flex-col space-y-4">
          {localCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    <Input
                      type="text"
                      placeholder="Category Name"
                      value={category.name}
                      onChange={(e) => updateCategory(category.id, { name: e.target.value })}
                    />
                  </CardTitle>
                  <Button variant="destructive" size="icon" onClick={() => removeCategory(category.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  <Badge className={getDivisionColor(category.division)}>{category.division}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={categoryForm.control}
                    name="playType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Play Type</FormLabel>
                        <Select
                          onValueChange={(value) => updateCategory(category.id, { playType: value as PlayType })}
                          defaultValue={category.playType}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a play type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {playTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The type of play for this category.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={categoryForm.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Format</FormLabel>
                        <Select
                          onValueChange={(value) => updateCategory(category.id, { format: value as TournamentFormat })}
                          defaultValue={category.format}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {formatOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The format for this category.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={categoryForm.control}
                  name="division"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Division</FormLabel>
                      <Select
                        onValueChange={(value) => updateCategory(category.id, { division: value as Division })}
                        defaultValue={category.division}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a division" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {divisionOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The division for this category.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CategoriesStep;
