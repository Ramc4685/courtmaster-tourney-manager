
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout/Layout";
import { useTournament } from "@/contexts/tournament/useTournament";
import TournamentHeader from "@/components/tournament/TournamentHeader";
import OverviewTab from "@/components/tournament/tabs/OverviewTab";
import TeamsTab from "@/components/tournament/tabs/TeamsTab";
import BracketTab from "@/components/tournament/tabs/BracketTab";
import CourtsTab from "@/components/tournament/tabs/CourtsTab";
import TeamCreateDialog from "@/components/team/TeamCreateDialog";
import ImportTeamsDialog from "@/components/tournament/ImportTeamsDialog";
import CourtCreateDialog from "@/components/court/CourtCreateDialog";
import MatchCreateDialog from "@/components/match/MatchCreateDialog";
import UnifiedScheduleDialog from "@/components/tournament/UnifiedScheduleDialog";
import { Court, Match, Team } from "@/types/tournament";
import { renderMatchesTab } from "@/utils/tournamentComponentHelper";
import { useAuth } from "@/contexts/auth/AuthContext";
import ScoreEntrySection from "@/components/tournament/score-entry/ScoreEntrySection";
import CategoryTabs from "@/components/tournament/tabs/CategoryTabs";
import { schedulingService } from "@/services/tournament/SchedulingService";
import { toast } from "@/components/ui/use-toast";

