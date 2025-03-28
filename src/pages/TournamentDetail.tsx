
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTournament } from "@/contexts/TournamentContext";
import Layout from "@/components/layout/Layout";
import TeamCreateDialog from "@/components/team/TeamCreateDialog";
import CourtCreateDialog from "@/components/court/CourtCreateDialog";
import MatchCreateDialog from "@/components/match/MatchCreateDialog";
import ScheduleMatchDialog from "@/components/tournament/ScheduleMatchDialog";
import { Team, Court, Match } from "@/types/tournament";
import TournamentHeader from "@/components/tournament/TournamentHeader";
import OverviewTab from "@/components/tournament/tabs/OverviewTab";
import TeamsTab from "@/components/tournament/tabs/TeamsTab";
import MatchesTab from "@/components/tournament/tabs/MatchesTab";
import CourtsTab from "@/components/tournament/tabs/CourtsTab";
import BracketTab from "@/components/tournament/tabs/BracketTab";

const TournamentDetail = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { 
    currentTournament, 
    setCurrentTournament, 
    updateTournament, 
    deleteTournament, 
    addTeam, 
    updateCourt, 
    updateMatch, 
    assignCourt, 
    scheduleMatch,
    autoAssignCourts, 
    advanceToNextStage,
    generateMultiStageTournament
  } = useTournament();
  
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [courtDialogOpen, setCourtDialogOpen] = useState(false);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  useEffect(() => {
    if (tournamentId && currentTournament?.id === tournamentId) {
      setCurrentTournament(currentTournament);
    }
  }, [tournamentId, currentTournament, setCurrentTournament]);

  const handleTeamCreate = (team: Omit<Team, "id">) => {
    addTeam({ ...team, id: Math.random().toString(36).substring(2, 9) });
    setTeamDialogOpen(false);
  };

  const handleCourtCreate = (court: Omit<Court, "id">) => {
    if (!currentTournament) return;

    const newCourt: Court = {
      ...court,
      id: Math.random().toString(36).substring(2, 9)
    };

    const updatedCourts = [...currentTournament.courts, newCourt];

    updateTournament({
      ...currentTournament,
      courts: updatedCourts,
      updatedAt: new Date()
    });
    setCourtDialogOpen(false);
  };

  const handleMatchCreate = (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string) => {
    scheduleMatch(team1Id, team2Id, scheduledTime, courtId);
    setMatchDialogOpen(false);
  };

  const handleAutoAssignCourts = () => {
    if (!currentTournament) return;
    autoAssignCourts();
  };

  if (!currentTournament) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <p>Tournament not found. Please select a tournament first.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <TeamCreateDialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen} onCreate={handleTeamCreate} />
      <CourtCreateDialog open={courtDialogOpen} onOpenChange={setCourtDialogOpen} onCreate={handleCourtCreate} />
      <MatchCreateDialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen} onCreate={handleMatchCreate} />
      <ScheduleMatchDialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen} tournamentId={currentTournament.id} />

      <div className="max-w-6xl mx-auto pb-12">
        <TournamentHeader 
          tournament={currentTournament}
          updateTournament={updateTournament}
          deleteTournament={deleteTournament}
        />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="courts">Courts</TabsTrigger>
            <TabsTrigger value="bracket">Bracket</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab 
              tournament={currentTournament}
              onUpdateTournament={updateTournament}
              onAutoAssignCourts={handleAutoAssignCourts}
              onGenerateMultiStageTournament={generateMultiStageTournament}
              onScheduleDialogOpen={() => setScheduleDialogOpen(true)}
              onAdvanceToNextStage={advanceToNextStage}
            />
          </TabsContent>

          <TabsContent value="teams">
            <TeamsTab 
              teams={currentTournament.teams}
              onTeamUpdate={addTeam}
              onAddTeamClick={() => setTeamDialogOpen(true)}
            />
          </TabsContent>

          <TabsContent value="matches">
            <MatchesTab 
              matches={currentTournament.matches}
              teams={currentTournament.teams}
              courts={currentTournament.courts}
              onMatchUpdate={updateMatch}
              onCourtAssign={assignCourt}
              onAddMatchClick={() => setMatchDialogOpen(true)}
              onAutoScheduleClick={() => setScheduleDialogOpen(true)}
            />
          </TabsContent>

          <TabsContent value="courts">
            <CourtsTab 
              courts={currentTournament.courts}
              onCourtUpdate={updateCourt}
              onAddCourtClick={() => setCourtDialogOpen(true)}
            />
          </TabsContent>

          <TabsContent value="bracket">
            <BracketTab tournament={currentTournament} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default TournamentDetail;
