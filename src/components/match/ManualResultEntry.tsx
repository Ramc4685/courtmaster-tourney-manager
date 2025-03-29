
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
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  // Reset scores when match changes or dialog opens
  React.useEffect(() => {
    if (open) {
      setScores(
        match.scores && match.scores.length > 0 
          ? [...match.scores] 
          : [{ team1Score: 0, team2Score: 0 }]
      );
    }
  }, [match, open]);

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
    
    toast({
      title: "Match score recorded",
      description: `Recorded score for ${match.team1.name} vs ${match.team2.name}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={match.status === "IN_PROGRESS" ? "default" : "outline"} 
          size="sm" 
          className={match.status === "IN_PROGRESS" ? "bg-green-600 hover:bg-green-700" : ""}
        >
          <ClipboardEdit className="h-4 w-4 mr-1" /> 
          {match.status === "IN_PROGRESS" ? "Record Result" : "Edit Match"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Match Result</DialogTitle>
          <DialogDescription>
            Enter the final score for {match.team1.name} vs {match.team2.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            {scores.map((score, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Set {index + 1}
                  </label>
                  <div className="grid grid-cols-5 gap-2 items-center">
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 mb-1">{match.team1.name}</p>
                      <Input
                        type="number"
                        min="0"
                        value={score.team1Score}
                        onChange={(e) => handleScoreChange(index, 'team1', e.target.value)}
                      />
                    </div>
                    <div className="text-center text-gray-500">vs</div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 mb-1">{match.team2.name}</p>
                      <Input
                        type="number"
                        min="0"
                        value={score.team2Score}
                        onChange={(e) => handleScoreChange(index, 'team2', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                {scores.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSet(index)}
                    className="mt-6"
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSet}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Set
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-1" /> Complete Match
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualResultEntry;
