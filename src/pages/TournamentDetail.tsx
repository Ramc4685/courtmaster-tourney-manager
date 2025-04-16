import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTournament } from "@/contexts/tournament/useTournament";
import { useAuth } from "@/contexts/auth/AuthContext";
import { Tournament, Team, Match, Court } from "@/types/tournament";
import TournamentHeader from "@/components/tournament/TournamentHeader";
import TournamentSettings from "@/components/tournament/TournamentSettings";
import AddTeamDialog from "@/components/tournament/AddTeamDialog";
import ImportTeamsDialog from "@/components/tournament/ImportTeamsDialog";
import ScheduleMatchDialog from "@/components/tournament/ScheduleMatchDialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import OverviewTab from "@/components/tournament/tabs/OverviewTab";
import BracketTab from "@/components/tournament/tabs/BracketTab";
import MatchesTab from "@/components/tournament/tabs/MatchesTab";
import TeamsTab from "@/components/tournament/tabs/TeamsTab";
import CourtsTab from "@/components/tournament/tabs/CourtsTab";
import TeamManagementTab from "@/components/tournament/tabs/TeamManagementTab";
import ScoreEntrySection from "@/components/tournament/score-entry/ScoreEntrySection";
import CategoryManagementTab from "@/components/tournament/tabs/CategoryManagementTab";
import { RefreshCw } from "lucide-react";

