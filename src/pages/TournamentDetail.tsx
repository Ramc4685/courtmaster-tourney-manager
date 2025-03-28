
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
import { Court, Match, Team } from "@/types/tournament";
import { renderMatchesTab } from "@/utils/tournamentComponentHelper";
import { useAuth } from "@/contexts/auth/AuthContext";

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
    autoAssignCourts
  } = useTournament();

  const [activeTab, setActiveTab] = useState("overview");
  const [addTeamDialogOpen, setAddTeamDialogOpen] = useState(false);
  const [importTeamsDialogOpen, setImportTeamsDialogOpen] = useState(false);
  const [addCourtDialogOpen, setAddCourtDialogOpen] = useState(false);
  const [addMatchDialogOpen, setAddMatchDialogOpen] = useState(false);

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

  const handleAddTeam = (team: Team) => {
    addTeam(team);
    setAddTeamDialogOpen(false);
  };

  const handleImportTeams = (teams: Team[]) => {
    importTeams(teams);
    setImportTeamsDialogOpen(false);
  };

  const handleAddCourt = (court: Court) => {
    const updatedTournament = {
      ...currentTournament,
      courts: [...currentTournament.courts, court]
    };
    updateTournament(updatedTournament);
    setAddCourtDialogOpen(false);
  };

  const handleCreateMatch = (team1Id: string, team2Id: string, time: Date, courtId?: string) => {
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

  const isUserAdmin = user ? user.role === 'admin' : false;

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-8">
        <TournamentHeader
          tournament={currentTournament}
          onAddTeamClick={() => setAddTeamDialogOpen(true)}
          onImportTeamsClick={() => setImportTeamsDialogOpen(true)}
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
            />
          </TabsContent>

          <TabsContent value="teams" className="py-4">
            <TeamsTab
              teams={currentTournament.teams}
              onAddTeamClick={() => setAddTeamDialogOpen(true)}
              onImportTeamsClick={() => setImportTeamsDialogOpen(true)}
              isAdmin={isUserAdmin}
            />
          </TabsContent>

          <TabsContent value="matches" className="py-4">
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
              onAddCourtClick={() => setAddCourtDialogOpen(true)}
              isAdmin={isUserAdmin}
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
        onSubmit={handleAddTeam}
      />

      <ImportTeamsDialog
        open={importTeamsDialogOpen}
        onOpenChange={setImportTeamsDialogOpen}
        onImport={handleImportTeams}
      />

      <CourtCreateDialog
        open={addCourtDialogOpen}
        onOpenChange={setAddCourtDialogOpen}
        onSubmit={handleAddCourt}
      />

      <MatchCreateDialog
        open={addMatchDialogOpen}
        onOpenChange={setAddMatchDialogOpen}
        teams={currentTournament.teams}
        courts={currentTournament.courts}
        onSubmit={handleCreateMatch}
      />
    </Layout>
  );
};

export default TournamentDetail;
