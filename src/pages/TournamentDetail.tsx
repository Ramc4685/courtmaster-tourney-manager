
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Tournament, 
  Team, 
  Court, 
  Match, 
  TournamentCategory,
  TournamentFormat
} from "@/types/tournament";
import { Separator } from "@/components/ui/separator";
import { Loader2, Settings, CalendarDays, Users, TrophyIcon, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTournament } from "@/contexts/tournament/useTournament";
import { useToast } from "@/components/ui/use-toast";
import TournamentHeader from "@/components/tournament/TournamentHeader";
import TabContentWrapper from "@/components/ui/tab-content-wrapper";
import AddTeamDialog from "@/components/tournament/AddTeamDialog";
import ImportTeamsDialog from "@/components/tournament/ImportTeamsDialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import OverviewTab from "@/components/tournament/tabs/OverviewTab";
import CategoryTabs from "@/components/tournament/tabs/CategoryTabs";
import TeamManagementTab from "@/components/tournament/tabs/TeamManagementTab";
import ScheduleMatches from "@/components/tournament/actions/ScheduleMatches";
import UnifiedScheduleDialog from "@/components/tournament/UnifiedScheduleDialog";
import ScheduleMatchDialog from "@/components/tournament/ScheduleMatchDialog";
import ScoreEntrySection from "@/components/tournament/score-entry/ScoreEntrySection";

const TournamentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State for UI
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddTeamDialogOpen, setIsAddTeamDialogOpen] = useState(false);
  const [isImportTeamsDialogOpen, setIsImportTeamsDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isScheduleMatchDialogOpen, setIsScheduleMatchDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get tournament context
  const { 
    tournaments,
    currentTournament,
    setCurrentTournament,
    isLoading: isTournamentLoading,
    addTeam,
    importTeams,
    updateMatch,
    assignCourt,
    scheduleMatch,
    autoAssignCourts,
    generateMultiStageTournament,
    advanceToNextStage,
    updateMatchStatus,
    updateTournament
  } = useTournament();

  // Load the tournament when component mounts
  useEffect(() => {
    if (!id) return;

    const fetchTournament = async () => {
      setIsLoading(true);
      
      // Find tournament in context
      const tournament = tournaments.find(t => t.id === id);
      
      if (tournament) {
        setCurrentTournament(tournament);
        setIsLoading(false);
      } else {
        toast({
          variant: "destructive",
          title: "Tournament not found",
          description: "The requested tournament could not be found."
        });
        navigate('/tournaments');
      }
    };

    fetchTournament();
  }, [id, tournaments, setCurrentTournament, toast, navigate]);

  // Update page title
  useEffect(() => {
    if (currentTournament) {
      document.title = `${currentTournament.name} - Tournament Manager`;
    } else {
      document.title = "Tournament Details - Tournament Manager";
    }
  }, [currentTournament]);

  // Handle tournament loading state
  if (isLoading || isTournamentLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading tournament data...</p>
      </div>
    );
  }

  // Handle 404
  if (!currentTournament) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-3xl font-bold">Tournament Not Found</div>
        <p className="mt-2 text-muted-foreground">
          The tournament you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button className="mt-4" onClick={() => navigate('/tournaments')}>
          Back to Tournaments
        </Button>
      </div>
    );
  }

  // Handle add team
  const handleAddTeam = (team: Team) => {
    addTeam(team);
    setIsAddTeamDialogOpen(false);
    toast({
      title: "Team added",
      description: `${team.name} has been added to the tournament.`,
    });
  };

  // Handle import teams
  const handleImportTeams = (teams: Team[]) => {
    importTeams(teams);
    setIsImportTeamsDialogOpen(false);
    
    toast({
      title: "Teams imported",
      description: `${teams.length} teams have been imported into the tournament.`,
    });
  };

  // Handle update tournament
  const handleUpdateTournament = (updatedTournament: Tournament) => {
    updateTournament(updatedTournament);
    
    toast({
      title: "Tournament updated",
      description: "Tournament details have been updated successfully.",
    });
  };

  // Schedule a match
  const handleScheduleMatch = (
    team1Id: string, 
    team2Id: string, 
    scheduledTime: Date, 
    courtId?: string,
    categoryId?: string
  ) => {
    scheduleMatch(team1Id, team2Id, scheduledTime, courtId, categoryId);
    setIsScheduleMatchDialogOpen(false);
    
    toast({
      title: "Match scheduled",
      description: `Match has been scheduled for ${format(scheduledTime, "PPp")}.`,
    });
  };

  return (
    <div className="container mx-auto p-4">
      {/* Tournament Header */}
      <TournamentHeader 
        tournament={currentTournament} 
        onUpdateTournament={handleUpdateTournament}
      />
      
      <Separator className="my-6" />
      
      {/* Main Tournament Content */}
      <Tabs 
        defaultValue="overview" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrophyIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Categories</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Teams</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <TabContentWrapper>
            <OverviewTab 
              tournament={currentTournament}
              onUpdateTournament={handleUpdateTournament}
              onGenerateMultiStageTournament={generateMultiStageTournament}
              onAdvanceToNextStage={advanceToNextStage}
              onScheduleDialogOpen={() => setIsScheduleDialogOpen(true)}
            />
          </TabContentWrapper>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <TabContentWrapper>
            <CategoryTabs 
              tournament={currentTournament}
              updateMatch={updateMatch}
              assignCourt={assignCourt}
              loadCategoryDemoData={() => {}} // Placeholder for now
            />
          </TabContentWrapper>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-4">
          <TabContentWrapper>
            <TeamManagementTab tournament={currentTournament} />
            
            <AddTeamDialog
              open={isAddTeamDialogOpen}
              onOpenChange={setIsAddTeamDialogOpen}
              onAddTeam={handleAddTeam}
            />
            
            <ImportTeamsDialog
              open={isImportTeamsDialogOpen}
              onOpenChange={setIsImportTeamsDialogOpen}
              tournamentId={currentTournament.id}
              onTeamsImported={handleImportTeams}
            />
          </TabContentWrapper>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <TabContentWrapper>
            <Card>
              <CardHeader>
                <CardTitle>Match Scheduling</CardTitle>
                <CardDescription>
                  Schedule matches, assign courts, and manage tournament progress.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScheduleMatches 
                  tournamentId={currentTournament.id}
                  onAutoSchedule={() => setIsScheduleDialogOpen(true)}
                />

                <Separator className="my-6" />

                <ScoreEntrySection 
                  tournamentId={currentTournament.id}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {currentTournament.matches.length} Matches Total
                  </Badge>
                  <Badge variant="outline">
                    {currentTournament.matches.filter(m => m.status === "COMPLETED").length} Completed
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => setIsScheduleMatchDialogOpen(true)}
                    variant="secondary"
                  >
                    Schedule Match
                  </Button>
                  <Button 
                    onClick={() => setIsScheduleDialogOpen(true)}
                  >
                    Auto Schedule
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabContentWrapper>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <TabContentWrapper>
            <Card>
              <CardHeader>
                <CardTitle>Tournament Settings</CardTitle>
                <CardDescription>
                  Configure tournament details, formats, and scoring rules.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Tournament settings content will go here */}
                <p>Settings coming soon</p>
              </CardContent>
            </Card>
          </TabContentWrapper>
        </TabsContent>
      </Tabs>
      
      {/* Dialogs */}
      <UnifiedScheduleDialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        tournament={currentTournament}
      />
      
      <ScheduleMatchDialog
        open={isScheduleMatchDialogOpen}
        onOpenChange={setIsScheduleMatchDialogOpen}
        tournamentId={currentTournament.id}
        onCreateMatch={handleScheduleMatch}
      />
    </div>
  );
};

export default TournamentDetail;