export const TournamentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    selectedTournament,
    updateTournament, 
    deleteTournament, 
    addTeam, 
    importTeams,
    generateMultiStageTournament,
    advanceToNextStage,
    updateMatch,
    updateMatchStatus,
    assignCourt,
    refreshTournament,
    selectTournament
  } = useTournament();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddTeamDialogOpen, setIsAddTeamDialogOpen] = useState(false);
  const [isImportTeamsDialogOpen, setIsImportTeamsDialogOpen] = useState(false);
  const [isScheduleMatchesDialogOpen, setIsScheduleMatchesDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (id && !selectedTournament) {
      // If we have an ID but no selected tournament, try to select it
      selectTournament(id);
    } else if (!id) {
      // If we don't have an ID, redirect to tournaments list
      navigate("/tournaments");
    }
  }, [id, selectedTournament, selectTournament, navigate]);

  const handleUpdateTournament = async (data: Tournament) => {
    try {
      await updateTournament(data);
      toast({
        title: "Success",
        description: "Tournament updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tournament",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTournament = async () => {
    try {
      await deleteTournament(selectedTournament.id);
      toast({
        title: "Success",
        description: "Tournament deleted successfully",
      });
      navigate("/tournaments");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete tournament",
        variant: "destructive",
      });
    }
  };

  const handleAddTeam = (team: Team) => {
    addTeam(team);
    toast({
      title: "Success",
      description: "Team added successfully",
    });
  };

  const handleImportTeams = (teams: Team[]) => {
    importTeams(teams);
    toast({
      title: "Success",
      description: `Successfully imported ${teams.length} teams`,
    });
  };

  const handleCreateMatch = async (matchData: any) => {
    // TODO: Implement match creation
    console.log('Creating match:', matchData);
  };

  const handleMatchUpdate = (match: Match) => {
    updateMatch(match);
  };

  const handleCourtAssign = (matchId: string, courtId: string) => {
    assignCourt(matchId, courtId);
  };

  const handleStartMatch = (matchId: string) => {
    updateMatchStatus(matchId, "IN_PROGRESS");
  };

  const handleCourtUpdate = (court: Court) => {
    // TODO: Implement court update
    console.log('Updating court:', court);
  };

  const handleAddCourt = () => {
    // TODO: Implement add court
    console.log('Adding new court');
  };

  const handleRefresh = async () => {
    if (!id || !user) return;
    setIsRefreshing(true);
    try {
      await refreshTournament(id);
      toast({
        title: "Success",
        description: "Tournament data refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh tournament data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddTeamToCategory = async (categoryId: string, team: Team) => {
    try {
      const updatedTeam = {
        ...team,
        categories: [...(team.categories || []), categoryId]
      };
      await updateTournament({
        ...selectedTournament,
        teams: selectedTournament.teams.map(t => 
          t.id === team.id ? updatedTeam : t
        )
      });
      toast({
        title: "Success",
        description: "Team added to category successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add team to category",
        variant: "destructive",
      });
    }
  };

  const handleRemoveTeamFromCategory = async (categoryId: string, teamId: string) => {
    try {
      const team = selectedTournament.teams.find(t => t.id === teamId);
      if (!team) return;

      const updatedTeam = {
        ...team,
        categories: (team.categories || []).filter(id => id !== categoryId)
      };
      await updateTournament({
        ...selectedTournament,
        teams: selectedTournament.teams.map(t => 
          t.id === teamId ? updatedTeam : t
        )
      });
      toast({
        title: "Success",
        description: "Team removed from category successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove team from category",
        variant: "destructive",
      });
    }
  };

  if (!selectedTournament || !id) {
    return <div>Tournament not found</div>;
  }

  // Format dates for display
  const startDateStr = selectedTournament.startDate instanceof Date 
    ? selectedTournament.startDate.toLocaleDateString() 
    : new Date(selectedTournament.startDate).toLocaleDateString();
  
  const endDateStr = selectedTournament.endDate instanceof Date 
    ? selectedTournament.endDate.toLocaleDateString() 
    : new Date(selectedTournament.endDate).toLocaleDateString();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <TournamentHeader tournament={{
          name: selectedTournament.name,
          startDate: startDateStr,
          location: selectedTournament.location,
          status: selectedTournament.status,
          participants: { length: selectedTournament.teams.length }
        }} />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/tournaments")}>
            Back
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-start gap-6">
        <Card className="flex-1 p-4">
          <div className="space-y-2">
            <div>
              <span className="font-semibold">Format: </span>
              <span>{selectedTournament.format?.type || 'Not specified'}</span>
            </div>
            <div>
              <span className="font-semibold">Start Date: </span>
              <span>{startDateStr}</span>
            </div>
            <div>
              <span className="font-semibold">End Date: </span>
              <span>{endDateStr}</span>
            </div>
            <div>
              <span className="font-semibold">Location: </span>
              <span>{selectedTournament.location}</span>
            </div>
            <div>
              <span className="font-semibold">Teams: </span>
              <span>{selectedTournament.teams?.length || 0}</span>
            </div>
            <div>
              <span className="font-semibold">Matches: </span>
              <span>{selectedTournament.matches?.length || 0}</span>
            </div>
            <div>
              <span className="font-semibold">Courts: </span>
              <span>{selectedTournament.courts?.length || 0}</span>
            </div>
          </div>
        </Card>

        <div className="space-y-2">
          <Button onClick={() => setIsAddTeamDialogOpen(true)}>Add Team</Button>
          <Button onClick={() => setIsImportTeamsDialogOpen(true)}>Import Teams</Button>
          <Button onClick={() => setIsScheduleMatchesDialogOpen(true)}>Schedule Matches</Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bracket">Bracket</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="courts">Courts</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="team-management">Team Management</TabsTrigger>
          <TabsTrigger value="score-entry">Score Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab 
            tournament={selectedTournament} 
            onUpdateTournament={handleUpdateTournament}
            onGenerateMultiStageTournament={generateMultiStageTournament}
            onAdvanceToNextStage={advanceToNextStage}
            onScheduleDialogOpen={() => setIsScheduleMatchesDialogOpen(true)}
          />
        </TabsContent>
        <TabsContent value="bracket">
          <BracketTab tournament={selectedTournament} />
        </TabsContent>
        <TabsContent value="matches">
          <MatchesTab 
            matches={selectedTournament.matches}
            teams={selectedTournament.teams}
            courts={selectedTournament.courts}
            onMatchUpdate={handleMatchUpdate}
            onCourtAssign={handleCourtAssign}
            onStartMatch={handleStartMatch}
            onAddMatchClick={() => setIsScheduleMatchesDialogOpen(true)}
            onAutoScheduleClick={() => {/* TODO: Implement auto schedule */}}
          />
        </TabsContent>
        <TabsContent value="teams">
          <TeamsTab tournament={selectedTournament} />
        </TabsContent>
        <TabsContent value="courts">
          <CourtsTab 
            courts={selectedTournament.courts}
            onCourtUpdate={handleCourtUpdate}
            onAddCourtClick={handleAddCourt}
          />
        </TabsContent>
        <TabsContent value="categories">
          <CategoryManagementTab 
            tournament={selectedTournament}
            onAddTeamToCategory={handleAddTeamToCategory}
            onRemoveTeamFromCategory={handleRemoveTeamFromCategory}
          />
        </TabsContent>
        <TabsContent value="team-management">
          <TeamManagementTab tournament={selectedTournament} />
        </TabsContent>
        <TabsContent value="score-entry">
          <ScoreEntrySection 
            matches={selectedTournament.matches}
            onMatchUpdate={handleMatchUpdate}
          />
        </TabsContent>
      </Tabs>

      <AddTeamDialog
        open={isAddTeamDialogOpen}
        onOpenChange={setIsAddTeamDialogOpen}
        tournamentId={id}
      />

      <ImportTeamsDialog
        open={isImportTeamsDialogOpen}
        onOpenChange={setIsImportTeamsDialogOpen}
        onImportTeams={handleImportTeams}
        tournamentId={id}
      />

      <ScheduleMatchDialog
        open={isScheduleMatchesDialogOpen}
        onOpenChange={setIsScheduleMatchesDialogOpen}
        tournamentId={selectedTournament.id}
        onCreateMatch={handleCreateMatch}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tournament? This action cannot be undone.
              All associated data including teams, matches, and scores will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTournament}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Tournament
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TournamentDetail;
