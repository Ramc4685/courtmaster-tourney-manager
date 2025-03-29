
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { TournamentCategory, CategoryType, TournamentFormat } from '@/types/tournament';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2 } from 'lucide-react';
import { Input } from "@/components/ui/input";

interface TournamentCategorySectionProps {
  categories: TournamentCategory[];
  onCategoriesChange: (categories: TournamentCategory[]) => void;
}

const TournamentCategorySection: React.FC<TournamentCategorySectionProps> = ({ 
  categories, 
  onCategoriesChange 
}) => {
  const [customCategoryName, setCustomCategoryName] = useState('');

  const handleAddStandardCategory = (type: CategoryType, name: string) => {
    // Check if this standard category already exists
    const exists = categories.some(c => c.type === type);
    if (exists) return;
    
    onCategoriesChange([
      ...categories,
      {
        id: crypto.randomUUID(),
        name,
        type,
        format: "SINGLE_ELIMINATION" // Default format
      }
    ]);
  };

  const handleAddCustomCategory = () => {
    if (!customCategoryName.trim()) return;
    
    onCategoriesChange([
      ...categories,
      {
        id: crypto.randomUUID(),
        name: customCategoryName,
        type: "CUSTOM" as CategoryType,
        isCustom: true,
        customName: customCategoryName,
        format: "SINGLE_ELIMINATION" // Default format
      }
    ]);
    
    setCustomCategoryName('');
  };

  const handleRemoveCategory = (id: string) => {
    onCategoriesChange(categories.filter(c => c.id !== id));
  };

  const handleFormatChange = (categoryId: string, format: TournamentFormat) => {
    onCategoriesChange(
      categories.map(cat => 
        cat.id === categoryId 
          ? { ...cat, format } 
          : cat
      )
    );
  };

  const handleToggleDemoData = (categoryId: string, checked: boolean) => {
    onCategoriesChange(
      categories.map(cat => 
        cat.id === categoryId 
          ? { ...cat, addDemoData: checked } 
          : cat
      )
    );
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl">Tournament Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="flex justify-start items-center gap-2"
              onClick={() => handleAddStandardCategory("MENS_SINGLES", "Men's Singles")}
            >
              <PlusCircle className="h-4 w-4" />
              Men's Singles
            </Button>
            <Button 
              variant="outline" 
              className="flex justify-start items-center gap-2"
              onClick={() => handleAddStandardCategory("WOMENS_SINGLES", "Women's Singles")}
            >
              <PlusCircle className="h-4 w-4" />
              Women's Singles
            </Button>
            <Button 
              variant="outline" 
              className="flex justify-start items-center gap-2"
              onClick={() => handleAddStandardCategory("MENS_DOUBLES", "Men's Doubles")}
            >
              <PlusCircle className="h-4 w-4" />
              Men's Doubles
            </Button>
            <Button 
              variant="outline" 
              className="flex justify-start items-center gap-2"
              onClick={() => handleAddStandardCategory("WOMENS_DOUBLES", "Women's Doubles")}
            >
              <PlusCircle className="h-4 w-4" />
              Women's Doubles
            </Button>
            <Button 
              variant="outline" 
              className="flex justify-start items-center gap-2"
              onClick={() => handleAddStandardCategory("MIXED_DOUBLES", "Mixed Doubles")}
            >
              <PlusCircle className="h-4 w-4" />
              Mixed Doubles
            </Button>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Input
              value={customCategoryName}
              onChange={(e) => setCustomCategoryName(e.target.value)}
              placeholder="Custom Category Name"
              className="flex-1"
            />
            <Button 
              variant="outline" 
              onClick={handleAddCustomCategory}
              disabled={!customCategoryName.trim()}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Custom
            </Button>
          </div>
          
          {categories.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium">Selected Categories:</h3>
              {categories.map(category => (
                <div key={category.id} className="bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{category.name}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`format-${category.id}`} className="text-sm">Format</Label>
                      <Select
                        value={category.format || "SINGLE_ELIMINATION"}
                        onValueChange={(value) => handleFormatChange(category.id, value as TournamentFormat)}
                      >
                        <SelectTrigger id={`format-${category.id}`}>
                          <SelectValue placeholder="Select Format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SINGLE_ELIMINATION">Single Elimination</SelectItem>
                          <SelectItem value="DOUBLE_ELIMINATION">Double Elimination</SelectItem>
                          <SelectItem value="ROUND_ROBIN">Round Robin</SelectItem>
                          <SelectItem value="GROUP_KNOCKOUT">Group Knockout</SelectItem>
                          <SelectItem value="SWISS">Swiss</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`demo-data-${category.id}`}
                        checked={category.addDemoData} 
                        onCheckedChange={(checked) => handleToggleDemoData(category.id, checked === true)}
                      />
                      <Label htmlFor={`demo-data-${category.id}`} className="text-sm">
                        Load sample data for this category
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TournamentCategorySection;
