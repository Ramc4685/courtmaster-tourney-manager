import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournament } from '@/contexts/tournament/useTournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Plus, Users, Calendar, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tournament, Team } from '@/types/tournament';
import { TournamentStatus, TournamentStage, Division } from '@/types/tournament-enums';
import { ScoringSettings } from '@/types/tournament';

export default function TournamentDetails() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { tournaments, currentTournament, setCurrentTournament, updateTournament, isLoading, error } = useTournament();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddTeamDialogOpen, setIsAddTeamDialogOpen] = useState(false);
  const [isImportTeamsDialogOpen, setIsImportTeamsDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isScoringSettingsDialogOpen, setIsScoringSettingsDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<Division>(Division.MENS);

  useEffect(() => {
    if (tournamentId) {
      const foundTournament = tournaments.find(t => t.id === tournamentId);
      if (foundTournament) {
        setTournament(foundTournament);
        setCurrentTournament(foundTournament);
      }
    }
  }, [tournamentId, tournaments, setCurrentTournament]);

  if (isLoading) {
    return (
      <div className="container px-4 py-6">
        <div className="flex items-center mb-6">
          <Skeleton className="h-8 w-8 mr-4" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="container px-4 py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load tournament details. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleAddTeam = async () => {
    if (!newTeamName.trim()) return;

    const newTeam: Team = {
      id: Date.now().toString(),
      name: newTeamName,
      division: selectedDivision,
      players: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedTournament = {
      ...tournament,
      teams: [...tournament.teams, newTeam],
      updatedAt: new Date()
    };

    await updateTournament(tournament.id, updatedTournament);
    setTournament(updatedTournament);
    setNewTeamName('');
    setIsAddTeamDialogOpen(false);
  };

  const handleImportTeams = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const teams = JSON.parse(e.target?.result as string) as Team[];
        const updatedTournament = {
          ...tournament,
          teams: [...tournament.teams, ...teams],
          updatedAt: new Date()
        };

        await updateTournament(tournament.id, updatedTournament);
        setTournament(updatedTournament);
        setIsImportTeamsDialogOpen(false);
      } catch (error) {
        console.error('Failed to import teams:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleUpdateScoringSettings = async (settings: ScoringSettings) => {
    const updatedTournament = {
      ...tournament,
      scoringSettings: settings,
      updatedAt: new Date()
    };

    await updateTournament(tournament.id, updatedTournament);
    setTournament(updatedTournament);
    setIsScoringSettingsDialogOpen(false);
  };

  return (
    <div className="container px-4 py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold ml-4">{tournament.name}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Status</Label>
                  <p className="text-lg font-medium">{tournament.status}</p>
                </div>
                <div>
                  <Label>Stage</Label>
                  <p className="text-lg font-medium">{tournament.currentStage}</p>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <p className="text-lg font-medium">
                    {new Date(tournament.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label>End Date</Label>
                  <p className="text-lg font-medium">
                    {new Date(tournament.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Teams</h2>
            <div className="space-x-2">
              <Dialog open={isAddTeamDialogOpen} onOpenChange={setIsAddTeamDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Team</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="teamName">Team Name</Label>
                      <Input
                        id="teamName"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="division">Division</Label>
                      <Select
                        value={selectedDivision}
                        onValueChange={(value) => setSelectedDivision(value as Division)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(Division).map((division) => (
                            <SelectItem key={division} value={division}>
                              {division}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddTeam} className="w-full">
                      Add Team
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isImportTeamsDialogOpen} onOpenChange={setIsImportTeamsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Import Teams
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Teams</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="teamFile">Select JSON File</Label>
                      <Input
                        id="teamFile"
                        type="file"
                        accept=".json"
                        onChange={handleImportTeams}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tournament.teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <CardTitle>{team.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Division: {team.division}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Players: {team.players?.length || 0}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Matches</h2>
            <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Matches
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule Matches</DialogTitle>
                </DialogHeader>
                {/* Add match scheduling form here */}
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {tournament.matches.map((match) => (
              <Card key={match.id}>
                <CardHeader>
                  <CardTitle>
                    {match.team1?.name} vs {match.team2?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Round: {match.round}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Status: {match.status}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Settings</h2>
            <Dialog open={isScoringSettingsDialogOpen} onOpenChange={setIsScoringSettingsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Scoring Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Scoring Settings</DialogTitle>
                </DialogHeader>
                {/* Add scoring settings form here */}
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Current Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label>Sets to Win</Label>
                  <p className="text-lg font-medium">
                    {tournament.scoringSettings.setsToWin}
                  </p>
                </div>
                <div>
                  <Label>Games per Set</Label>
                  <p className="text-lg font-medium">
                    {tournament.scoringSettings.gamesPerSet}
                  </p>
                </div>
                <div>
                  <Label>Points per Game</Label>
                  <p className="text-lg font-medium">
                    {tournament.scoringSettings.pointsPerGame}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
