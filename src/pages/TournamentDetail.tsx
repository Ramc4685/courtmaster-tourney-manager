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
import { PlusCircle, Trophy, Calendar, Users, Save, ArrowRight, Trash2, Clock, FileUp, LayoutGrid, RefreshCw } from "lucide-react";
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
import { Team, Division, TournamentStatus, Match, MatchStatus } from "@/types/tournament";
import { useToast } from "@/hooks/use-toast";

const TournamentDetail = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tournaments, setCurrentTournament, updateTournament, deleteTournament, generateBracket, autoAssignCourts } = useTournament();
  const [showAddTeamDialog, setShowAddTeamDialog] = useState(false);
  const [showScheduleMatchDialog, setShowScheduleMatchDialog] = useState(false);
  const [showImportTeamsDialog, setShowImportTeamsDialog] = useState(false);

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

  const handlePublishTournament = () => {
    if (tournament.teams.length < 2) {
      toast({
        title: "Not enough teams",
        description: "You need at least 2 teams to publish a tournament",
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
    if (tournament.teams.length < 2) {
      toast({
        title: "Not enough teams",
        description: "You need at least 2 teams to start a tournament",
        variant: "destructive",
      });
      return;
    }
    
    // Update tournament status
    const updatedTournament = {
      ...tournament,
      status: "IN_PROGRESS" as TournamentStatus,
    };
    
    updateTournament(updatedTournament);
    
    // Generate bracket if it's an elimination tournament
    if (tournament.format === "SINGLE_ELIMINATION" || tournament.format === "DOUBLE_ELIMINATION") {
      generateBracket();
      toast({
        title: "Tournament started",
        description: "The tournament bracket has been generated",
      });
    } else {
      toast({
        title: "Tournament started",
        description: "The tournament is now in progress",
      });
    }
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
    
    // Check if assignedCount is defined before comparing
    if (assignedCount && assignedCount > 0) {
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

  // Group matches by status
  const scheduledMatches = tournament.matches.filter(m => m.status === "SCHEDULED");
  const inProgressMatches = tournament.matches.filter(m => m.status === "IN_PROGRESS");
  const completedMatches = tournament.matches.filter(m => m.status === "COMPLETED");

  // Check if the tournament has bracket rounds
  const hasBracket = tournament.matches.some(m => m.bracketRound !== undefined);

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
              ) : (
                <Link to={`/scoring/${tournament.id}`}>
                  <Button 
                    className="bg-court-green hover:bg-court-green/90"
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    Go to Scoring
                  </Button>
                </Link>
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
        </div>

        <Tabs defaultValue="teams" className="mt-6">
          <TabsList>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="bracket">Bracket</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="courts">Courts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bracket" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tournament Bracket</CardTitle>
                  <CardDescription>
                    View the tournament bracket and progression
                  </CardDescription>
                </div>
                {tournament.status === "IN_PROGRESS" && (tournament.format === "SINGLE_ELIMINATION" || tournament.format === "DOUBLE_ELIMINATION") && (
                  <Button 
                    onClick={() => generateBracket()}
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate Bracket
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {tournament.format !== "SINGLE_ELIMINATION" && tournament.format !== "DOUBLE_ELIMINATION" ? (
                  <div className="text-center py-12">
                    <LayoutGrid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Bracket view not available</h3>
                    <p className="mt-1 text-gray-500">
                      Bracket view is only available for Single Elimination and Double Elimination tournaments.
                    </p>
                  </div>
                ) : tournament.status === "DRAFT" ? (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Tournament not started</h3>
                    <p className="mt-1 text-gray-500">
                      The bracket will be generated when the tournament is started.
                    </p>
                  </div>
                ) : (
                  <TournamentBracket tournament={tournament} onMatchClick={(match) => {
                    if (match.status !== "COMPLETED") {
                      navigate(`/scoring/${tournament.id}`);
                    }
                  }} />
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
                        <div className="grid gap-4 md:grid-cols-2">
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

          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Settings</CardTitle>
                <CardDescription>
                  Modify tournament details and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Tournament settings form will go here */}
                  <p>Settings coming soon</p>
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
