
import React, { useState, useEffect } from "react";
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
import { Match, Court } from "@/types/tournament";
import { Clipboard, MapPin } from "lucide-react";
import { useTournament } from "@/contexts/TournamentContext";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ManualCourtAssignmentProps {
  match: Match;
  courts: Court[];
  onCourtAssign: (matchId: string, courtId: string) => void;
}

const ManualCourtAssignment: React.FC<ManualCourtAssignmentProps> = ({
  match,
  courts,
  onCourtAssign
}) => {
  const [open, setOpen] = useState(false);
  const [selectedCourtId, setSelectedCourtId] = useState<string>("");
  const { toast } = useToast();
  
  // Filter available courts
  const availableCourts = courts.filter(court => 
    court.status === "AVAILABLE" || 
    (match.courtNumber && court.number === match.courtNumber)
  );
  
  // Reset selection when dialog opens or match changes
  useEffect(() => {
    if (open) {
      // If match has court already assigned, select it
      if (match.courtNumber) {
        const currentCourt = courts.find(c => c.number === match.courtNumber);
        if (currentCourt) {
          setSelectedCourtId(currentCourt.id);
          return;
        }
      }
      setSelectedCourtId("");
    }
  }, [open, match, courts]);

  const handleAssignCourt = () => {
    if (!selectedCourtId) {
      toast({
        title: "No court selected",
        description: "Please select a court to assign",
        variant: "destructive"
      });
      return;
    }
    
    onCourtAssign(match.id, selectedCourtId);
    setOpen(false);
    
    const courtName = courts.find(c => c.id === selectedCourtId)?.name || 
                      `Court ${courts.find(c => c.id === selectedCourtId)?.number}`;
    
    toast({
      title: "Court assigned",
      description: `${match.team1.name} vs ${match.team2.name} assigned to ${courtName}`
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
        >
          <MapPin className="h-4 w-4 mr-1" /> 
          {match.courtNumber ? "Change Court" : "Assign Court"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Court</DialogTitle>
          <DialogDescription>
            {match.courtNumber 
              ? `Update court assignment for match between ${match.team1.name} and ${match.team2.name}` 
              : `Assign a court to match between ${match.team1.name} and ${match.team2.name}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            {match.courtNumber && (
              <div className="border rounded-md p-3 bg-yellow-50">
                <p className="text-sm text-amber-800">
                  This match is currently assigned to Court {match.courtNumber}.
                  Changing this will free up the current court and assign a new one.
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Court
              </label>
              
              {availableCourts.length === 0 ? (
                <div className="text-sm text-red-500">
                  No courts available for assignment.
                </div>
              ) : (
                <Select
                  value={selectedCourtId}
                  onValueChange={setSelectedCourtId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a court" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourts.map(court => (
                      <SelectItem key={court.id} value={court.id}>
                        {court.name || `Court ${court.number}`}
                        {court.number === match.courtNumber ? " (Current)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={handleAssignCourt} 
            disabled={availableCourts.length === 0 || !selectedCourtId}
          >
            <MapPin className="h-4 w-4 mr-1" /> Assign Court
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualCourtAssignment;
