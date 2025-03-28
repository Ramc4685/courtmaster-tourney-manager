
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trophy, Calendar, Users, Save, ArrowRight, Trash2, Clock, FileUp, LayoutGrid, RefreshCw, ArrowRightCircle } from "lucide-react";
import { format } from "date-fns";
import { useTournament } from "@/contexts/TournamentContext";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/shared/PageHeader";
import TeamList from "@/components/tournament/TeamList";
import AddTeamDialog from "@/components/tournament/AddTeamDialog";
import ScheduleMatchDialog from "@/components/tournament/ScheduleMatchDialog";
import ImportTeamsDialog from "@/components/tournament/ImportTeamsDialog";
import TournamentBracket from "@/components/tournament/TournamentBracket";
import MatchCard from "@/components/shared/MatchCard";
import { Team, Division, TournamentStatus, Match, MatchStatus, TournamentStage } from "@/types/tournament";
import { useToast } from "@/hooks/use-toast";

const TournamentDetail = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    tournaments, 
    setCurrentTournament, 
    updateTournament, 
    deleteTournament, 
    generateBracket, 
    autoAssignCourts,
    generateMultiStageTournament,
    advanceToNextStage 
  } = useTournament();
  const [showAddTeamDialog, setShowAddTeamDialog] = useState(false);
  const [showScheduleMatchDialog, setShowScheduleMatchDialog] = useState(false);
  const [showImportTeamsDialog, setShowImportTeamsDialog] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<Division>("DIVISION_1");

  // Find the tournament by ID
  useEffect(() => {
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (tournament) {
      setCurrentTournament(tournament);
    } else {
      toast({
        title: "Tournament not found",
        description: "Redirecting to tournaments list",
        variant: "destructive",
      });
      navigate("/tournaments");
    }
  }, [tournamentId, tournaments, setCurrentTournament, navigate, toast]);

  const tournament = tournaments.find((t) => t.id === tournamentId);

  if (!tournament) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <p>Tournament not found. Redirecting...</p>
        </div>
      </Layout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="outline">Draft</Badge>;
      case "PUBLISHED":
        return <Badge variant="secondary">Published</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-court-green">In Progress</Badge>;
      case "COMPLETED":
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return null;
    }
  };

  const getStageBadge = (stage: TournamentStage) => {
    switch (stage) {
      case "INITIAL_ROUND":
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-800">Initial Round</Badge>;
      case "DIVISION_PLACEMENT":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-800">Division Placement</Badge>;
      case "PLAYOFF_KNOCKOUT":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-800">Playoff Knockout</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-800">Completed</Badge>;
      default:
        return null;
    }
  };

  const handlePublishTournament = () => {
    if (tournament.teams.length < 38) {
      toast({
        title: "Not enough teams",
        description: "This tournament format requires exactly 38 teams",
        variant: "destructive",
      });
      return;
    }
    
    const updatedTournament = {
      ...tournament,
      status: "PUBLISHED" as TournamentStatus,
    };
    
    updateTournament(updatedTournament);
    
    toast({
      title: "Tournament published",
      description: "The tournament has been published successfully",
    });
  };

  const handleStartTournament = () => {
    if (tournament.teams.length < 38) {
      toast({
        title: "Not enough teams",
        description: "This tournament format requires exactly 38 teams",
        variant: "destructive",
      });
      return;
    }
    
    // Generate the multi-stage tournament
    generateMultiStageTournament();
    
    toast({
      title: "Tournament started",
      description: "Initial round matches have been generated",
    });
  };

  const handleAdvanceStage = () => {
    // Check if all matches in the current stage are completed
    const currentStageMatches = tournament.matches.filter(
      m => m.stage === tournament.currentStage
    );
    
    const allCompleted = currentStageMatches.every(m => m.status === "COMPLETED");
    
    if (!allCompleted) {
      toast({
        title: "Cannot advance stage",
        description: "All matches in the current stage must be completed first",
        variant: "destructive",
      });
      return;
    }
    
    advanceToNextStage();
    
    toast({
      title: "Stage advanced",
      description: `Advanced to ${tournament.currentStage === "INITIAL_ROUND" ? "Division Placement" : "Playoff Knockout"} stage`,
    });
  };

  const handleDeleteTournament = () => {
    deleteTournament(tournament.id);
    toast({
      title: "Tournament deleted",
      description: "The tournament has been deleted successfully",
    });
    navigate("/tournaments");
  };

  const handleAutoAssignCourts = () => {
    const assignedCount = autoAssignCourts();
    
    if (assignedCount > 0) {
      toast({
        title: "Courts assigned",
        description: `Automatically assigned ${assignedCount} court(s) to scheduled matches`,
      });
    } else {
      toast({
        title: "No courts assigned",
        description: "No available courts or scheduled matches without courts found",
      });
    }
  };

  // Group matches by stage and status
  const initialRoundMatches = tournament.matches.filter(m => m.stage === "INITIAL_ROUND");
  const divisionPlacementMatches = tournament.matches.filter(m => m.stage === "DIVISION_PLACEMENT");
  const playoffKnockoutMatches = tournament.matches.filter(m => m.stage === "PLAYOFF_KNOCKOUT");
  
  const scheduledMatches = tournament.matches.filter(m => m.status === "SCHEDULED");
  const inProgressMatches = tournament.matches.filter(m => m.status === "IN_PROGRESS");
  const completedMatches = tournament.matches.filter(m => m.status === "COMPLETED");

  // Check if the tournament has matches in the playoff stage
  const hasPlayoffMatches = tournament.matches.some(m => m.stage === "PLAYOFF_KNOCKOUT");

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title={tournament.name}
          description={tournament.description || "No description provided"}
          action={
            <div className="flex space-x-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the tournament and all its data.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteTournament}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              {tournament.status === "DRAFT" ? (
                <Button 
                  className="bg-court-green hover:bg-court-green/90"
                  onClick={handlePublishTournament}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Publish Tournament
                </Button>
              ) : tournament.status === "PUBLISHED" ? (
                <Button 
                  className="bg-court-green hover:bg-court-green/90"
                  onClick={handleStartTournament}
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  Start Tournament
                </Button>
              ) : tournament.status === "IN_PROGRESS" && (
                <>
                  {(tournament.currentStage === "INITIAL_ROUND" || tournament.currentStage === "DIVISION_PLACEMENT") && (
                    <Button 
                      className="bg-court-green hover:bg-court-green/90"
                      onClick={handleAdvanceStage}
                    >
                      <ArrowRightCircle className="mr-2 h-4 w-4" />
                      Advance to Next Stage
                    </Button>
                  )}
                  <Link to={`/scoring/${tournament.id}`}>
                    <Button 
                      className="bg-court-blue hover:bg-court-blue/90"
                    >
                      <Trophy className="mr-2 h-4 w-4" />
                      Go to Scoring
                    </Button>
                  </Link>
                </>
              )}
            </div>
          }
        />

        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-2" />
            <span>
              {format(new Date(tournament.startDate), "MMMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Users className="h-4 w-4 mr-2" />
            <span>{tournament.teams.length} Teams</span>
          </div>
          {getStatusBadge(tournament.status)}
          {tournament.currentStage && getStageBadge(tournament.currentStage)}
        </div>

        <Tabs defaultValue="teams" className="mt-6">
          <TabsList>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="stages">Stages</TabsTrigger>
            <TabsTrigger value="bracket">Bracket</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="courts">Courts</TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Teams</CardTitle>
                  <CardDescription>
                    Manage teams participating in this tournament
                  </CardDescription>
                </div>
                {tournament.status === "DRAFT" && (
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => setShowImportTeamsDialog(true)}
                      variant="outline"
                    >
                      <FileUp className="h-4 w-4 mr-2" />
                      Import Teams
                    </Button>
                    <Button 
                      onClick={() => setShowAddTeamDialog(true)}
                      className="bg-court-green hover:bg-court-green/90"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Team
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <TeamList teams={tournament.teams} />
                {tournament.teams.length < 38 && tournament.status === "DRAFT" && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-800">
                      This tournament format requires exactly 38 teams. Currently have {tournament.teams.length} teams.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stages" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Stages</CardTitle>
                <CardDescription>
                  Track progression through the tournament stages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Initial Round */}
                  <div className={`border rounded-lg p-6 ${tournament.currentStage === "INITIAL_ROUND" ? "border-amber-500 bg-amber-50" : ""}`}>
                    <h3 className="text-lg font-medium flex items-center">
                      <span className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center mr-2">1</span>
                      Initial Round
                    </h3>
                    <p className="mt-2 text-gray-600">
                      All 38 teams play one match each. Winners advance to Division 1 qualifiers or directly to Division 1.
                      Losers move to Division 2 qualifiers or Division 3 group stage.
                    </p>
                    
                    {initialRoundMatches.length > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-500 mb-2">
                          <span>Matches: {initialRoundMatches.length}</span>
                          <span>Completed: {initialRoundMatches.filter(m => m.status === "COMPLETED").length}/{initialRoundMatches.length}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-amber-500 h-2.5 rounded-full" 
                            style={{ width: `${(initialRoundMatches.filter(m => m.status === "COMPLETED").length / initialRoundMatches.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Division Placement */}
                  <div className={`border rounded-lg p-6 ${tournament.currentStage === "DIVISION_PLACEMENT" ? "border-orange-500 bg-orange-50" : ""}`}>
                    <h3 className="text-lg font-medium flex items-center">
                      <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center mr-2">2</span>
                      Division Placement
                    </h3>
                    <p className="mt-2 text-gray-600">
                      Winners #1-#13 automatically qualify for Division 1. Winners #14-#19 compete in Division 1 Qualifiers.
                      Losers #20-#29 compete in Division 2 Qualifiers. Losers #30-#38 enter Division 3 Group Stage.
                    </p>
                    
                    {divisionPlacementMatches.length > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-500 mb-2">
                          <span>Matches: {divisionPlacementMatches.length}</span>
                          <span>Completed: {divisionPlacementMatches.filter(m => m.status === "COMPLETED").length}/{divisionPlacementMatches.length}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-orange-500 h-2.5 rounded-full" 
                            style={{ width: `${(divisionPlacementMatches.filter(m => m.status === "COMPLETED").length / divisionPlacementMatches.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Playoff Knockout */}
                  <div className={`border rounded-lg p-6 ${tournament.currentStage === "PLAYOFF_KNOCKOUT" ? "border-purple-500 bg-purple-50" : ""}`}>
                    <h3 className="text-lg font-medium flex items-center">
                      <span className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center mr-2">3</span>
                      Playoff Knockout
                    </h3>
                    <p className="mt-2 text-gray-600">
                      Division 1: 16-team knockout. Division 2: 16-team knockout (8 losers from Div 1 Round of 16, 
                      3 losers from Div 1 Qualifiers, 5 winners from Div 2 Qualifiers).
                      Division 3: 8-team knockout.
                    </p>
                    
                    {playoffKnockoutMatches.length > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-500 mb-2">
                          <span>Matches: {playoffKnockoutMatches.length}</span>
                          <span>Completed: {playoffKnockoutMatches.filter(m => m.status === "COMPLETED").length}/{playoffKnockoutMatches.length}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-purple-500 h-2.5 rounded-full" 
                            style={{ width: `${(playoffKnockoutMatches.filter(m => m.status === "COMPLETED").length / playoffKnockoutMatches.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bracket" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tournament Bracket</CardTitle>
                  <CardDescription>
                    View the tournament brackets for each division
                  </CardDescription>
                </div>
                {hasPlayoffMatches && (
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => setSelectedDivision("DIVISION_1")}
                      variant={selectedDivision === "DIVISION_1" ? "default" : "outline"}
                      className={selectedDivision === "DIVISION_1" ? "bg-purple-500 hover:bg-purple-600" : ""}
                    >
                      Division 1
                    </Button>
                    <Button 
                      onClick={() => setSelectedDivision("DIVISION_2")}
                      variant={selectedDivision === "DIVISION_2" ? "default" : "outline"}
                      className={selectedDivision === "DIVISION_2" ? "bg-blue-500 hover:bg-blue-600" : ""}
                    >
                      Division 2
                    </Button>
                    <Button 
                      onClick={() => setSelectedDivision("DIVISION_3")}
                      variant={selectedDivision === "DIVISION_3" ? "default" : "outline"}
                      className={selectedDivision === "DIVISION_3" ? "bg-teal-500 hover:bg-teal-600" : ""}
                    >
                      Division 3
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {tournament.status === "DRAFT" || tournament.status === "PUBLISHED" ? (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Tournament not started</h3>
                    <p className="mt-1 text-gray-500">
                      Brackets will be available after the playoff knockout stage begins.
                    </p>
                  </div>
                ) : !hasPlayoffMatches ? (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Playoff stage not reached</h3>
                    <p className="mt-1 text-gray-500">
                      Brackets will be available after the division placement stage is completed.
                    </p>
                  </div>
                ) : (
                  <TournamentBracket 
                    tournament={tournament} 
                    division={selectedDivision}
                    onMatchClick={(match) => {
                      if (match.status !== "COMPLETED") {
                        navigate(`/scoring/${tournament.id}`);
                      }
                    }} 
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Matches</CardTitle>
                  <CardDescription>
                    View and manage tournament matches
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  {tournament.status !== "DRAFT" && (
                    <>
                      <Button 
                        onClick={handleAutoAssignCourts}
                        variant="outline"
                      >
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Auto-Assign Courts
                      </Button>
                      <Button 
                        onClick={() => setShowScheduleMatchDialog(true)}
                        className="bg-court-green hover:bg-court-green/90"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Schedule Match
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {tournament.matches.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No matches yet</h3>
                    <p className="mt-1 text-gray-500">
                      {tournament.status === "DRAFT" 
                        ? "Publish the tournament to generate initial matches."
                        : tournament.status === "PUBLISHED" 
                        ? "Start the tournament to begin matches or schedule a match manually."
                        : "No matches have been created yet. Click on 'Schedule Match' to create one."}
                    </p>
                    {tournament.status !== "DRAFT" && (
                      <Button 
                        onClick={() => setShowScheduleMatchDialog(true)}
                        className="mt-4 bg-court-green hover:bg-court-green/90"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Schedule Match
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {inProgressMatches.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">In Progress</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          {inProgressMatches.map(match => (
                            <div key={match.id} className="border rounded-lg p-4">
                              <MatchCard match={match} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {scheduledMatches.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Scheduled</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          {scheduledMatches.map(match => (
                            <div key={match.id} className="border rounded-lg p-4">
                              <MatchCard match={match} />
                              <div className="mt-3 flex justify-end">
                                <Link to={`/scoring/${tournament.id}`}>
                                  <Button size="sm" className="bg-court-green hover:bg-court-green/90">
                                    Start Scoring
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {completedMatches.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Completed</h3>
                        <div className="grid gap-4 md:grid-cols-2 max-h-96 overflow-y-auto">
                          {completedMatches.map(match => (
                            <div key={match.id} className="border rounded-lg p-4">
                              <MatchCard match={match} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courts" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Courts</CardTitle>
                <CardDescription>
                  Manage courts for this tournament
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tournament.courts.map((court) => (
                    <Card key={court.id} className="overflow-hidden">
                      <div className={`h-2 ${court.status === "AVAILABLE" ? "bg-court-green" : court.status === "IN_USE" ? "bg-amber-500" : "bg-gray-400"}`} />
                      <CardContent className="p-4">
                        <h3 className="font-semibold">{court.name}</h3>
                        <p className="text-sm text-gray-500">Status: {court.status}</p>
                        {court.currentMatch && (
                          <div className="mt-2 text-sm border-t pt-2">
                            <p className="font-medium">Current match:</p>
                            <p>{court.currentMatch.team1.name} vs {court.currentMatch.team2.name}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AddTeamDialog 
        open={showAddTeamDialog} 
        onOpenChange={setShowAddTeamDialog} 
        tournamentId={tournament.id}
      />

      <ScheduleMatchDialog
        open={showScheduleMatchDialog}
        onOpenChange={setShowScheduleMatchDialog}
        tournamentId={tournament.id}
      />

      <ImportTeamsDialog
        open={showImportTeamsDialog}
        onOpenChange={setShowImportTeamsDialog}
        tournamentId={tournament.id}
      />
    </Layout>
  );
};

export default TournamentDetail;
