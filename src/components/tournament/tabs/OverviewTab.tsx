
import React, { useState } from "react";
import { Terminal, CalendarIcon, Clock, Award, ActivitySquare, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tournament } from "@/types/tournament";
import { format } from 'date-fns';
import TournamentScoringSettingsSection from "@/components/tournament/TournamentScoringSettingsSection";
import TournamentFormatExplanation from "@/components/tournament/TournamentFormatExplanation";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface OverviewTabProps {
  tournament: Tournament;
  onUpdateTournament: (tournament: Tournament) => void;
  onGenerateMultiStageTournament: () => void;
  onAdvanceToNextStage: () => void;
  onScheduleDialogOpen: () => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  tournament,
  onUpdateTournament,
  onGenerateMultiStageTournament,
  onAdvanceToNextStage,
  onScheduleDialogOpen
}) => {
  const getNextStageName = (currentStage: string) => {
    switch (currentStage) {
      case "INITIAL_ROUND": return "Division Placement";
      case "DIVISION_PLACEMENT": return "Playoff Knockout";
      case "PLAYOFF_KNOCKOUT": return "Completed";
      case "GROUP_STAGE": return "Elimination Round";
      default: return "Next Stage";
    }
  };
  
  // Calculate tournament statistics
  const totalMatches = tournament.matches.length;
  const completedMatches = tournament.matches.filter(m => m.status === "COMPLETED").length;
  const inProgressMatches = tournament.matches.filter(m => m.status === "IN_PROGRESS").length;
  const progressPercentage = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "bg-gray-500";
      case "PUBLISHED": return "bg-blue-500";
      case "IN_PROGRESS": return "bg-green-500";
      case "COMPLETED": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Tournament Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Tournament Summary</CardTitle>
              <Badge className={`${getStatusColor(tournament.status)}`}>
                {tournament.status}
              </Badge>
            </div>
            <CardDescription>Key information about the tournament</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Stage</p>
                <p className="text-base font-semibold">{tournament.currentStage.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                <p className="text-base font-semibold">
                  {tournament.startDate ? format(new Date(tournament.startDate), 'PPP') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">End Date</p>
                <p className="text-base font-semibold">
                  {tournament.endDate ? format(new Date(tournament.endDate), 'PPP') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teams</p>
                <p className="text-base font-semibold">{tournament.teams.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-base font-semibold">{tournament.categories.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Courts</p>
                <p className="text-base font-semibold">{tournament.courts.length}</p>
              </div>
            </div>
            
            {/* Tournament Progress */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-sm">
                <span>Tournament Progress</span>
                <span>{completedMatches} of {totalMatches} matches completed</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <Button 
                onClick={onScheduleDialogOpen}
                className="bg-purple-600 hover:bg-purple-700 flex items-center"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Schedule Matches & Assign Courts
              </Button>
              
              <Button 
                onClick={onGenerateMultiStageTournament}
                className="bg-blue-600 hover:bg-blue-700 flex items-center"
              >
                <ActivitySquare className="h-4 w-4 mr-2" />
                Generate Tournament Brackets
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Tournament Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <BarChart className="h-5 w-5 mr-2" />
              Tournament Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Match Statistics */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Completed Matches</span>
                <span className="font-semibold">{completedMatches}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">In Progress</span>
                <span className="font-semibold">{inProgressMatches}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Scheduled</span>
                <span className="font-semibold">
                  {tournament.matches.filter(m => m.status === "SCHEDULED").length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Courts in Use</span>
                <span className="font-semibold">
                  {tournament.courts.filter(c => c.status === "IN_USE").length}
                </span>
              </div>
            </div>
            
            {/* Stage Progression */}
            {tournament.status !== "COMPLETED" && tournament.status !== "DRAFT" && (
              <Button 
                onClick={onAdvanceToNextStage}
                className="w-full mt-2 bg-green-600 hover:bg-green-700 flex items-center justify-center"
              >
                <Award className="h-4 w-4 mr-2" />
                Advance to {getNextStageName(tournament.currentStage)}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Tournament Scoring Settings */}
      <TournamentScoringSettingsSection 
        tournament={tournament} 
        onUpdateTournament={onUpdateTournament} 
      />
      
      {/* Tournament Format Explanation */}
      <TournamentFormatExplanation tournament={tournament} />
    </div>
  );
};

export default OverviewTab;