const TournamentDetail = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    tournaments,
    currentTournament,
    setCurrentTournament,
    updateTournament,
    addTeam,
    importTeams,
    updateMatch,
    assignCourt,
    scheduleMatch,
    autoAssignCourts,
    generateMultiStageTournament,
    advanceToNextStage,
    updateMatchStatus
  } = useTournament();

  const [activeTab, setActiveTab] = useState("overview");
  const [addTeamDialogOpen, setAddTeamDialogOpen] = useState(false);
  const [importTeamsDialogOpen, setImportTeamsDialogOpen] = useState(false);
  const [addCourtDialogOpen, setAddCourtDialogOpen] = useState(false);
  const [addMatchDialogOpen, setAddMatchDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  useEffect(() => {
    // Set the current tournament based on the URL parameter if it's not already set
    if (tournamentId && (!currentTournament || currentTournament.id !== tournamentId)) {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (tournament) {
        setCurrentTournament(tournament);
      } else {
        // If tournament is not found, navigate to tournaments page
        navigate("/tournaments");
      }
    }
  }, [tournamentId, currentTournament, tournaments, setCurrentTournament, navigate]);

  if (!currentTournament) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <p>Loading tournament...</p>
        </div>
      </Layout>
    );
  }

  const handleAddTeam = (newTeam: Omit<Team, "id">) => {
    const team = { ...newTeam, id: crypto.randomUUID() } as Team;
    addTeam(team);
    setAddTeamDialogOpen(false);
  };

  const handleImportTeams = (newTeams: Omit<Team, "id">[]) => {
    const teams = newTeams.map(team => ({ ...team, id: crypto.randomUUID() } as Team));
    importTeams(teams);
    setImportTeamsDialogOpen(false);
  };

  const handleAddCourt = (newCourt: Omit<Court, "id" | "status">) => {
    const court = { 
      ...newCourt, 
      id: crypto.randomUUID(),
      status: "AVAILABLE" 
    } as Court;
    
    const updatedTournament = {
      ...currentTournament,
      courts: [...currentTournament.courts, court]
    };
    updateTournament(updatedTournament);
    setAddCourtDialogOpen(false);
  };

  // Updated to include categoryId
  const handleCreateMatch = (
    team1Id: string, 
    team2Id: string, 
    time: Date, 
    courtId?: string,
    categoryId?: string
  ) => {
    // Find the category if categoryId is provided
    const category = categoryId 
      ? currentTournament.categories.find(c => c.id === categoryId)
      : undefined;
    
    // If a category is found or we're not using categories yet, schedule the match
    scheduleMatch(team1Id, team2Id, time, courtId, categoryId);
    setAddMatchDialogOpen(false);
  };

  const handleAutoSchedule = async () => {
    try {
      // Open the scheduling dialog instead of directly auto-assigning
      setScheduleDialogOpen(true);
    } catch (error) {
      console.error("Error opening auto-schedule dialog:", error);
    }
  };

  const handleTeamUpdate = (team: Team) => {
    const updatedTeams = currentTournament.teams.map(t => 
      t.id === team.id ? team : t
    );
    
    const updatedTournament = {
      ...currentTournament,
      teams: updatedTeams
    };
    
    updateTournament(updatedTournament);
  };

  const handleCourtUpdate = (court: Court) => {
    const updatedCourts = currentTournament.courts.map(c => 
      c.id === court.id ? court : c
    );
    
    const updatedTournament = {
      ...currentTournament,
      courts: updatedCourts
    };
    
    updateTournament(updatedTournament);
  };

  // Handle starting a match (even without a court if forceStart is true)
  const handleStartMatch = async (matchId: string, forceStart?: boolean) => {
    try {
      if (!currentTournament) return;
      
      // Use the scheduling service to start the match
      const result = await schedulingService.startMatch(currentTournament, matchId, forceStart);
      
      if (result.started) {
        // Update the tournament with the started match
        updateTournament(result.tournament);
        
        toast({
          title: "Match started",
          description: forceStart ? "Match started without a court assignment" : "Match started successfully",
          variant: forceStart ? "warning" : "default"
        });
      } else {
        toast({
          title: "Could not start match",
          description: "No courts are available. Add a court or force start the match.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error starting match:", error);
      toast({
        title: "Error starting match",
        description: "An error occurred while starting the match",
        variant: "destructive"
      });
    }
  };

  const isUserAdmin = user ? user.role === 'admin' : false;
  const hasCategoriesEnabled = currentTournament.categories && currentTournament.categories.length > 0;

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-8">
        <TournamentHeader
          tournament={currentTournament}
          updateTournament={updateTournament}
          deleteTournament={() => {}} // This will be implemented later
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="courts">Courts</TabsTrigger>
            <TabsTrigger value="bracket">Bracket</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="py-4">
            <OverviewTab
              tournament={currentTournament}
              onUpdateTournament={updateTournament}
              onScheduleDialogOpen={() => setScheduleDialogOpen(true)}
              onGenerateMultiStageTournament={generateMultiStageTournament}
              onAdvanceToNextStage={advanceToNextStage}
            />
          </TabsContent>

          <TabsContent value="teams" className="py-4">
            {hasCategoriesEnabled ? (
              <CategoryTabs 
                tournament={currentTournament}
                activeTab={activeTab}
              />
            ) : (
              <TeamsTab
                teams={currentTournament.teams}
                onTeamUpdate={handleTeamUpdate}
                onAddTeamClick={() => setAddTeamDialogOpen(true)}
              />
            )}
          </TabsContent>

          <TabsContent value="matches" className="py-4">
            {hasCategoriesEnabled ? (
              <CategoryTabs 
                tournament={currentTournament}
                activeTab={activeTab}
              />
            ) : (
              <>
                <ScoreEntrySection 
                  matches={currentTournament.matches} 
                  onMatchUpdate={updateMatch} 
                />
                
                {/* Use the updated renderMatchesTab with the onStartMatch prop */}
                <div>
                  {React.createElement(
                    // @ts-ignore - We're using renderMatchesTab helper which might have missed types
                    renderMatchesTab(
                      currentTournament.matches,
                      currentTournament.teams,
                      currentTournament.courts,
                      updateMatch,
                      assignCourt,
                      handleStartMatch,
                      () => setAddMatchDialogOpen(true),
                      handleAutoSchedule
                    )
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="courts" className="py-4">
            <CourtsTab
              courts={currentTournament.courts}
              onCourtUpdate={handleCourtUpdate}
              onAddCourtClick={() => setAddCourtDialogOpen(true)}
            />
          </TabsContent>

          <TabsContent value="bracket" className="py-4">
            {hasCategoriesEnabled ? (
              <CategoryTabs 
                tournament={currentTournament}
                activeTab={activeTab}
              />
            ) : (
              <BracketTab
                tournament={currentTournament}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <TeamCreateDialog
        open={addTeamDialogOpen}
        onOpenChange={setAddTeamDialogOpen}
        onCreate={handleAddTeam}
      />

      <ImportTeamsDialog
        open={importTeamsDialogOpen}
        onOpenChange={setImportTeamsDialogOpen}
        onImportTeams={handleImportTeams}
        tournamentId={currentTournament.id}
      />

      <CourtCreateDialog
        open={addCourtDialogOpen}
        onOpenChange={setAddCourtDialogOpen}
        onCreate={handleAddCourt}
      />

      <MatchCreateDialog
        open={addMatchDialogOpen}
        onOpenChange={setAddMatchDialogOpen}
        onCreateMatch={handleCreateMatch}
      />

      <UnifiedScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
      />
    </Layout>
  );
};

export default TournamentDetail;
