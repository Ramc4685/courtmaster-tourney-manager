import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, Users, Activity, Plus, ArrowRight } from 'lucide-react';
import { useTournament } from '@/contexts/tournament/useTournament';
import { useAuth } from '@/contexts/auth/AuthContext';

const Home = () => {
  // Add debugging
  useEffect(() => {
    console.log('Home component mounted');
    return () => {
      console.log('Home component unmounted');
    };
  }, []);

  const { tournaments } = useTournament();
  const { user } = useAuth();
  
  console.log('Home component rendering', { tournamentsCount: tournaments.length, user });
  
  const activeTournaments = tournaments.filter(t => t.status !== 'COMPLETED');
  const upcomingMatches = tournaments.flatMap(t => 
    t.matches?.filter(m => 
      m.status === 'SCHEDULED' && new Date(m.scheduledTime) > new Date()
    ) || []
  ).sort((a, b) => 
    new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
  ).slice(0, 5);
  
  const totalTeams = tournaments.reduce((acc, t) => acc + (t.teams?.length || 0), 0);

  return (
    <div className="container py-6">
      <div className="flex flex-col gap-6">
        {/* Welcome section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome{user ? `, ${user.name || 'Player'}` : ' to CourtMaster'}
            </h1>
            <p className="text-muted-foreground">
              Manage your badminton tournaments with ease
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/tournament/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Tournament
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Stats overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Tournaments
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tournaments.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeTournaments.length} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Matches
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingMatches.length}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled for today: {upcomingMatches.filter(m => {
                  const date = new Date(m.scheduledTime);
                  const today = new Date();
                  return date.getDate() === today.getDate() && 
                         date.getMonth() === today.getMonth() && 
                         date.getFullYear() === today.getFullYear();
                }).length}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Teams
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTeams}</div>
              <p className="text-xs text-muted-foreground">
                Across {tournaments.length} tournaments
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Activity
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tournaments.reduce((acc, t) => acc + (t.matches?.filter(m => m.status === 'IN_PROGRESS').length || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Matches in progress
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent tournaments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tournaments</CardTitle>
            <CardDescription>
              Your most recently created tournaments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tournaments.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">You haven't created any tournaments yet</p>
                <Link to="/tournament/create">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first tournament
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {tournaments.slice(0, 3).map(tournament => (
                  <div key={tournament.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{tournament.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tournament.teams?.length || 0} teams • {tournament.matches?.length || 0} matches
                      </p>
                    </div>
                    <Link to={`/tournament/${tournament.id}`}>
                      <Button variant="ghost" size="sm">
                        View <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
                
                {tournaments.length > 0 && (
                  <div className="flex justify-end pt-2">
                    <Link to="/tournaments">
                      <Button variant="outline" size="sm">
                        View all tournaments
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/tournament/create">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5" />
                  Create Tournament
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Set up a new badminton tournament with custom formats and brackets
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/scoring/standalone">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Quick Match
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Start a standalone match without creating a full tournament
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/settings">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Update your profile and preferences
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
