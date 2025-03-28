
import React from "react";
import { Terminal, CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tournament } from "@/types/tournament";
import { format } from 'date-fns';
import TournamentScoringSettingsSection from "@/components/tournament/TournamentScoringSettingsSection";

interface OverviewTabProps {
  tournament: Tournament;
  onUpdateTournament: (tournament: Tournament) => void;
  onAutoAssignCourts: () => void;
  onGenerateMultiStageTournament: () => void;
  onScheduleDialogOpen: () => void;
  onAdvanceToNextStage: () => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  tournament,
  onUpdateTournament,
  onAutoAssignCourts,
  onGenerateMultiStageTournament,
  onScheduleDialogOpen,
  onAdvanceToNextStage
}) => {
  const getNextStageName = (currentStage: string) => {
    switch (currentStage) {
      case "INITIAL_ROUND": return "Division Placement";
      case "DIVISION_PLACEMENT": return "Playoff Knockout";
      case "PLAYOFF_KNOCKOUT": return "Completed";
      default: return "Next Stage";
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Tournament Details</CardTitle>
            <CardDescription>Information about the tournament</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Format</p>
                <p>{tournament.format}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <p>{tournament.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Start Date</p>
                <p>{tournament.startDate ? format(new Date(tournament.startDate), 'PPP') : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">End Date</p>
                <p>{tournament.endDate ? format(new Date(tournament.endDate), 'PPP') : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Auto-Assign Courts</p>
                <p>{tournament.autoAssignCourts ? "Enabled" : "Disabled"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Division Progression</p>
                <p>{tournament.divisionProgression ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
            
            {/* Court Auto Assignment Button */}
            <Button 
              onClick={onAutoAssignCourts}
              className="w-full mt-4 bg-green-600 hover:bg-green-700"
            >
              <Terminal className="h-4 w-4 mr-2" />
              Auto-Assign Courts to Matches
            </Button>
            
            {/* Generate and Auto Schedule buttons */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button 
                onClick={onGenerateMultiStageTournament}
                className="bg-blue-600 hover:bg-blue-700"
                title="Creates all tournament matches based on your team structure"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Generate Tournament
              </Button>
              <Button 
                onClick={onScheduleDialogOpen}
                className="bg-purple-600 hover:bg-purple-700"
                title="Schedule match times and courts automatically"
              >
                <Clock className="h-4 w-4 mr-2" />
                Auto Schedule
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add Scoring Settings Card */}
        <TournamentScoringSettingsSection 
          tournament={tournament} 
          onUpdateTournament={onUpdateTournament} 
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tournament Progress</CardTitle>
          <CardDescription>Track the progress of the tournament</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Current Stage: {tournament.currentStage}</p>
          {tournament.status !== "COMPLETED" && tournament.status !== "DRAFT" && (
            <Button onClick={onAdvanceToNextStage}>
              Advance to {getNextStageName(tournament.currentStage)}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;
