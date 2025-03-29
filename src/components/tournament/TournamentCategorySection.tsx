
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, X, FileText, Trophy } from "lucide-react";
import { CategoryType, TournamentCategory, TournamentFormat } from "@/types/tournament";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useTournament } from "@/contexts/TournamentContext";
import { useAuth } from "@/contexts/auth/AuthContext";

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

const formatOptions = [
  { value: "SINGLE_ELIMINATION", label: "Single Elimination" },
  { value: "DOUBLE_ELIMINATION", label: "Double Elimination" },
  { value: "ROUND_ROBIN", label: "Round Robin" },
  { value: "SWISS", label: "Swiss System" },
  { value: "GROUP_KNOCKOUT", label: "Group Stage + Knockout" },
  { value: "MULTI_STAGE", label: "Multi-Stage Format" },
];

const TournamentCategorySection: React.FC<TournamentCategorySectionProps> = ({ 
  categories, 
  onCategoriesChange 
}) => {
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customCategoryDescription, setCustomCategoryDescription] = useState("");
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const { loadCategoryDemoData } = useTournament();
  const { user } = useAuth();
  
  // Check if the user is an admin or demo user
  const isAdminOrDemo = user && (user.role === "admin" || user.email?.includes("demo"));

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
        { 
          id: crypto.randomUUID(), 
          name, 
          type, 
          isCustom: false,
          format: "SINGLE_ELIMINATION" // Default format
        }
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
          customName: customCategoryName,
          description: customCategoryDescription.trim() || undefined,
          format: "SINGLE_ELIMINATION" // Default format
        }
      ]);
      setCustomCategoryName("");
      setCustomCategoryDescription("");
    }
  };

  // Remove a category
  const removeCategory = (id: string) => {
    onCategoriesChange(categories.filter(cat => cat.id !== id));
  };

  // Update a category's format
  const updateCategoryFormat = (categoryId: string, format: TournamentFormat) => {
    onCategoriesChange(categories.map(cat => 
      cat.id === categoryId ? { ...cat, format } : cat
    ));
  };

  // Update a category's description (for custom categories only)
  const updateCategoryDescription = (categoryId: string, description: string) => {
    onCategoriesChange(categories.map(cat => 
      cat.id === categoryId ? { ...cat, description } : cat
    ));
  };

  // Toggle demo data for a category
  const toggleDemoData = (categoryId: string, checked: boolean) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (checked && category && category.format) {
      loadCategoryDemoData(categoryId, category.format);
    }
  };

  // Toggle category details panel
  const toggleCategoryDetails = (categoryId: string) => {
    setExpandedCategoryId(expandedCategoryId === categoryId ? null : categoryId);
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
          <div className="mt-2">
            <Textarea
              id="custom-category-description"
              placeholder="Category description (optional)"
              value={customCategoryDescription}
              onChange={(e) => setCustomCategoryDescription(e.target.value)}
              className="w-full"
              rows={2}
            />
          </div>
        </div>

        {categories.length > 0 && (
          <div className="pt-4">
            <Label className="mb-2 block">Selected Categories</Label>
            <div className="space-y-2">
              {categories.map(category => (
                <div key={category.id} className="border rounded-md p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-court-green" />
                      <span className="font-medium">{category.name}</span>
                      {category.format && (
                        <Badge variant="outline" className="text-xs">
                          {category.format.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleCategoryDetails(category.id)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeCategory(category.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {expandedCategoryId === category.id && (
                    <div className="mt-2 pt-2 border-t space-y-2">
                      <div>
                        <Label htmlFor={`format-${category.id}`} className="text-sm">
                          Tournament Format
                        </Label>
                        <Select
                          value={category.format || "SINGLE_ELIMINATION"}
                          onValueChange={(value) => updateCategoryFormat(category.id, value as TournamentFormat)}
                        >
                          <SelectTrigger id={`format-${category.id}`}>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            {formatOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {category.isCustom && (
                        <div>
                          <Label htmlFor={`description-${category.id}`} className="text-sm">
                            Description
                          </Label>
                          <Textarea
                            id={`description-${category.id}`}
                            value={category.description || ""}
                            onChange={(e) => updateCategoryDescription(category.id, e.target.value)}
                            placeholder="Category description"
                            rows={2}
                          />
                        </div>
                      )}
                      
                      {isAdminOrDemo && (
                        <div className="flex items-center space-x-2 mt-2">
                          <Checkbox 
                            id={`demo-data-${category.id}`}
                            onCheckedChange={(checked) => toggleDemoData(category.id, checked === true)}
                          />
                          <Label htmlFor={`demo-data-${category.id}`} className="text-sm">
                            Add demo data for this category
                          </Label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TournamentCategorySection;
