import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Tournament,
  Team,
  Court,
  Match,
  TournamentCategory,
  TournamentFormat,
} from '@/types/tournament';
import { useTournament } from '@/contexts/tournament/useTournament';
import PageHeader from '@/components/shared/PageHeader';
import { Plus, Settings, Users, LayoutGrid, Calendar, ListChecks, Shuffle, PlaySquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddTeamDialog from '@/components/tournament/AddTeamDialog';
import ImportTeamsDialog from '@/components/tournament/ImportTeamsDialog';
import MatchTable from '@/components/match/MatchTable';
import ManualCourtAssignment from '@/components/match/ManualCourtAssignment';
import MatchCreateDialog from '@/components/match/MatchCreateDialog';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator";
import { OverviewTab } from '@/components/tournament/tabs/OverviewTab';
import { CategoryTabs } from '@/components/tournament/tabs/CategoryTabs';
import { TeamManagementTab } from '@/components/tournament/tabs/TeamManagementTab';
import { ScheduleMatches } from '@/components/tournament/actions/ScheduleMatches';
import { UnifiedScheduleDialog } from '@/components/tournament/UnifiedScheduleDialog';
import { ScheduleMatchDialog } from '@/components/tournament/ScheduleMatchDialog';
import { ScoreEntrySection } from '@/components/tournament/score-entry/ScoreEntrySection';

const TournamentDetail: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
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
  } = useTournament();
  const [isAddTeamDialogOpen, setIsAddTeamDialogOpen] = useState(false);
  const [isImportTeamsDialogOpen, setIsImportTeamsDialogOpen] = useState(false);
  const [isCreateMatchDialogOpen, setIsCreateMatchDialogOpen] = useState(false);
  const [isUnifiedScheduleDialogOpen, setIsUnifiedScheduleDialogOpen] = useState(false);
  const [isScheduleMatchDialogOpen, setIsScheduleMatchDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = React.useState("overview");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (tournament) {
        setCurrentTournament(tournament);
      } else {
        toast({
          title: "Tournament Not Found",
          description: "The requested tournament could not be found.",
          variant: "destructive",
        });
        navigate("/tournaments");
      }
    }
  }, [tournamentId, tournaments, navigate, setCurrentTournament]);

  if (!currentTournament) {
    return <div>Loading...</div>;
  }

  const handleTeamAdded = (team: Team) => {
    if (tournamentId) {
      addTeam(team);
    }
  };

  const handleTeamsImported = (teams: Team[]) => {
    if (tournamentId) {
      importTeams(teams);
    }
  };

  const handleMatchUpdated = (match: Match) => {
    updateMatch(match);
  };

  const handleCourtAssigned = (matchId: string, courtId: string) => {
    assignCourt(matchId, courtId);
  };

  const handleCreateMatch = (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string, categoryId?: string) => {
    if (tournamentId) {
      scheduleMatch(team1Id, team2Id, scheduledTime, courtId, categoryId);
      setIsCreateMatchDialogOpen(false);
    }
  };

  const handleAutoAssignCourts = async () => {
    setIsLoading(true);
    try {
      const assignedCount = await autoAssignCourts();
      toast({
        title: "Courts Auto-Assigned",
        description: `${assignedCount} courts have been automatically assigned.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to auto-assign courts.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMultiStageTournament = async () => {
    setIsLoading(true);
    try {
      await generateMultiStageTournament();
      toast({
        title: "Multi-Stage Tournament Generated",
        description: "The multi-stage tournament has been generated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate multi-stage tournament.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdvanceToNextStage = async () => {
    setIsLoading(true);
    try {
      await advanceToNextStage();
      toast({
        title: "Advanced to Next Stage",
        description: "The tournament has been advanced to the next stage.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to advance to the next stage.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={currentTournament.name}
        description={`Manage and view details for the ${currentTournament.name} tournament.`}
        action={
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/tournament/edit/${currentTournament.id}`)}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Tournament
            </Button>
            <Button onClick={handleGenerateMultiStageTournament} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4 mr-2" />}
              Generate Multi-Stage
            </Button>
            <Button onClick={handleAdvanceToNextStage} disabled={isLoading}>
              <PlaySquare className="h-4 w-4 mr-2" />
              Advance Stage
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="categories">
            <ListChecks className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="teams">
            <Users className="h-4 w-4 mr-2" />
            Teams
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="scoring">
            <PlaySquare className="h-4 w-4 mr-2" />
            Scoring
          </TabsTrigger>
        </TabsList>
        <Separator className="my-2" />
        <TabsContent value="overview" className="space-y-4">
          <OverviewTab tournament={currentTournament} />
        </TabsContent>
        <TabsContent value="categories" className="space-y-4">
          <CategoryTabs tournament={currentTournament} />
        </TabsContent>
        <TabsContent value="teams" className="space-y-4">
          <TeamManagementTab tournament={currentTournament} />
        </TabsContent>
        <TabsContent value="schedule" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Match Schedule</h2>
            <div className="flex gap-2">
              <Button onClick={() => setIsCreateMatchDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Match
              </Button>
              <Button onClick={() => setIsUnifiedScheduleDialogOpen(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Unified Schedule
              </Button>
              <Button onClick={() => setIsScheduleMatchDialogOpen(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Matches
              </Button>
              <Button onClick={handleAutoAssignCourts} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
                Auto Assign Courts
              </Button>
            </div>
          </div>
          <MatchTable
            matches={currentTournament.matches}
            teams={currentTournament.teams}
            courts={currentTournament.courts}
            onMatchUpdate={handleMatchUpdated}
            onCourtAssign={handleCourtAssigned}
          />
        </TabsContent>
        <TabsContent value="scoring" className="space-y-4">
          <ScoreEntrySection />
        </TabsContent>
      </Tabs>

      <AddTeamDialog
        open={isAddTeamDialogOpen}
        onOpenChange={setIsAddTeamDialogOpen}
        tournamentId={tournamentId || ""}
      />
      <ImportTeamsDialog
        open={isImportTeamsDialogOpen}
        onOpenChange={setIsImportTeamsDialogOpen}
        tournamentId={tournamentId || ""}
        onTeamsImported={handleTeamsImported}
      />
      <MatchCreateDialog
        open={isCreateMatchDialogOpen}
        onOpenChange={setIsCreateMatchDialogOpen}
        onCreateMatch={handleCreateMatch}
      />
      <UnifiedScheduleDialog
        open={isUnifiedScheduleDialogOpen}
        onOpenChange={setIsUnifiedScheduleDialogOpen}
      />
      <ScheduleMatchDialog
        open={isScheduleMatchDialogOpen}
        onOpenChange={setIsScheduleMatchDialogOpen}
      />
    </div>
  );
};

export default TournamentDetail;
