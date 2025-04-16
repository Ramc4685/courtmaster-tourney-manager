import React from 'react';
import { useFormContext } from 'react-hook-form';
import { WizardFormValues } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormField } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import { DivisionLevels } from '../../types';
import { TournamentFormat, PlayType, Division } from '@/types/tournament-enums';
import { Input } from "@/components/ui/input";
import { Plus, X } from 'lucide-react';

const DEFAULT_CATEGORIES = {
  [Division.MENS]: [
    { name: "MEN'S SINGLES", playType: PlayType.SINGLES },
    { name: "MEN'S DOUBLES", playType: PlayType.DOUBLES },
  ],
  [Division.WOMENS]: [
    { name: "WOMEN'S SINGLES", playType: PlayType.SINGLES },
    { name: "WOMEN'S DOUBLES", playType: PlayType.DOUBLES },
  ],
  [Division.MIXED]: [
    { name: "MIXED DOUBLES", playType: PlayType.DOUBLES },
  ],
  [Division.JUNIORS]: [
    { name: "JUNIOR SINGLES", playType: PlayType.SINGLES },
    { name: "JUNIOR DOUBLES", playType: PlayType.DOUBLES },
  ],
  [Division.SENIORS]: [
    { name: "SENIOR SINGLES", playType: PlayType.SINGLES },
    { name: "SENIOR DOUBLES", playType: PlayType.DOUBLES },
  ],
  [Division.OPEN]: [
    { name: "OPEN SINGLES", playType: PlayType.SINGLES },
    { name: "OPEN DOUBLES", playType: PlayType.DOUBLES },
  ],
};

const getDivisionName = (type: Division): string => {
  const nameMap = {
    [Division.MENS]: "Men's Division",
    [Division.WOMENS]: "Women's Division",
    [Division.MIXED]: "Mixed Division",
    [Division.JUNIORS]: "Junior Division",
    [Division.SENIORS]: "Senior Division",
    [Division.OPEN]: "Open Division",
  };
  return nameMap[type] || type.replace(/_/g, ' ');
};

export const CategoriesStep = () => {
  const { watch, setValue } = useFormContext<WizardFormValues>();
  const divisionDetails = watch('divisionDetails') || [];
  const [showDivisionForm, setShowDivisionForm] = React.useState(false);
  const [newDivision, setNewDivision] = React.useState({
    id: '',
    name: '',
    type: Division.MENS,
    categories: []
  });

  // Update division name when type changes
  React.useEffect(() => {
    setNewDivision(prev => ({
      ...prev,
      name: getDivisionName(prev.type)
    }));
  }, [newDivision.type]);

  const handleAddDivision = () => {
    if (!newDivision.name.trim()) return;
    
    const defaultCategories = DEFAULT_CATEGORIES[newDivision.type] || [];
    const division = {
      ...newDivision,
      id: uuidv4(),
      categories: defaultCategories.map(cat => ({
        ...cat,
        id: uuidv4()
      }))
    };
    
    setValue('divisionDetails', [...divisionDetails, division]);
    setNewDivision({
      id: '',
      name: getDivisionName(Division.MENS),
      type: Division.MENS,
      categories: []
    });
    setShowDivisionForm(false);
  };

  const handleRemoveDivision = (divisionIndex: number) => {
    const updatedDivisions = divisionDetails.filter((_, index) => index !== divisionIndex);
    setValue('divisionDetails', updatedDivisions);
  };

  const handleAddCategory = (divisionIndex: number) => {
    const currentDivision = divisionDetails[divisionIndex];
    const divisionType = currentDivision.type;
    const categoryCount = currentDivision.categories?.length || 0;
    
    const newCategory = {
      id: uuidv4(),
      name: `${divisionType.replace(/_/g, ' ')} CATEGORY ${categoryCount + 1}`,
      playType: PlayType.SINGLES,
    };

    const updatedCategories = [
      ...(currentDivision.categories || []),
      newCategory
    ];

    setValue(`divisionDetails.${divisionIndex}.categories`, updatedCategories);
  };

  const handleRemoveCategory = (divisionIndex: number, categoryIndex: number) => {
    const currentDivision = divisionDetails[divisionIndex];
    const updatedCategories = currentDivision.categories.filter((_, index) => index !== categoryIndex);
    setValue(`divisionDetails.${divisionIndex}.categories`, updatedCategories);
  };

  const generateCategoryName = (divisionLevel: string, type: string, playType: string) => {
    const nameParts = [];
    if (divisionLevel !== DivisionLevels.STANDARD) {
      nameParts.push(divisionLevel);
    }
    nameParts.push(type, playType);
    return nameParts.join(' ').toUpperCase();
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

  return (
    <div className="space-y-6">
      {!showDivisionForm && !divisionDetails.length && (
        <Card className="border-dashed border-2 bg-muted/50">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-foreground">No Divisions Added</h3>
              <p className="text-muted-foreground">Start by adding a division to organize your tournament categories</p>
              <Button
                onClick={() => setShowDivisionForm(true)}
                className="mt-4"
                size="lg"
              >
                <Plus className="mr-2 h-5 w-5" /> Add Your First Division
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(showDivisionForm || divisionDetails.length > 0) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Divisions & Categories</CardTitle>
              <CardDescription>Create divisions and add categories to each division</CardDescription>
            </div>
            {!showDivisionForm && (
              <Button
                onClick={() => setShowDivisionForm(true)}
                className="h-10"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Division
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {showDivisionForm && (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Division Name</label>
                      <Input
                        value={newDivision.name}
                        onChange={(e) => setNewDivision({ ...newDivision, name: e.target.value })}
                        placeholder="Enter division name"
                        className="h-10"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Division Type</label>
                      <Select
                        value={newDivision.type}
                        onValueChange={(value: Division) => setNewDivision({ ...newDivision, type: value })}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select division type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(Division).map((type: Division) => (
                            <SelectItem key={type} value={type}>
                              {type.replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowDivisionForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddDivision}
                        disabled={!newDivision.name.trim()}
                      >
                        Add Division
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {divisionDetails.map((division, divisionIndex) => (
              <Card key={division.id} className="border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">{division.name}</CardTitle>
                    <CardDescription>{division.type.replace(/_/g, ' ')}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveDivision(divisionIndex)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  {division.categories?.map((category, categoryIndex) => (
                    <div key={category.id} className="flex items-center gap-4 bg-muted/30 p-3 rounded-lg">
                      <FormField
                        name={`divisionDetails.${divisionIndex}.categories.${categoryIndex}.name`}
                        render={({ field }) => (
                          <div className="flex-1">
                            <Input {...field} placeholder="Category name" className="bg-background" />
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
                              <SelectTrigger className="bg-background">
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
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCategory(divisionIndex, categoryIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => handleAddCategory(divisionIndex)}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Category
                  </Button>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 