
import React from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Match, ScoringSettings } from "@/types/tournament";
import { countSetsWon } from "@/utils/matchUtils";

interface ScoringConfirmationDialogsProps {
  selectedMatch: Match | null;
  currentSet: number;
  newSetDialogOpen: boolean;
  setNewSetDialogOpen: (open: boolean) => void;
  completeMatchDialogOpen: boolean;
  setCompleteMatchDialogOpen: (open: boolean) => void;
  onNewSet: () => void;
  onCompleteMatch: () => void;
}

const ScoringConfirmationDialogs: React.FC<ScoringConfirmationDialogsProps> = ({
  selectedMatch,
  currentSet,
  newSetDialogOpen,
  setNewSetDialogOpen,
  completeMatchDialogOpen,
  setCompleteMatchDialogOpen,
  onNewSet,
  onCompleteMatch
}) => {
  // Get set winner information for the confirmation dialog
  const getSetWinnerInfo = () => {
    if (!selectedMatch) return { team: "", score: "" };
    
    const currentScores = selectedMatch.scores[currentSet];
    if (!currentScores) return { team: "", score: "" };
    
    const winningTeam = currentScores.team1Score > currentScores.team2Score ? 
      selectedMatch.team1.name : selectedMatch.team2.name;
    
    const score = `${currentScores.team1Score}-${currentScores.team2Score}`;
    
    return { team: winningTeam, score };
  };

  // Determine the match winner information for the confirmation dialog
  const getMatchWinnerInfo = () => {
    if (!selectedMatch) return { team: "", sets: "" };
    
    const { team1Sets, team2Sets } = countSetsWon(selectedMatch);
    
    const winningTeam = team1Sets > team2Sets ? selectedMatch.team1.name : selectedMatch.team2.name;
    const sets = `${team1Sets}-${team2Sets}`;
    
    return { team: winningTeam, sets };
  };

  return (
    <>
      {/* New Set Confirmation Dialog */}
      <AlertDialog open={newSetDialogOpen} onOpenChange={setNewSetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Current Set?</AlertDialogTitle>
            <AlertDialogDescription>
              {getSetWinnerInfo().team} has won the set with a score of {getSetWinnerInfo().score}. 
              Do you want to end this set and start a new one?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onNewSet}>Yes, End Set</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Match Confirmation Dialog */}
      <AlertDialog open={completeMatchDialogOpen} onOpenChange={setCompleteMatchDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              Complete Match?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getMatchWinnerInfo().team} has won the match {getMatchWinnerInfo().sets} sets. 
              Are you sure you want to mark this match as complete? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onCompleteMatch}>Yes, Complete Match</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ScoringConfirmationDialogs;
