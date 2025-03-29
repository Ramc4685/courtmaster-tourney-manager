
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { TournamentCategory, Tournament } from "@/types/tournament";
import BracketTab from "./BracketTab";
import { useMediaQuery } from "@/hooks/use-mobile";

interface CategoryTabsProps {
  tournament: Tournament;
  activeTab: string;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ tournament, activeTab }) => {
  console.log("Rendering CategoryTabs with", tournament.categories.length, "categories");
  console.log("Active tab:", activeTab);
  
  const [selectedCategory, setSelectedCategory] = useState<string>(
    tournament.categories.length > 0 ? tournament.categories[0].id : ''
  );
  
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Skip if there are no categories
  if (tournament.categories.length === 0) {
    console.log("No categories found, showing empty state");
    return <div className="text-center text-muted-foreground">No categories have been defined for this tournament.</div>;
  }

  const currentCategory = tournament.categories.find(c => c.id === selectedCategory);
  if (!currentCategory) {
    console.log("Selected category not found:", selectedCategory);
    return <div className="text-center text-muted-foreground">Selected category not found.</div>;
  }
  
  console.log("Current category:", currentCategory.name);
  
  // Filter matches and teams by the selected category
  const categoryMatches = tournament.matches.filter(match => 
    match.category && match.category.id === selectedCategory
  );
  
  const categoryTeams = tournament.teams.filter(team => 
    team.category && team.category.id === selectedCategory
  );
  
  console.log("Filtered matches:", categoryMatches.length);
  console.log("Filtered teams:", categoryTeams.length);

  // For mobile view, use a dropdown instead of tabs
  if (isMobile) {
    return (
      <div className="space-y-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {tournament.categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="pt-4">
          {activeTab === "bracket" && currentCategory && (
            <BracketTab 
              tournament={{
                ...tournament,
                matches: categoryMatches,
                teams: categoryTeams
              }}
              category={currentCategory}
            />
          )}
        </div>
      </div>
    );
  }

  // For desktop view, use tabs
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid" style={{ 
            gridTemplateColumns: `repeat(${Math.min(tournament.categories.length, 5)}, minmax(0, 1fr))` 
          }}>
            {tournament.categories.map(category => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </Card>

      <div className="pt-4">
        {activeTab === "bracket" && currentCategory && (
          <BracketTab 
            tournament={{
              ...tournament,
              matches: categoryMatches,
              teams: categoryTeams
            }}
            category={currentCategory}
          />
        )}
      </div>
    </div>
  );
};

export default CategoryTabs;
