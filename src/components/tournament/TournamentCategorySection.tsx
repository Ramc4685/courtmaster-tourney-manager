
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryType, TournamentCategory, Tournament } from "@/types/tournament";
import CategoryScoringRules from "@/components/scoring/CategoryScoringRules";

interface TournamentCategorySectionProps {
  categories: TournamentCategory[];
  onCategoriesChange: (categories: TournamentCategory[]) => void;
  tournament?: Tournament; // Optional tournament for scoring settings
  onUpdateTournament?: (tournament: Tournament) => void; // Optional tournament update function
}

const categoryOptions: { value: CategoryType; label: string }[] = [
  { value: "MENS_SINGLES", label: "Men's Singles" },
  { value: "WOMENS_SINGLES", label: "Women's Singles" },
  { value: "MENS_DOUBLES", label: "Men's Doubles" },
  { value: "WOMENS_DOUBLES", label: "Women's Doubles" },
  { value: "MIXED_DOUBLES", label: "Mixed Doubles" },
  { value: "CUSTOM", label: "Custom Category" }
];

const TournamentCategorySection: React.FC<TournamentCategorySectionProps> = ({ 
  categories, 
  onCategoriesChange,
  tournament,
  onUpdateTournament
}) => {
  const [newCategoryType, setNewCategoryType] = useState<CategoryType | "">("");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customCategoryDescription, setCustomCategoryDescription] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const handleAddCategory = () => {
    if (!newCategoryType) return;
    
    const isCustom = newCategoryType === "CUSTOM";
    
    if (isCustom && !customCategoryName.trim()) {
      return; // Don't add empty custom categories
    }

    const newCategory: TournamentCategory = {
      id: crypto.randomUUID(),
      name: isCustom 
        ? customCategoryName 
        : categoryOptions.find(cat => cat.value === newCategoryType)?.label || "Unknown Category",
      type: newCategoryType,
      isCustom,
      description: isCustom ? customCategoryDescription : undefined
    };

    onCategoriesChange([...categories, newCategory]);
    resetForm();
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

  const resetForm = () => {
    setNewCategoryType("");
    setCustomCategoryName("");
    setCustomCategoryDescription("");
  };

  const getCategoryColor = (type: CategoryType) => {
    switch(type) {
      case "MENS_SINGLES": return "bg-blue-500";
      case "WOMENS_SINGLES": return "bg-pink-500";
      case "MENS_DOUBLES": return "bg-blue-700";
      case "WOMENS_DOUBLES": return "bg-pink-700";
      case "MIXED_DOUBLES": return "bg-purple-600";
      case "CUSTOM": return "bg-gray-500";
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

            {newCategoryType === "CUSTOM" && (
              <div className="space-y-2 pt-2">
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
                        <Badge className={`${getCategoryColor(category.type)}`}>
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
                
                {/* Show category-specific scoring rules when editing or if tournament is provided */}
                {(editingCategoryId === category.id && tournament && onUpdateTournament) && (
                  <CardContent>
                    <CategoryScoringRules
                      tournament={tournament}
                      category={category}
                      onUpdateCategory={handleUpdateCategory}
                      onUpdateTournament={onUpdateTournament}
                    />
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentCategorySection;
