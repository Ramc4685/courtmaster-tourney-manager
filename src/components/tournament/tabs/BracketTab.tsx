
import React, { useState } from "react";
import TournamentBracket from "@/components/tournament/TournamentBracket";
import { Tournament, Division, TournamentCategory } from "@/types/tournament";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface BracketTabProps {
  tournament: Tournament;
  category?: TournamentCategory;
}

const BracketTab: React.FC<BracketTabProps> = ({ tournament, category }) => {
  const [currentDivision, setCurrentDivision] = useState<string>("DIVISION_1");
  
  // Check if tournament has moved to the playoff stage
  const hasPlayoffMatches = tournament.matches.some(m => String(m.stage) === "PLAYOFF_KNOCKOUT");
  
  // Add debugging for category props
  console.log("BracketTab rendering with category:", category?.name);
  console.log("Tournament has playoff matches:", hasPlayoffMatches);
  
  if (!hasPlayoffMatches) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Bracket view will be available after completing the Division Placement stage.
          Current tournament stage: {tournament.currentStage}.
          {category && ` Category: ${category.name}`}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs 
        defaultValue="DIVISION_1" 
        value={currentDivision}
        onValueChange={(value) => setCurrentDivision(value)}
        className="w-fit"
      >
        <TabsList>
          <TabsTrigger value="DIVISION_1">Division 1</TabsTrigger>
          <TabsTrigger value="DIVISION_2">Division 2</TabsTrigger>
          <TabsTrigger value="DIVISION_3">Division 3</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="overflow-x-auto w-full">
        <div className="min-w-[1000px]">
          <TournamentBracket 
            tournament={tournament} 
            division={currentDivision}
          />
        </div>
      </div>
    </div>
  );
};

export default BracketTab;
