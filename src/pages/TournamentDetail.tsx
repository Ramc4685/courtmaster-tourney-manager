import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout/Layout";
import { useTournament } from "@/contexts/TournamentContext";
import TournamentHeader from "@/components/tournament/TournamentHeader";
import OverviewTab from "@/components/tournament/tabs/OverviewTab";
import TeamsTab from "@/components/tournament/tabs/TeamsTab";
import BracketTab from "@/components/tournament/tabs/BracketTab";
import CourtsTab from "@/components/tournament/tabs/CourtsTab";
import TeamCreateDialog from "@/components/team/TeamCreateDialog";
import ImportTeamsDialog from "@/components/tournament/ImportTeamsDialog";
import CourtCreateDialog from "@/components/court/CourtCreateDialog";
import MatchCreateDialog from "@/components/match/MatchCreateDialog";
import { Court, Match, Team, TournamentCategory } from "@/types/tournament";
import { renderMatchesTab } from "@/utils/tournamentComponentHelper";
import { useAuth } from "@/contexts/auth/AuthContext";
import ScoreEntrySection from "@/components/tournament/score-entry/ScoreEntrySection";

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
    advanceToNextStage
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
    scheduleMatch(team1Id, team2Id, time, courtId);
    setAddMatchDialogOpen(false);
  };

  const handleAutoSchedule = async () => {
    try {
      const assignedCount = await autoAssignCourts();
      console.log(`Assigned ${assignedCount} courts automatically`);
    } catch (error) {
      console.error("Error auto-scheduling matches:", error);
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

  const isUserAdmin = user ? user.role === 'admin' : false;

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
              onAutoAssignCourts={handleAutoSchedule}
              onGenerateMultiStageTournament={generateMultiStageTournament}
              onScheduleDialogOpen={() => setScheduleDialogOpen(true)}
              onAdvanceToNextStage={advanceToNextStage}
            />
          </TabsContent>

          <TabsContent value="teams" className="py-4">
            <TeamsTab
              teams={currentTournament.teams}
              onTeamUpdate={handleTeamUpdate}
              onAddTeamClick={() => setAddTeamDialogOpen(true)}
            />
          </TabsContent>

          <TabsContent value="matches" className="py-4">
            {/* Add the Score Entry Section before the matches table */}
            <ScoreEntrySection 
              matches={currentTournament.matches} 
              onMatchUpdate={updateMatch} 
            />
            
            {/* Render the matches tab */}
            {renderMatchesTab(
              currentTournament.matches,
              currentTournament.teams,
              currentTournament.courts,
              updateMatch,
              assignCourt,
              () => setAddMatchDialogOpen(true),
              handleAutoSchedule
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
            <BracketTab
              tournament={currentTournament}
            />
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
    </Layout>
  );
};

export default TournamentDetail;
