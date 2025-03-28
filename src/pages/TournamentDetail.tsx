
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Pencil, Plus, Trash2, Calendar as CalendarIcon, Terminal, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTournament } from "@/contexts/TournamentContext";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/shared/PageHeader";
import TeamTable from "@/components/team/TeamTable";
import CourtTable from "@/components/court/CourtTable";
import MatchTable from "@/components/match/MatchTable";
import TournamentBracket from "@/components/tournament/TournamentBracket";
import TeamCreateDialog from "@/components/team/TeamCreateDialog";
import CourtCreateDialog from "@/components/court/CourtCreateDialog";
import MatchCreateDialog from "@/components/match/MatchCreateDialog";
import ScheduleMatchDialog from "@/components/tournament/ScheduleMatchDialog";
import { Team, Court, Match, TournamentStatus, TournamentFormat } from "@/types/tournament";
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import TournamentScoringSettingsSection from "@/components/tournament/TournamentScoringSettingsSection";

const TournamentDetail = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { 
    currentTournament, 
    setCurrentTournament, 
    updateTournament, 
    deleteTournament, 
    addTeam, 
    updateCourt, 
    addTeam: createTeam, 
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
  const [editMode, setEditMode] = useState(false);
  const [tournamentName, setTournamentName] = useState("");
  const [tournamentDescription, setTournamentDescription] = useState("");
  const [tournamentFormat, setTournamentFormat] = useState<TournamentFormat>("GROUP_DIVISION");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [autoAssignCourtsEnabled, setAutoAssignCourtsEnabled] = useState(false);
  const [divisionProgressionEnabled, setDivisionProgressionEnabled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (tournamentId) {
      // Find the tournament by ID
      const tournament = currentTournament?.id === tournamentId ? currentTournament : null;

      if (tournament) {
        setCurrentTournament(tournament);
        setTournamentName(tournament.name);
        setTournamentDescription(tournament.description || "");
        setTournamentFormat(tournament.format);
        setStartDate(tournament.startDate ? new Date(tournament.startDate) : undefined);
        setEndDate(tournament.endDate ? new Date(tournament.endDate) : undefined);
        setAutoAssignCourtsEnabled(tournament.autoAssignCourts || false);
        setDivisionProgressionEnabled(tournament.divisionProgression || false);
      }
    }
  }, [tournamentId, currentTournament, setCurrentTournament]);

  const handleTeamCreate = (team: Omit<Team, "id">) => {
    createTeam({ ...team, id: Math.random().toString(36).substring(2, 9) });
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

  const handleCourtUpdate = (court: Court) => {
    updateCourt(court);
  };

  const handleTeamUpdate = (team: Team) => {
    addTeam(team);
  };

  const handleMatchUpdate = (match: Match) => {
    updateMatch(match);
  };

  const handleCourtAssign = (matchId: string, courtId: string) => {
    assignCourt(matchId, courtId);
  };

  const handleAutoAssignCourts = () => {
    if (!currentTournament) return;
    
    const count = autoAssignCourts();
    
    if (count > 0) {
      toast({
        title: "Courts Assigned",
        description: `Successfully assigned ${count} courts to scheduled matches.`,
      });
    } else {
      toast({
        title: "No Courts Assigned",
        description: "No available courts or scheduled matches without courts.",
        variant: "destructive",
      });
    }
  };

  const handleTournamentUpdate = () => {
    if (!currentTournament) return;

    const updatedTournament = {
      ...currentTournament,
      name: tournamentName,
      description: tournamentDescription,
      format: tournamentFormat,
      startDate: startDate || new Date(),
      endDate: endDate,
      autoAssignCourts: autoAssignCourtsEnabled,
      divisionProgression: divisionProgressionEnabled,
      updatedAt: new Date()
    };

    updateTournament(updatedTournament);
    setEditMode(false);
    
    toast({
      title: "Tournament Updated",
      description: "Tournament details have been successfully updated.",
    });
  };

  const handleTournamentDelete = () => {
    if (!currentTournament) return;
    deleteTournament(currentTournament.id);
    navigate("/tournaments");
  };

  const handleAdvanceToNextStage = () => {
    if (!currentTournament) return;
    advanceToNextStage();
    toast({
      title: "Tournament Advanced",
      description: `Advanced to ${getNextStageName(currentTournament.currentStage)}`,
    });
  };

  const getNextStageName = (currentStage: string) => {
    switch (currentStage) {
      case "INITIAL_ROUND": return "Division Placement";
      case "DIVISION_PLACEMENT": return "Playoff Knockout";
      case "PLAYOFF_KNOCKOUT": return "Completed";
      default: return "Next Stage";
    }
  };

  const handleGenerateMultiStageTournament = () => {
    if (!currentTournament) return;
    generateMultiStageTournament();
    toast({
      title: "Tournament Generated",
      description: "Multi-stage tournament has been generated",
    });
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
        <div className="flex justify-between items-start flex-wrap mb-6">
          <div className="w-full md:w-2/3">
            {editMode ? (
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Tournament Name"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  className="mb-2"
                />
                <Input
                  type="text"
                  placeholder="Tournament Description"
                  value={tournamentDescription}
                  onChange={(e) => setTournamentDescription(e.target.value)}
                  className="mb-2"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1 block">Tournament Format</Label>
                    <Select 
                      value={tournamentFormat} 
                      onValueChange={(value) => setTournamentFormat(value as TournamentFormat)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SINGLE_ELIMINATION">Single Elimination</SelectItem>
                        <SelectItem value="DOUBLE_ELIMINATION">Double Elimination</SelectItem>
                        <SelectItem value="ROUND_ROBIN">Round Robin</SelectItem>
                        <SelectItem value="GROUP_DIVISION">Group Division</SelectItem>
                        <SelectItem value="MULTI_STAGE">Multi-Stage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-assign-courts">Auto-Assign Courts</Label>
                      <Switch
                        id="auto-assign-courts"
                        checked={autoAssignCourtsEnabled}
                        onCheckedChange={setAutoAssignCourtsEnabled}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="division-progression">Division Progression</Label>
                      <Switch
                        id="division-progression"
                        checked={divisionProgressionEnabled}
                        onCheckedChange={setDivisionProgressionEnabled}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="block">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50" align="center">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="block">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50" align="center">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            ) : (
              <PageHeader
                title={currentTournament.name}
                description={currentTournament.description}
              />
            )}
          </div>

          <div className="mt-4 md:mt-0">
            {editMode ? (
              <div className="space-x-2">
                <Button onClick={handleTournamentUpdate}>Save</Button>
                <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
              </div>
            ) : (
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setEditMode(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Tournament
                </Button>
                <Button variant="destructive" onClick={handleTournamentDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Tournament
                </Button>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="courts">Courts</TabsTrigger>
            <TabsTrigger value="bracket">Bracket</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Details</CardTitle>
                  <CardDescription>Information about the tournament</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Format</p>
                      <p>{currentTournament.format}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p>{currentTournament.status}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Start Date</p>
                      <p>{currentTournament.startDate ? format(new Date(currentTournament.startDate), 'PPP') : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">End Date</p>
                      <p>{currentTournament.endDate ? format(new Date(currentTournament.endDate), 'PPP') : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Auto-Assign Courts</p>
                      <p>{currentTournament.autoAssignCourts ? "Enabled" : "Disabled"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Division Progression</p>
                      <p>{currentTournament.divisionProgression ? "Enabled" : "Disabled"}</p>
                    </div>
                  </div>
                  
                  {/* Court Auto Assignment Button */}
                  <Button 
                    onClick={handleAutoAssignCourts}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  >
                    <Terminal className="h-4 w-4 mr-2" />
                    Auto-Assign Courts to Matches
                  </Button>
                  
                  {/* Generate and Auto Schedule buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Button 
                      onClick={handleGenerateMultiStageTournament}
                      className="bg-blue-600 hover:bg-blue-700"
                      title="Creates all tournament matches based on your team structure"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Generate Tournament
                    </Button>
                    <Button 
                      onClick={() => setScheduleDialogOpen(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                      title="Schedule match times and courts automatically"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Auto Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Add Scoring Settings Card */}
              <TournamentScoringSettingsSection 
                tournament={currentTournament} 
                onUpdateTournament={updateTournament} 
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tournament Progress</CardTitle>
                <CardDescription>Track the progress of the tournament</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Current Stage: {currentTournament.currentStage}</p>
                {currentTournament.status !== "COMPLETED" && currentTournament.status !== "DRAFT" && (
                  <Button onClick={handleAdvanceToNextStage}>Advance to Next Stage</Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Teams</h2>
              <Button onClick={() => setTeamDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Team
              </Button>
            </div>
            <TeamTable
              teams={currentTournament.teams}
              onTeamUpdate={handleTeamUpdate}
            />
          </TabsContent>

          <TabsContent value="matches" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Matches</h2>
              <div className="space-x-2">
                <Button onClick={() => setMatchDialogOpen(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule One Match
                </Button>
                <Button onClick={() => setScheduleDialogOpen(true)}>
                  <Clock className="h-4 w-4 mr-2" />
                  Auto Schedule
                </Button>
              </div>
            </div>
            <MatchTable
              matches={currentTournament.matches}
              teams={currentTournament.teams}
              courts={currentTournament.courts}
              onMatchUpdate={handleMatchUpdate}
              onCourtAssign={handleCourtAssign}
            />
          </TabsContent>

          <TabsContent value="courts" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Courts</h2>
              <Button onClick={() => setCourtDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Court
              </Button>
            </div>
            <CourtTable
              courts={currentTournament.courts}
              onCourtUpdate={handleCourtUpdate}
            />
          </TabsContent>

          <TabsContent value="bracket">
            <TournamentBracket tournament={currentTournament} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default TournamentDetail;
