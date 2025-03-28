
import React, { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Match, Team } from "@/types/tournament";
import { Edit, Save, Plus, Trash, ClipboardEdit } from "lucide-react";
import { determineMatchWinnerAndLoser, getDefaultScoringSettings } from "@/utils/matchUtils";

interface ManualResultEntryProps {
  match: Match;
  onComplete: (updatedMatch: Match) => void;
}

const ManualResultEntry: React.FC<ManualResultEntryProps> = ({
  match,
  onComplete,
}) => {
  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState<{ team1Score: number; team2Score: number }[]>(
    match.scores && match.scores.length > 0 
      ? [...match.scores] 
      : [{ team1Score: 0, team2Score: 0 }]
  );

  const handleScoreChange = (setIndex: number, team: 'team1' | 'team2', value: string) => {
    const newScores = [...scores];
    const numValue = parseInt(value) || 0;
    
    if (team === 'team1') {
      newScores[setIndex].team1Score = numValue;
    } else {
      newScores[setIndex].team2Score = numValue;
    }
    
    setScores(newScores);
  };

  const addSet = () => {
    setScores([...scores, { team1Score: 0, team2Score: 0 }]);
  };

  const removeSet = (index: number) => {
    if (scores.length <= 1) return;
    const newScores = [...scores];
    newScores.splice(index, 1);
    setScores(newScores);
  };

  const handleComplete = () => {
    // Use the scoring settings from the tournament or default
    const scoringSettings = getDefaultScoringSettings();
    
    // Create updated match with new scores
    const updatedMatch = {
      ...match,
      scores: scores,
      status: "COMPLETED" as const
    };
    
    // Determine winner based on scores
    const result = determineMatchWinnerAndLoser(updatedMatch, scoringSettings);
    
    if (result) {
      const { winner, loser } = result;
      updatedMatch.winner = winner;
      updatedMatch.loser = loser;
    }
    
    onComplete(updatedMatch);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={match.status === "IN_PROGRESS" ? "default" : "outline"} 
          size="sm" 
          className={match.status === "IN_PROGRESS" ? "bg-court-green hover:bg-court-green/90" : ""}
        >
          <ClipboardEdit className="h-4 w-4 mr-1" /> 
          {match.status === "COMPLETED" ? "Edit Result" : "Enter Score"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Match Result</DialogTitle>
          <DialogDescription>
            {match.team1.name} vs {match.team2.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
            <div className="text-center font-medium">{match.team1.name}</div>
            <div className="text-center">vs</div>
            <div className="text-center font-medium">{match.team2.name}</div>
            <div></div>
          </div>
          
          {scores.map((score, index) => (
            <div key={index} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
              <Input
                type="number"
                min="0"
                value={score.team1Score}
                onChange={(e) => handleScoreChange(index, 'team1', e.target.value)}
                className="text-center"
              />
              <div className="text-center">-</div>
              <Input
                type="number"
                min="0"
                value={score.team2Score}
                onChange={(e) => handleScoreChange(index, 'team2', e.target.value)}
                className="text-center"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSet(index)}
                disabled={scores.length <= 1}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={addSet}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Set
          </Button>
        </div>
        
        <DialogFooter>
          <Button onClick={handleComplete} className="bg-court-green hover:bg-court-green/90">
            <Save className="h-4 w-4 mr-1" /> Save Result
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualResultEntry;
