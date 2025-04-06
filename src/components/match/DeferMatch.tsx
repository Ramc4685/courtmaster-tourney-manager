
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
import { useTournament } from "@/contexts/tournament/useTournament";
import { Match } from "@/types/tournament";
import { Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeferMatchProps {
  match: Match;
}

const DeferMatch: React.FC<DeferMatchProps> = ({ match }) => {
  const [open, setOpen] = useState(false);
  const { updateMatchStatus } = useTournament();
  const { toast } = useToast();
  
  const handleDefer = () => {
    // If the match has a court assigned, we'll free it up when deferring
    updateMatchStatus(match.id, "SCHEDULED");
    
    setOpen(false);
    
    toast({
      title: "Match deferred",
      description: "The match has been returned to the scheduled state and its court is now available.",
    });
  };

  // Only show for IN_PROGRESS matches
  if (match.status !== "IN_PROGRESS") {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 w-full"
        >
          <Clock className="h-4 w-4 mr-2" /> 
          Defer Match
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Defer Match</DialogTitle>
          <DialogDescription>
            This will return the match to "Scheduled" status and free up the court.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="border p-4 rounded-md bg-amber-50">
            <h3 className="font-medium mb-2">Match Details</h3>
            <p className="mb-1">
              <span className="font-medium">{match.team1.name}</span> vs <span className="font-medium">{match.team2.name}</span>
            </p>
            {match.courtNumber && (
              <p className="text-sm mb-1">Court: {match.courtNumber}</p>
            )}
            {match.scheduledTime && (
              <p className="text-sm">
                <Calendar className="h-3 w-3 inline mr-1" />
                {new Date(match.scheduledTime).toLocaleString()}
              </p>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mt-4">
            Deferring this match will:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
            <li>Reset its status to "Scheduled"</li>
            <li>Free up the assigned court</li>
            <li>Keep the current schedule time</li>
            <li>Clear any in-progress scores</li>
          </ul>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="default"
            className="bg-amber-600 hover:bg-amber-700"
            onClick={handleDefer}
          >
            Defer Match
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeferMatch;
