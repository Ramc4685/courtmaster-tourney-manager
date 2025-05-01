import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTournament } from "@/contexts/tournament/TournamentContext"; // Corrected import path
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
import { RefreshCw, Loader2 } from "lucide-react"; // Added Loader2
import { tournamentService } from "@/services/tournament/TournamentService"; // Import tournamentService

export const TournamentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    currentTournament, // Use currentTournament from context
    setCurrentTournament, // Use setCurrentTournament from context
    updateTournament, 
    deleteTournament, 
    addTeam, 
    importTeams,
    generateMultiStageTournament,
    advanceToNextStage,
    updateMatch,
    updateMatchStatus,
    assignCourt,
    // refreshTournament, // refreshTournament might not be defined, handle manually if needed
  } = useTournament();
  
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddTeamDialogOpen, setIsAddTeamDialogOpen] = useState(false);
  const [isImportTeamsDialogOpen, setIsImportTeamsDialogOpen] = useState(false);
  const [isScheduleMatchesDialogOpen, setIsScheduleMatchesDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAndSetTournament = useCallback(async (tournamentId: string) => {
    console.log(`[TournamentDetail] Fetching tournament with ID: ${tournamentId}`);
    setIsLoading(true);
    setError(null);
    try {
      const fetchedTournament = await tournamentService.getTournament(tournamentId);
      if (fetchedTournament) {
        console.log("[TournamentDetail] Tournament fetched successfully, setting current tournament.");
        await setCurrentTournament(fetchedTournament);
      } else {
        console.error(`[TournamentDetail] Tournament with ID ${tournamentId} not found via service.`);
        setError("Tournament not found.");
        // Optionally navigate back or show a more prominent error
        // navigate("/tournaments"); 
      }
    } catch (err) {
      console.error(`[TournamentDetail] Error fetching tournament ${tournamentId}:`, err);
      setError("Failed to load tournament details.");
      // Handle specific errors like 404 if needed
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentTournament]); // Dependency on setCurrentTournament

  useEffect(() => {
    if (!id) {
      console.log("[TournamentDetail] No ID in params, navigating to /tournaments");
      navigate("/tournaments");
      return;
    }

    // Check if the current tournament in context matches the ID in the URL
    if (!currentTournament || currentTournament.id !== id) {
      console.log(`[TournamentDetail] Context tournament (${currentTournament?.id}) doesn't match URL ID (${id}). Fetching...`);
      fetchAndSetTournament(id);
    } else {
      console.log(`[TournamentDetail] Context tournament (${currentTournament?.id}) matches URL ID (${id}). No fetch needed.`);
      setIsLoading(false); // Already have the correct tournament
      setError(null);
    }
    // No dependency on currentTournament here to avoid re-fetching if context updates for other reasons
    // fetchAndSetTournament handles its own loading state
  }, [id, navigate, fetchAndSetTournament]); // Add fetchAndSetTournament to dependencies

  const handleUpdateTournament = async (data: Partial<Tournament>) => { // Allow partial updates
    if (!currentTournament) return;
    try {
      // Merge partial data with current tournament data
      const updatedData = { ...currentTournament, ...data };
      await updateTournament(updatedData);
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
    if (!currentTournament?.id) return;
    try {
      await deleteTournament(currentTournament.id);
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
    // Assuming addTeam in context handles adding to the current tournament
    addTeam(team);
    toast({
      title: "Success",
      description: "Team added successfully",
    });
  };

  const handleImportTeams = (teams: Team[]) => {
    // Assuming importTeams in context handles adding to the current tournament
    importTeams(teams);
    toast({
      title: "Success",
      description: `Successfully imported ${teams.length} teams`,
    });
  };

  const handleCreateMatch = async (matchData: any) => {
    // TODO: Implement match creation via context or service
    console.log('Creating match:', matchData);
  };

  const handleMatchUpdate = (match: Match) => {
    // Assuming updateMatch in context handles updating within the current tournament
    // updateMatch(match); // updateMatch might not be defined in context, check types.ts
    console.log("Match update requested:", match); // Placeholder
    // If updateMatch is needed, ensure it's added to context and service
  };

  const handleCourtAssign = (matchId: string, courtId: string) => {
    assignCourt(matchId, courtId);
  };

  const handleStartMatch = (matchId: string) => {
    updateMatchStatus(matchId, "IN_PROGRESS");
  };

  const handleCourtUpdate = (court: Court) => {
    // TODO: Implement court update via context or service
    console.log('Updating court:', court);
  };

  const handleAddCourt = () => {
    // TODO: Implement add court via context or service
    console.log('Adding new court');
  };

  const handleRefresh = async () => {
    if (!id || !user) return;
    setIsRefreshing(true);
    await fetchAndSetTournament(id); // Re-fetch the tournament data
    setIsRefreshing(false);
    if (!error) { // Only show success if fetch didn't set an error
      toast({
        title: "Success",
        description: "Tournament data refreshed",
      });
    }
  };

  const handleAddTeamToCategory = async (categoryId: string, team: Team) => {
    if (!currentTournament) return;
    try {
      // This logic seems complex for a component, consider moving to context/service
      const updatedTeam = {
        ...team,
        // Assuming categories are stored differently now, adjust as needed
        // categories: [...(team.categories || []), categoryId]
      };
      await updateTournament({
        ...currentTournament,
        teams: currentTournament.teams.map(t => 
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
    if (!currentTournament) return;
    try {
      const team = currentTournament.teams.find(t => t.id === teamId);
      if (!team) return;

      // This logic seems complex for a component, consider moving to context/service
      const updatedTeam = {
        ...team,
        // Assuming categories are stored differently now, adjust as needed
        // categories: (team.categories || []).filter(id => id !== categoryId)
      };
      await updateTournament({
        ...currentTournament,
        teams: currentTournament.teams.map(t => 
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading tournament details...</span>
      </div>
    );
  }

  // Error state
  if (error || !currentTournament) {
    return (
      <div className="container mx-auto py-6 text-center">
        <Typography variant="h5" color="error">{error || "Tournament not found."}</Typography>
        <Button variant="outline" onClick={() => navigate("/tournaments")} className="mt-4">
          Back to Tournaments
        </Button>
      </div>
    );
  }

  // Format dates for display (ensure currentTournament is not null here)
  const startDateStr = currentTournament.startDate 
    ? new Date(currentTournament.startDate).toLocaleDateString() 
    : 'N/A';
  
  const endDateStr = currentTournament.endDate 
    ? new Date(currentTournament.endDate).toLocaleDateString() 
    : 'N/A';

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        {/* Simplified Header props based on available data */}
        <TournamentHeader tournament={{
          name: currentTournament.name,
          startDate: startDateStr,
          location: currentTournament.location || 'N/A',
          status: currentTournament.status,
          // participants: { length: currentTournament.teams?.length || 0 } // Assuming teams are loaded
        }} />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/tournaments")}>
            Back
          </Button>
          {/* Add refresh button */}  
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          {/* TODO: Add organizer check for delete button */}  
          <Button 
            variant="destructive" 
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Rest of the component remains largely the same, using currentTournament */}
      {/* Ensure all references to selectedTournament are replaced with currentTournament */}
      {/* Example: */}
      <div className="flex justify-between items-start gap-6">
        <Card className="flex-1 p-4">
          <div className="space-y-2">
            <div>
              <span className="font-semibold">Format: </span>
              <span>{currentTournament.format || 'Not specified'}</span>
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
              <span>{currentTournament.location || 'N/A'}</span>
            </div>
            <div>
              <span className="font-semibold">Teams: </span>
              <span>{currentTournament.teams?.length || 0}</span>
            </div>
            <div>
              <span className="font-semibold">Matches: </span>
              <span>{currentTournament.matches?.length || 0}</span>
            </div>
            <div>
              <span className="font-semibold">Courts: </span>
              <span>{currentTournament.courts?.length || 0}</span>
            </div>
          </div>
        </Card>

        {/* TODO: Add organizer check for these buttons */}  
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
            tournament={currentTournament} 
            onUpdateTournament={handleUpdateTournament}
            // Pass required functions if available in context
            // onGenerateMultiStageTournament={generateMultiStageTournament} 
            // onAdvanceToNextStage={advanceToNextStage}
            onScheduleDialogOpen={() => setIsScheduleMatchesDialogOpen(true)}
          />
        </TabsContent>
        <TabsContent value="bracket">
          <BracketTab tournament={currentTournament} />
        </TabsContent>
        <TabsContent value="matches">
          <MatchesTab 
            matches={currentTournament.matches || []}
            teams={currentTournament.teams || []}
            courts={currentTournament.courts || []}
            onMatchUpdate={handleMatchUpdate} // Ensure this function exists or is handled
            onCourtAssign={handleCourtAssign}
            onStartMatch={handleStartMatch}
            onAddMatchClick={() => setIsScheduleMatchesDialogOpen(true)}
            onAutoScheduleClick={() => {/* TODO: Implement auto schedule */}}
          />
        </TabsContent>
        <TabsContent value="teams">
          <TeamsTab tournament={currentTournament} />
        </TabsContent>
        <TabsContent value="courts">
          <CourtsTab 
            courts={currentTournament.courts || []}
            onCourtUpdate={handleCourtUpdate}
            onAddCourtClick={handleAddCourt}
          />
        </TabsContent>
        <TabsContent value="categories">
          <CategoryManagementTab 
            tournament={currentTournament}
            onAddTeamToCategory={handleAddTeamToCategory}
            onRemoveTeamFromCategory={handleRemoveTeamFromCategory}
          />
        </TabsContent>
        <TabsContent value="team-management">
          <TeamManagementTab tournament={currentTournament} />
        </TabsContent>
        <TabsContent value="score-entry">
          <ScoreEntrySection 
            matches={currentTournament.matches || []}
            onMatchUpdate={handleMatchUpdate} // Ensure this function exists or is handled
          />
        </TabsContent>
      </Tabs>

      <AddTeamDialog
        open={isAddTeamDialogOpen}
        onOpenChange={setIsAddTeamDialogOpen}
        tournamentId={id!} // Use non-null assertion as we check for id earlier
      />

      <ImportTeamsDialog
        open={isImportTeamsDialogOpen}
        onOpenChange={setIsImportTeamsDialogOpen}
        onImportTeams={handleImportTeams}
        tournamentId={id!} // Use non-null assertion
      />

      <ScheduleMatchDialog
        open={isScheduleMatchesDialogOpen}
        onOpenChange={setIsScheduleMatchesDialogOpen}
        tournamentId={currentTournament.id}
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

