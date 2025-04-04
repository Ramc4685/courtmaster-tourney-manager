
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournament } from '@/contexts/tournament/useTournament';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TournamentHeader from "@/components/tournament/TournamentHeader";
import OverviewTab from "@/components/tournament/tabs/OverviewTab";
import TeamsTab from "@/components/tournament/tabs/TeamsTab";
import MatchesTab from "@/components/tournament/tabs/MatchesTab";
import CourtsTab from "@/components/tournament/tabs/CourtsTab";
import BracketTab from "@/components/tournament/tabs/BracketTab";
import CategoryTabs from "@/components/tournament/tabs/CategoryTabs";
import PageHeader from '@/components/shared/PageHeader';
import { toast } from '@/components/ui/use-toast';
import { renderMatchesTab } from '@/utils/tournamentComponentHelper';

const TournamentDetails = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { tournaments, setCurrentTournament, currentTournament, updateTournament, generateMultiStageTournament, advanceToNextStage } = useTournament();
  const [activeTab, setActiveTab] = useState("overview");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  
  useEffect(() => {
    if (tournamentId) {
      // Find the tournament in our list of tournaments
      const tournament = tournaments.find(t => t.id === tournamentId);
      
      if (tournament) {
        // Set as the current tournament
        setCurrentTournament(tournament);
      } else {
        // Tournament not found, redirect to tournaments list
        console.error(`Tournament with ID ${tournamentId} not found`);
        navigate('/tournaments');
      }
    }
  }, [tournamentId, tournaments, setCurrentTournament, navigate]);
  
  // Handler functions
  const handleGenerateMultiStageTournament = async () => {
    try {
      await generateMultiStageTournament();
      toast({
        title: "Tournament brackets generated",
        description: "Tournament brackets have been successfully generated.",
      });
    } catch (error) {
      console.error("Error generating tournament brackets:", error);
      toast({
        title: "Error",
        description: "Failed to generate tournament brackets.",
        variant: "destructive"
      });
    }
  };
  
  const handleAdvanceToNextStage = async () => {
    try {
      await advanceToNextStage();
      toast({
        title: "Tournament advanced",
        description: "Tournament has been advanced to the next stage.",
      });
    } catch (error) {
      console.error("Error advancing tournament stage:", error);
      toast({
        title: "Error",
        description: "Failed to advance tournament to the next stage.",
        variant: "destructive"
      });
    }
  };
  
  const handleScheduleDialogOpen = () => {
    setScheduleDialogOpen(true);
  };
  
  if (!currentTournament) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader 
          title="Loading Tournament" 
          description="Please wait while we load the tournament details..."
        />
      </div>
    );
  }

  const hasCategoriesEnabled = currentTournament.categories && currentTournament.categories.length > 0;
  
  return (
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
            onGenerateMultiStageTournament={handleGenerateMultiStageTournament}
            onAdvanceToNextStage={handleAdvanceToNextStage}
            onScheduleDialogOpen={handleScheduleDialogOpen}
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
              teams={currentTournament.teams || []}
              onTeamUpdate={() => {}}
              onAddTeamClick={() => {}}
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
            renderMatchesTab(
              currentTournament.matches || [],
              currentTournament.teams || [],
              currentTournament.courts || [],
              () => {}, // onMatchUpdate
              () => {}, // onCourtAssign
              () => {}, // onStartMatch 
              () => {}, // onAddMatchClick
              () => {}  // onAutoScheduleClick
            )
          )}
        </TabsContent>

        <TabsContent value="courts" className="py-4">
          <CourtsTab
            courts={currentTournament.courts || []}
            onCourtUpdate={() => {}}
            onAddCourtClick={() => {}}
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
      
      {/* Schedule Dialog would be implemented here when needed */}
      {scheduleDialogOpen && (
        <div>
          {/* Placeholder for schedule dialog */}
        </div>
      )}
    </div>
  );
};

export default TournamentDetails;
