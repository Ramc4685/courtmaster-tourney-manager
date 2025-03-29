
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { TournamentCategory, Tournament } from "@/types/tournament";
import BracketTab from "./BracketTab";
import MatchesTab from "./MatchesTab";
import { useMediaQuery } from "@/hooks/use-mobile";
import ScoreEntrySection from "@/components/tournament/score-entry/ScoreEntrySection";
import { useTournament } from "@/contexts/TournamentContext";

interface CategoryTabsProps {
  tournament: Tournament;
  activeTab: string;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ tournament, activeTab }) => {
  console.log("Rendering CategoryTabs with", tournament.categories.length, "categories");
  console.log("Active tab:", activeTab);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { updateMatch, assignCourt } = useTournament();
  
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Initialize the selected category when tournament loads or changes
  useEffect(() => {
    if (tournament.categories.length > 0 && !selectedCategory) {
      setSelectedCategory(tournament.categories[0].id);
      console.log("Initially selected category:", tournament.categories[0].name);
    }
  }, [tournament.categories, selectedCategory]);

  // Skip if there are no categories
  if (tournament.categories.length === 0) {
    console.log("No categories found, showing empty state");
    return <div className="text-center text-muted-foreground">No categories have been defined for this tournament.</div>;
  }

  const currentCategory = tournament.categories.find(c => c.id === selectedCategory);
  if (!currentCategory && selectedCategory) {
    console.log("Selected category not found:", selectedCategory);
    return <div className="text-center text-muted-foreground">Selected category not found.</div>;
  }
  
  console.log("Current category:", currentCategory?.name);
  
  // Filter matches and teams by the selected category
  const categoryMatches = tournament.matches.filter(match => 
    match.category && match.category.id === selectedCategory
  );
  
  const categoryTeams = tournament.teams.filter(team => 
    team.category && team.category.id === selectedCategory
  );
  
  console.log("Filtered matches:", categoryMatches.length);
  console.log("Filtered teams:", categoryTeams.length);

  // Create a filtered tournament object with only the relevant matches and teams
  const filteredTournament = {
    ...tournament,
    matches: categoryMatches,
    teams: categoryTeams
  };

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
              tournament={filteredTournament}
              category={currentCategory}
            />
          )}
          {activeTab === "matches" && currentCategory && (
            <>
              <ScoreEntrySection 
                matches={categoryMatches} 
                onMatchUpdate={updateMatch} 
              />
              <MatchesTab 
                matches={categoryMatches}
                teams={categoryTeams}
                courts={tournament.courts}
                onMatchUpdate={updateMatch}
                onCourtAssign={assignCourt}
                onAddMatchClick={() => {}}
                onAutoScheduleClick={() => {}}
              />
            </>
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
            tournament={filteredTournament}
            category={currentCategory}
          />
        )}
        {activeTab === "matches" && currentCategory && (
          <>
            <ScoreEntrySection 
              matches={categoryMatches} 
              onMatchUpdate={updateMatch} 
            />
            <MatchesTab 
              matches={categoryMatches}
              teams={categoryTeams}
              courts={tournament.courts}
              onMatchUpdate={updateMatch}
              onCourtAssign={assignCourt}
              onAddMatchClick={() => {}}
              onAutoScheduleClick={() => {}}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryTabs;
