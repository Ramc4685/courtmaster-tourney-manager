
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Button } from "@/components/ui/button";
import { Clipboard, Award } from "lucide-react";

const TournamentDetail = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
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
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (tournamentId && currentTournament?.id === tournamentId) {
      setCurrentTournament(currentTournament);
    }
  }, [tournamentId, currentTournament, setCurrentTournament]);

  // Track if we should show the bracket tab more prominently
  const shouldHighlightBracket = currentTournament?.currentStage === "PLAYOFF_KNOCKOUT";
  
  // Auto-switch to bracket tab when tournament advances to playoff stage
  useEffect(() => {
    if (shouldHighlightBracket) {
      setActiveTab("bracket");
    }
  }, [shouldHighlightBracket]);

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
  
  const handleGoToScoring = () => {
    if (tournamentId) {
      navigate(`/scoring/${tournamentId}`);
    }
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
        <div className="flex justify-between items-start mb-6">
          <TournamentHeader 
            tournament={currentTournament}
            updateTournament={updateTournament}
            deleteTournament={deleteTournament}
          />
          
          <div className="flex gap-2">
            <Button onClick={handleGoToScoring} className="bg-court-green hover:bg-court-green/90">
              <Clipboard className="mr-2 h-4 w-4" />
              Scoring Interface
            </Button>
            
            {shouldHighlightBracket && (
              <Button onClick={() => setActiveTab("bracket")} variant="outline">
                <Award className="mr-2 h-4 w-4" />
                View Brackets
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="courts">Courts</TabsTrigger>
            <TabsTrigger value="bracket" className={shouldHighlightBracket ? "bg-amber-100 text-amber-900" : ""}>
              Bracket
              {shouldHighlightBracket && " 🏆"}
            </TabsTrigger>
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
