
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Settings, Share2, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useTournament } from '@/contexts/tournament/useTournament';
import { Team, Match, Court, TournamentCategory, TournamentFormat, Tournament } from '@/types/tournament';
import AddTeamDialog from '@/components/tournament/AddTeamDialog';
import ImportTeamsDialog from '@/components/tournament/ImportTeamsDialog';
import MatchTable from '@/components/match/MatchTable';
import ScheduleMatchDialog from '@/components/tournament/ScheduleMatchDialog';
import PageHeader from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import OverviewTab from '@/components/tournament/tabs/OverviewTab';
import CategoryTabs from '@/components/tournament/tabs/CategoryTabs';
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from '@/components/ui/use-toast';
import UnifiedScheduleDialog from '@/components/tournament/UnifiedScheduleDialog';
import { generateId } from '@/utils/tournamentUtils';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useRealtimeTournamentUpdates } from '@/hooks/useRealtimeTournamentUpdates';
import ScoringSettingsDialog from '@/components/tournament/ScoringSettingsDialog';
import { ScoringSettings } from '@/types/tournament';

const TournamentDetails: React.FC = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { 
    tournaments, 
    currentTournament, 
    setCurrentTournament,
    addTeam,
    importTeams,
    updateMatch,
    assignCourt,
    scheduleMatch,
    autoAssignCourts,
    generateMultiStageTournament,
    advanceToNextStage,
    updateMatchStatus,
    updateTournament
  } = useTournament();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [openAddTeamDialog, setOpenAddTeamDialog] = useState(false);
  const [openImportTeamsDialog, setOpenImportTeamsDialog] = useState(false);
  const [openScheduleMatchDialog, setOpenScheduleMatchDialog] = useState(false);
  const [openUnifiedScheduleDialog, setOpenUnifiedScheduleDialog] = useState(false);
  const [openScoringSettingsDialog, setOpenScoringSettingsDialog] = useState(false);
  const [selectedTab, setSelectedTab] = React.useState("overview");

  // Load tournament details when component mounts
  useEffect(() => {
    if (tournamentId) {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (tournament) {
        setCurrentTournament(tournament);
        setIsLoading(false);
      } else {
        toast({
          title: "Error",
          description: "Tournament not found",
          variant: "destructive",
        });
        setIsLoading(false);
        navigate("/tournaments");
      }
    }
  }, [tournamentId, tournaments, navigate, setCurrentTournament]);

  useRealtimeTournamentUpdates(tournamentId || "");

  // Handle state when tournament is not yet loaded
  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-[200px]" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-[350px]" />
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </CardContent>
      </Card>
    );
  }

  // Handle state when tournament is loaded
  const tournament = currentTournament;
  if (!tournament) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Tournament Not Found</CardTitle>
          <CardDescription>
            The requested tournament could not be found.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleAddTeam = (team: Team) => {
    addTeam(team);
    setOpenAddTeamDialog(false);
  };

  const handleImportTeams = (teams: Team[]) => {
    importTeams(teams);
    setOpenImportTeamsDialog(false);
  };

  const handleScheduleMatch = (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string, categoryId?: string) => {
    scheduleMatch(team1Id, team2Id, scheduledTime, courtId, categoryId);
    setOpenScheduleMatchDialog(false);
  };

  const handleAutoAssignCourts = async () => {
    if (tournament) {
      await autoAssignCourts();
    }
  };

  const handleGenerateMultiStageTournament = async () => {
    if (tournament) {
      await generateMultiStageTournament();
    }
  };

  const handleAdvanceToNextStage = async () => {
    if (tournament) {
      await advanceToNextStage();
    }
  };

  const onCourtAssign = (matchId: string, courtId: string) => {
    if (tournament) {
      // Find the match and update court assignment
      // Then update the tournament with the modified match
      assignCourt(matchId, courtId);
    }
  }

  const onMatchUpdate = (updatedMatch: Match) => {
    if (tournament) {
      // Update the match in the tournament
      updateMatch(updatedMatch);
    }
  }

  return (
    <div>
      <PageHeader 
        title={tournament.name}
        description={tournament.description}
        action={
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={() => setOpenScoringSettingsDialog(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Scoring Settings
            </Button>
            <Button size="sm" variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          {/* <TabsTrigger value="matches">Matches</TabsTrigger> */}
          {/* <TabsTrigger value="teams">Teams</TabsTrigger> */}
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <OverviewTab 
            tournament={tournament} 
            onUpdateTournament={(tournament) => updateTournament(tournament.id, tournament)}
            onGenerateMultiStageTournament={handleGenerateMultiStageTournament}
            onAdvanceToNextStage={handleAdvanceToNextStage}
            onScheduleDialogOpen={() => setOpenScheduleMatchDialog(true)}
          />
        </TabsContent>
        <TabsContent value="categories">
          <CategoryTabs tournament={tournament} />
        </TabsContent>
      </Tabs>

      <AddTeamDialog 
        open={openAddTeamDialog} 
        onOpenChange={setOpenAddTeamDialog} 
        tournamentId={tournamentId || ""} 
      />

      <ImportTeamsDialog 
        open={openImportTeamsDialog} 
        onOpenChange={setOpenImportTeamsDialog} 
        tournamentId={tournamentId || ""}
        onImportTeams={handleImportTeams}
      />

      <ScheduleMatchDialog
        open={openScheduleMatchDialog}
        onOpenChange={setOpenScheduleMatchDialog}
        tournamentId={tournamentId || ""}
        onCreateMatch={handleScheduleMatch}
      />

      <UnifiedScheduleDialog
        open={openUnifiedScheduleDialog}
        onOpenChange={setOpenUnifiedScheduleDialog}
        tournament={tournament}
      />

      <ScoringSettingsDialog
        open={openScoringSettingsDialog}
        onOpenChange={setOpenScoringSettingsDialog}
        tournament={tournament}
      />
    </div>
  );
};

export default TournamentDetails;
