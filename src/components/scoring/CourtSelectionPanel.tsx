
import React from "react";
import { Court, Match } from "@/types/tournament";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CheckCircle2 } from "lucide-react";

interface CourtSelectionPanelProps {
  courts: Court[];
  matches: Match[]; // Added matches to the interface
  onCourtSelect: (court: Court) => void;
  onMatchSelect: (match: Match) => void;
  onStartMatch: (match: Match) => void;
}

const CourtSelectionPanel: React.FC<CourtSelectionPanelProps> = ({
  courts,
  matches, // Accept matches prop
  onCourtSelect,
  onMatchSelect,
  onStartMatch
}) => {
  const [selectedCourt, setSelectedCourt] = React.useState<Court | null>(null);
  const [courtDetailsOpen, setCourtDetailsOpen] = React.useState(false);

  const handleCourtSelect = (court: Court) => {
    setSelectedCourt(court);
    onCourtSelect(court);
    
    // If court has a match in progress, directly open court details
    if (court.status === "IN_USE" && court.currentMatch) {
      setCourtDetailsOpen(true);
    }
  };

  const handleStartMatch = (match: Match) => {
    onStartMatch(match);
    setCourtDetailsOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {courts.map((court) => (
          <Card 
            key={court.id}
            className={`cursor-pointer border-2 hover:bg-gray-50 transition-colors ${
              selectedCourt?.id === court.id 
                ? 'border-court-green' 
                : court.status === "IN_USE" 
                  ? 'border-amber-400' 
                  : court.status === "MAINTENANCE" 
                    ? 'border-red-400' 
                    : 'border-gray-200'
            }`}
            onClick={() => handleCourtSelect(court)}
          >
            <CardContent className="p-4 text-center">
              <div className="font-bold text-xl">{court.name}</div>
              <div className="text-sm mt-1">
                {court.status === "AVAILABLE" && "Available"}
                {court.status === "IN_USE" && "Match in progress"}
                {court.status === "MAINTENANCE" && "Under maintenance"}
              </div>
              {court.currentMatch && (
                <div className="mt-2 text-xs">
                  {court.currentMatch.team1.name} vs {court.currentMatch.team2.name}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCourt && selectedCourt.status === "IN_USE" && selectedCourt.currentMatch && (
        <Sheet open={courtDetailsOpen} onOpenChange={setCourtDetailsOpen}>
          <Button 
            onClick={() => setCourtDetailsOpen(true)}
            className="w-full mt-4 bg-court-green hover:bg-court-green/90"
          >
            Continue scoring on Court {selectedCourt.number}
          </Button>
          
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Court {selectedCourt.number}</SheetTitle>
            </SheetHeader>
            <div className="py-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Current Match
                    <span className="text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded-full">In Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Teams:</h3>
                      <p>{selectedCourt.currentMatch.team1.name} vs {selectedCourt.currentMatch.team2.name}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Current Score:</h3>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {selectedCourt.currentMatch.scores.map((score, idx) => (
                          <div key={idx} className="bg-gray-100 px-3 py-2 rounded-md text-sm">
                            Set {idx + 1}: {score.team1Score} - {score.team2Score}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleStartMatch(selectedCourt.currentMatch!)}
                      className="w-full bg-court-green hover:bg-court-green/90"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Continue Scoring
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default CourtSelectionPanel;
