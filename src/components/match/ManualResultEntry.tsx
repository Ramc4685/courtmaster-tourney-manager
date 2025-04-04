import React, { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Match } from "@/types/tournament";
import { useTournament } from "@/contexts/tournament/useTournament";
import { ClipboardEdit } from "lucide-react";

interface ManualResultEntryProps {
  match: Match;
  onComplete?: (match: Match) => void;
  renderButton?: (onClick: () => void) => React.ReactNode;
}

const ManualResultEntry: React.FC<ManualResultEntryProps> = ({ match, onComplete, renderButton }) => {
  const [open, setOpen] = useState(false);
  const [team1Score, setTeam1Score] = useState(match.scores[0]?.team1Score || 0);
  const [team2Score, setTeam2Score] = useState(match.scores[0]?.team2Score || 0);
  const { completeMatch, updateMatchScore } = useTournament();
  
  const handleSave = () => {
    // Update the score for set 0 (first set)
    updateMatchScore(match.id, 0, team1Score, team2Score);
    
    // Close the dialog
    setOpen(false);
    
    // Optionally complete the match
    if (onComplete) {
      onComplete({
        ...match,
        scores: [{ team1Score, team2Score }]
      });
    }
  };
  
  const handleComplete = () => {
    // Update the score first
    updateMatchScore(match.id, 0, team1Score, team2Score);
    
    // Then complete the match
    completeMatch(match.id);
    
    // Close the dialog
    setOpen(false);
    
    // Notify parent about the update
    if (onComplete) {
      onComplete({
        ...match,
        status: "COMPLETED",
        scores: [{ team1Score, team2Score }]
      });
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {renderButton ? (
        renderButton(handleOpen)
      ) : (
        <DialogTrigger asChild>
          <Button 
            variant="default" 
            className="bg-green-600 hover:bg-green-700 w-full"
          >
            <ClipboardEdit className="h-4 w-4 mr-2" />
            Record Result
          </Button>
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Match Result</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">
                {match.team1.name} vs {match.team2.name}
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="team1Score">{match.team1.name}</Label>
                <Input 
                  id="team1Score"
                  type="number" 
                  value={team1Score}
                  onChange={(e) => setTeam1Score(Number(e.target.value))}
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="team2Score">{match.team2.name}</Label>
                <Input 
                  id="team2Score"
                  type="number" 
                  value={team2Score}
                  onChange={(e) => setTeam2Score(Number(e.target.value))}
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleSave}
            >
              Save Score
            </Button>
            <Button 
              variant="default"
              onClick={handleComplete}
            >
              Complete Match
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualResultEntry;
