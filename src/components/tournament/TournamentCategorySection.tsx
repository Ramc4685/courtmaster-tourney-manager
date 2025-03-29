
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, X } from "lucide-react";
import { CategoryType, TournamentCategory } from "@/types/tournament";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TournamentCategorySectionProps {
  categories: TournamentCategory[];
  onCategoriesChange: (categories: TournamentCategory[]) => void;
}

const defaultCategories: Array<{id: CategoryType, name: string}> = [
  { id: "MENS_SINGLES", name: "Men's Singles" },
  { id: "WOMENS_SINGLES", name: "Women's Singles" },
  { id: "MENS_DOUBLES", name: "Men's Doubles" },
  { id: "WOMENS_DOUBLES", name: "Women's Doubles" },
  { id: "MIXED_DOUBLES", name: "Mixed Doubles" },
];

const TournamentCategorySection: React.FC<TournamentCategorySectionProps> = ({ 
  categories, 
  onCategoriesChange 
}) => {
  const [customCategoryName, setCustomCategoryName] = useState("");

  // Check if a standard category is selected
  const isCategorySelected = (type: CategoryType) => {
    return categories.some(cat => cat.type === type);
  };

  // Toggle a standard category
  const toggleCategory = (type: CategoryType, name: string) => {
    if (isCategorySelected(type)) {
      onCategoriesChange(categories.filter(cat => cat.type !== type));
    } else {
      onCategoriesChange([
        ...categories,
        { id: crypto.randomUUID(), name, type, isCustom: false }
      ]);
    }
  };

  // Add a custom category
  const addCustomCategory = () => {
    if (customCategoryName.trim()) {
      onCategoriesChange([
        ...categories,
        { 
          id: crypto.randomUUID(), 
          name: customCategoryName,
          type: "CUSTOM",
          isCustom: true,
          customName: customCategoryName
        }
      ]);
      setCustomCategoryName("");
    }
  };

  // Remove a category
  const removeCategory = (id: string) => {
    onCategoriesChange(categories.filter(cat => cat.id !== id));
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Tournament Categories</CardTitle>
        <CardDescription>
          Select the categories (events) for this tournament
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {defaultCategories.map(category => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox 
                id={`category-${category.id}`} 
                checked={isCategorySelected(category.id as CategoryType)}
                onCheckedChange={() => toggleCategory(category.id as CategoryType, category.name)}
              />
              <Label htmlFor={`category-${category.id}`} className="font-normal">
                {category.name}
              </Label>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t">
          <Label htmlFor="custom-category" className="mb-2 block">
            Add Custom Category
          </Label>
          <div className="flex space-x-2">
            <Input
              id="custom-category"
              placeholder="e.g., U19 Boys Singles"
              value={customCategoryName}
              onChange={(e) => setCustomCategoryName(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={addCustomCategory}
              disabled={!customCategoryName.trim()}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="pt-4">
            <Label className="mb-2 block">Selected Categories</Label>
            <ScrollArea className="h-20 border rounded-md p-2">
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Badge
                    key={category.id}
                    variant="secondary"
                    className="flex items-center gap-1 py-1 px-2"
                  >
                    {category.name}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => removeCategory(category.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TournamentCategorySection;
