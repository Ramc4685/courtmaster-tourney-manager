import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTournament } from '@/contexts/tournament/useTournament';
import { Tournament } from '@/types/tournament';
import { Court } from '@/types/tournament';
import { Match } from '@/types/tournament';
import { TournamentCategory } from '@/types/tournament';
import { TournamentFormat } from '@/types/tournament-enums';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import CategoryTabs from '@/components/tournament/tabs/CategoryTabs';
import BracketTab from '@/components/tournament/tabs/BracketTab';
import MatchesTab from '@/components/tournament/tabs/MatchesTab';
import TeamsTab from '@/components/tournament/tabs/TeamsTab';
import CourtsTab from '@/components/tournament/tabs/CourtsTab';
import OverviewTab from '@/components/tournament/tabs/OverviewTab';
import TournamentHeader from '@/components/tournament/TournamentHeader';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AddTeamDialog from '@/components/tournament/AddTeamDialog';
import ImportTeamsDialog from '@/components/tournament/ImportTeamsDialog';
import ScheduleMatchDialog from '@/components/tournament/ScheduleMatchDialog';
import TeamManagementTab from '@/components/tournament/tabs/TeamManagementTab';
import ScoreEntrySection from '@/components/tournament/score-entry/ScoreEntrySection';
import { Team } from '@/types/tournament';
import { format, parse } from 'date-fns';

const TournamentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [categoryTab, setCategoryTab] = useState<string>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [scheduleMatchDialogOpen, setScheduleMatchDialogOpen] = useState(false);
  const { 
    currentTournament, 
    loadTournaments, 
    deleteTournament,
    updateTournament,
    addTeam,
    importTeams,
    scheduleMatch, 
    generateBrackets,
    autoAssignCourts,
    generateMultiStageTournament,
  } = useTournament();

  useEffect(() => {
    if (id) {
      setLoading(true);
      loadTournaments()
        .then(() => {
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error loading tournaments:', error);
          setLoading(false);
          toast({
            title: 'Error',
            description: 'Failed to load tournament data',
            variant: 'destructive',
          });
        });
    }
  }, [id, loadTournaments]);

  useEffect(() => {
    if (currentTournament && currentTournament.id === id) {
      setTournament(currentTournament);
    }
  }, [currentTournament, id]);

  const handleDeleteTournament = async () => {
    if (!tournament) return;

    try {
      await deleteTournament(tournament.id);
      toast({
        title: 'Tournament Deleted',
        description: 'The tournament has been deleted successfully',
      });
      // Navigate away after deletion
      window.location.href = '/tournaments';
    } catch (error) {
      console.error('Error deleting tournament:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete tournament',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleAddTeam = (team: Team) => {
    if (!tournament) return;
    addTeam(team);
  };

  const handleImportTeams = (teams: Team[]) => {
    if (!tournament) return;
    importTeams(teams);
  };

  const handleCreateMatch = (
    team1Id: string,
    team2Id: string,
    scheduledTime: Date,
    courtId?: string,
    categoryId?: string
  ) => {
    if (!tournament) return;

    scheduleMatch(team1Id, team2Id, scheduledTime, courtId, categoryId);
    toast({
      title: 'Match Scheduled',
      description: 'The match has been scheduled successfully',
    });
  };

  const handleGenerateBrackets = () => {
    if (!tournament) return;
    generateMultiStageTournament(tournament.format);
  };

  const handleAutoAssignCourts = async () => {
    if (!tournament) return;

    try {
      const courtsAssigned = await autoAssignCourts();
      toast({
        title: 'Courts Assigned',
        description: `${courtsAssigned} courts have been assigned`,
      });
    } catch (error) {
      console.error('Error assigning courts:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign courts',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateTournament = (data: Partial<Tournament>) => {
    if (!tournament) return;
    const updatedTournament = {
      ...tournament,
      ...data,
      startDate: typeof data.startDate === 'string' ? new Date(data.startDate) : data.startDate || tournament.startDate,
      endDate: typeof data.endDate === 'string' ? new Date(data.endDate) : data.endDate || tournament.endDate,
      registrationDeadline: typeof data.registrationDeadline === 'string' ? new Date(data.registrationDeadline) : data.registrationDeadline || tournament.registrationDeadline
    };
    updateTournament(updatedTournament);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3">
              <Card>
                <CardHeader>
                  <Skeleton className="h-8 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-full" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Tournament Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>We couldn't find the tournament you're looking for.</p>
            <Button className="mt-4" onClick={() => window.location.href = '/tournaments'}>
              Back to Tournaments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <TournamentHeader 
        tournament={tournament} 
        updateTournament={handleUpdateTournament}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <CategoryTabs tournament={tournament} activeTab={activeTab} />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bracket">Bracket</TabsTrigger>
              <TabsTrigger value="matches">Matches</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="courts">Courts</TabsTrigger>
              <TabsTrigger value="team-management">Team Management</TabsTrigger>
              <TabsTrigger value="score-entry">Score Entry</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab
                tournament={{
                  name: tournament.name,
                  startDate: tournament.startDate.toISOString().split('T')[0],
                  endDate: tournament.endDate.toISOString().split('T')[0],
                  registrationDeadline: tournament.registrationDeadline.toISOString().split('T')[0],
                  location: tournament.location,
                  status: tournament.status,
                  participants: tournament.participants
                }}
                onUpdateTournament={handleUpdateTournament}
                onGenerateMultiStageTournament={handleGenerateBrackets}
                onAdvanceToNextStage={() => {}}
                onScheduleDialogOpen={() => setScheduleMatchDialogOpen(true)}
              />
            </TabsContent>

            <TabsContent value="bracket">
              <div className="flex justify-end mb-4">
                <Button variant="secondary" onClick={handleGenerateBrackets}>
                  Generate Brackets
                </Button>
              </div>
              <BracketTab tournament={tournament} />
            </TabsContent>

            <TabsContent value="matches">
              <div className="flex justify-end mb-4 space-x-2">
                <Button variant="outline" onClick={() => setScheduleMatchDialogOpen(true)}>
                  Schedule Match
                </Button>
                <Button variant="secondary" onClick={handleAutoAssignCourts}>
                  Auto-Assign Courts
                </Button>
              </div>
              <MatchesTab
                matches={tournament.matches}
                courts={tournament.courts}
                teams={tournament.teams}
                onCourtAssign={(matchId, courtId) => {
                  const updatedTournament = {
                    ...tournament,
                    matches: tournament.matches.map(m => 
                      m.id === matchId ? { ...m, courtId } : m
                    )
                  };
                  handleUpdateTournament(updatedTournament);
                }}
                onMatchUpdate={(match) => {
                  const updatedTournament = {
                    ...tournament,
                    matches: tournament.matches.map(m => 
                      m.id === match.id ? match : m
                    )
                  };
                  handleUpdateTournament(updatedTournament);
                }}
                onAddMatchClick={() => setScheduleMatchDialogOpen(true)}
                onAutoScheduleClick={handleAutoAssignCourts}
              />
            </TabsContent>

            <TabsContent value="teams">
              <div className="flex justify-end mb-4 space-x-2">
                <Button variant="outline" onClick={() => setTeamDialogOpen(true)}>
                  Add Team
                </Button>
                <Button variant="secondary" onClick={() => setImportDialogOpen(true)}>
                  Import Teams
                </Button>
              </div>
              <TeamsTab
                tournament={tournament}
                category={tournament.categories?.find(c => c.id === categoryTab)}
              />
            </TabsContent>

            <TabsContent value="courts">
              <CourtsTab
                courts={tournament.courts}
                onCourtUpdate={(court) => {
                  const updatedTournament = {
                    ...tournament,
                    courts: tournament.courts.map(c => 
                      c.id === court.id ? court : c
                    )
                  };
                  handleUpdateTournament(updatedTournament);
                }}
                onAddCourtClick={() => {
                  const updatedTournament = {
                    ...tournament,
                    courts: [...tournament.courts, { id: Date.now().toString(), name: `Court ${tournament.courts.length + 1}` }]
                  };
                  handleUpdateTournament(updatedTournament);
                }}
              />
            </TabsContent>

            <TabsContent value="team-management">
              <TeamManagementTab tournament={tournament} />
            </TabsContent>

            <TabsContent value="score-entry">
              <ScoreEntrySection
                matches={tournament.matches}
                onMatchUpdate={(match) => {
                  const updatedTournament = {
                    ...tournament,
                    matches: tournament.matches.map(m => 
                      m.id === match.id ? match : m
                    )
                  };
                  handleUpdateTournament(updatedTournament);
                }}
              />
            </TabsContent>
          </Tabs>

          <AddTeamDialog
            open={teamDialogOpen}
            onOpenChange={setTeamDialogOpen}
            onSubmit={handleAddTeam}
          />

          <ImportTeamsDialog
            open={importDialogOpen}
            onOpenChange={setImportDialogOpen}
            onSubmit={handleImportTeams}
            tournamentId={tournament?.id || ''}
          />

          <ScheduleMatchDialog
            open={scheduleMatchDialogOpen}
            onOpenChange={setScheduleMatchDialogOpen}
            tournamentId={tournament.id}
            onCreateMatch={handleCreateMatch}
          />
        </div>

        <div className="space-y-4">
          {/* Tournament Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tournament Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <Button variant="secondary" onClick={handleGenerateBrackets}>
                  Generate Brackets
                </Button>
                <Button variant="secondary" onClick={handleAutoAssignCourts}>
                  Assign Courts
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  Delete Tournament
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tournament Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tournament Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Format: </span>
                  <span>{tournament.format}</span>
                </div>
                <div>
                  <span className="font-semibold">Start Date: </span>
                  <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-semibold">End Date: </span>
                  <span>{new Date(tournament.endDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-semibold">Location: </span>
                  <span>{tournament.location || 'Not specified'}</span>
                </div>
                <div>
                  <span className="font-semibold">Teams: </span>
                  <span>{tournament.teams.length}</span>
                </div>
                <div>
                  <span className="font-semibold">Matches: </span>
                  <span>{tournament.matches.length}</span>
                </div>
                <div>
                  <span className="font-semibold">Courts: </span>
                  <span>{tournament.courts.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tournament
              and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTournament} className="bg-red-500 hover:bg-red-600">
              Delete Tournament
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TournamentDetail;
