import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TournamentCategory, Tournament } from "@/types/tournament";
import { CategoryType, TournamentFormat, Division } from "@/types/tournament-enums";
import CategoryScoringRules from "@/components/scoring/CategoryScoringRules";
import TournamentFormatSelector from "@/components/tournament/TournamentFormatSelector";

interface TournamentCategorySectionProps {
  categories: TournamentCategory[];
  onCategoriesChange: (categories: TournamentCategory[]) => void;
  tournament?: Tournament;
  onUpdateTournament?: (tournament: Tournament) => void;
}

const categoryOptions: { value: CategoryType | 'custom'; label: string; division: Division }[] = [
  { value: CategoryType.SINGLES, label: "Singles", division: Division.INITIAL },
  { value: CategoryType.DOUBLES, label: "Doubles", division: Division.INITIAL },
  { value: CategoryType.MIXED, label: "Mixed Doubles", division: Division.INITIAL },
  { value: CategoryType.TEAM, label: "Team", division: Division.INITIAL },
  { value: 'custom', label: "Custom Category", division: Division.INITIAL }
];

const TournamentCategorySection: React.FC<TournamentCategorySectionProps> = ({ 
  categories, 
  onCategoriesChange,
  tournament,
  onUpdateTournament
}) => {
  const [newCategoryType, setNewCategoryType] = useState<CategoryType | 'custom' | "">("");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customCategoryDescription, setCustomCategoryDescription] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newCategoryFormat, setNewCategoryFormat] = useState<TournamentFormat>(TournamentFormat.SINGLE_ELIMINATION);

  const handleAddCategory = () => {
    if (!newCategoryType) return;
    
    const isCustom = newCategoryType === 'custom';
    
    if (isCustom && !customCategoryName.trim()) {
      return;
    }

    const categoryOption = categoryOptions.find(opt => opt.value === newCategoryType);
    
    const newCategory: TournamentCategory = {
      id: Math.random().toString(36).substr(2, 9),
      name: isCustom 
        ? customCategoryName 
        : categoryOption?.label || "Unknown Category",
      type: isCustom ? CategoryType.SINGLES : newCategoryType as CategoryType,
      division: categoryOption?.division || Division.INITIAL,
      isCustom,
      description: isCustom ? customCategoryDescription : undefined,
    };

    onCategoriesChange([...categories, newCategory]);
    setNewCategoryType("");
    setCustomCategoryName("");
    setCustomCategoryDescription("");
  };

  const handleDeleteCategory = (id: string) => {
    onCategoriesChange(categories.filter(cat => cat.id !== id));
  };

  const handleUpdateCategory = (updatedCategory: TournamentCategory) => {
    onCategoriesChange(categories.map(cat => 
      cat.id === updatedCategory.id ? updatedCategory : cat
    ));
    setEditingCategoryId(null);
  };

  const handleFormatChange = (categoryId: string, format: TournamentFormat) => {
    onCategoriesChange(categories.map(cat => 
      cat.id === categoryId ? { ...cat, format } : cat
    ));
  };

  const resetForm = () => {
    setNewCategoryType("");
    setCustomCategoryName("");
    setCustomCategoryDescription("");
    setNewCategoryFormat(TournamentFormat.SINGLE_ELIMINATION);
  };

  const getCategoryColor = (type: CategoryType | 'custom') => {
    switch(type) {
      case CategoryType.SINGLES: return "bg-blue-500";
      case CategoryType.DOUBLES: return "bg-blue-700";
      case CategoryType.MIXED: return "bg-purple-600";
      case CategoryType.TEAM: return "bg-green-600";
      case 'custom': return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tournament Categories</CardTitle>
          <CardDescription>Define the categories for this tournament</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="flex space-x-2">
              <div className="w-full">
                <Select value={newCategoryType} onValueChange={(value) => setNewCategoryType(value as CategoryType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddCategory} disabled={!newCategoryType}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            {newCategoryType && (
              <div className="space-y-2 pt-2">
                {newCategoryType === 'custom' && (
                  <>
                    <Input
                      placeholder="Custom Category Name"
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={customCategoryDescription}
                      onChange={(e) => setCustomCategoryDescription(e.target.value)}
                    />
                  </>
                )}
                
                <div className="pt-2">
                  <h4 className="text-sm font-medium mb-1">Tournament Format</h4>
                  <TournamentFormatSelector 
                    value={newCategoryFormat}
                    onValueChange={setNewCategoryFormat}
                    categorySpecific={true}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {categories.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Selected Categories</h3>
          <div className="grid grid-cols-1 gap-4">
            {categories.map(category => (
              <Card key={category.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <Badge className={`${getCategoryColor(category.type as CategoryType | 'custom')}`}>
                          {category.isCustom ? "Custom" : category.type.replace("_", " ")}
                        </Badge>
                      </div>
                      {category.description && (
                        <CardDescription className="mt-1">
                          {category.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={() => setEditingCategoryId(category.id === editingCategoryId ? null : category.id)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive" 
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {editingCategoryId === category.id ? (
                    <div className="space-y-4">
                      {category.isCustom && (
                        <>
                          <Input
                            value={category.name}
                            onChange={(e) => handleUpdateCategory({ ...category, name: e.target.value })}
                            placeholder="Category Name"
                          />
                          <Input
                            value={category.description || ""}
                            onChange={(e) => handleUpdateCategory({ ...category, description: e.target.value })}
                            placeholder="Description (optional)"
                          />
                        </>
                      )}
                      <TournamentFormatSelector 
                        value={category.format}
                        onValueChange={(format) => handleFormatChange(category.id, format)}
                        categorySpecific={true}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <TournamentFormatSelector 
                        value={category.format}
                        onValueChange={(format) => handleFormatChange(category.id, format)}
                        categorySpecific={true}
                        disabled={true}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentCategorySection;
