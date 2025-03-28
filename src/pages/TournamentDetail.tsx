
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
import { useToast } from "@/hooks/use-toast";

const TournamentDetail = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    tournaments,
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
    // Find the tournament by ID from all tournaments if not already set
    if (tournamentId && (!currentTournament || currentTournament.id !== tournamentId)) {
      console.log("Looking for tournament with ID:", tournamentId);
      console.log("Available tournaments:", tournaments);
      const foundTournament = tournaments.find(t => t.id === tournamentId);
      if (foundTournament) {
        console.log(`Found tournament with ID ${tournamentId}`, foundTournament);
        setCurrentTournament(foundTournament);
      } else {
        console.error(`Tournament with ID ${tournamentId} not found`);
        toast({
          title: "Tournament Not Found",
          description: "The requested tournament could not be found.",
          variant: "destructive",
        });
        // Redirect to tournaments list if no tournament is found
        navigate("/tournaments");
      }
    }
  }, [tournamentId, tournaments, currentTournament, setCurrentTournament, toast, navigate]);

  // Track if we should show the bracket tab more prominently
  const shouldHighlightBracket = currentTournament?.currentStage === "PLAYOFF_KNOCKOUT";
  
  // Auto-switch to bracket tab when tournament advances to playoff stage
  useEffect(() => {
    if (shouldHighlightBracket) {
      setActiveTab("bracket");
    }
  }, [shouldHighlightBracket]);

  const handleTeamCreate = (team: Omit<Team, "id">) => {
    addTeam({ ...team, id: `team-${Date.now()}` });
    setTeamDialogOpen(false);
  };

  const handleCourtCreate = (court: Omit<Court, "id">) => {
    if (!currentTournament) return;

    const newCourt: Court = {
      ...court,
      id: `court-${Date.now()}`
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
        <div className="max-w-6xl mx-auto text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Tournament not found</h2>
          <p className="mb-6">The tournament you're looking for doesn't exist or you need to select a tournament first.</p>
          <Button onClick={() => navigate("/tournaments")}>
            Go to Tournaments
          </Button>
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
