import React from 'react';
import { useTournament } from '@/contexts/tournament/useTournament';
import { TournamentFormat } from '@/types/tournament';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Calendar, Users, Activity, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const tournament = useTournament();
  
  // Create a wrapper function for loadSampleData
  const handleLoadSample = async (format?: TournamentFormat) => {
    try {
      await tournament.loadSampleData(format);
    } catch (error) {
      console.error("Failed to load sample data", error);
    }
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Tournament Manager</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="mr-2 h-5 w-5" />
              Quick Start
            </CardTitle>
            <CardDescription>
              Create a new tournament or load sample data to get started quickly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>New to the app? Load a sample tournament to explore the features:</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleLoadSample("SINGLE_ELIMINATION")} variant="outline" size="sm">
                Single Elimination
              </Button>
              <Button onClick={() => handleLoadSample("DOUBLE_ELIMINATION")} variant="outline" size="sm">
                Double Elimination
              </Button>
              <Button onClick={() => handleLoadSample("ROUND_ROBIN")} variant="outline" size="sm">
                Round Robin
              </Button>
              <Button onClick={() => handleLoadSample("GROUP_KNOCKOUT")} variant="outline" size="sm">
                Group + Knockout
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Link to="/tournaments/new">
              <Button className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Tournament
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your recent tournaments and matches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tournament.tournaments.length > 0 ? (
              <ul className="space-y-2">
                {tournament.tournaments.slice(0, 3).map(t => (
                  <li key={t.id} className="border-b pb-2">
                    <Link to={`/tournaments/${t.id}`} className="hover:underline">
                      <span className="font-medium">{t.name}</span>
                    </Link>
                    <div className="text-sm text-gray-500">
                      {t.matches.length} matches • {t.teams.length} teams
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No recent tournaments. Create one to get started!</p>
            )}
          </CardContent>
          <CardFooter>
            <Link to="/tournaments" className="w-full">
              <Button variant="outline" className="w-full">View All Tournaments</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
      
      <Tabs defaultValue="tournaments" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="tournaments">
            <Trophy className="mr-2 h-4 w-4" />
            Tournaments
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="teams">
            <Users className="mr-2 h-4 w-4" />
            Teams
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tournaments">
          <Card>
            <CardHeader>
              <CardTitle>Your Tournaments</CardTitle>
              <CardDescription>
                Manage your tournaments and create new ones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tournament.tournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tournament.tournaments.map(t => (
                    <Card key={t.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{t.name}</CardTitle>
                        <CardDescription>{t.format}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="text-sm">
                          <div>Teams: {t.teams.length}</div>
                          <div>Matches: {t.matches.length}</div>
                          <div>Status: {t.status}</div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Link to={`/tournaments/${t.id}`} className="w-full">
                          <Button variant="outline" size="sm" className="w-full">
                            View Details
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No tournaments found. Create your first tournament!</p>
                  <Link to="/tournaments/new">
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Tournament
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Matches</CardTitle>
              <CardDescription>
                View and manage your scheduled matches.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tournament.currentTournament ? (
                tournament.currentTournament.matches.filter(m => m.status === "SCHEDULED").length > 0 ? (
                  <div className="space-y-4">
                    {tournament.currentTournament.matches
                      .filter(m => m.status === "SCHEDULED")
                      .slice(0, 5)
                      .map(match => (
                        <div key={match.id} className="flex justify-between items-center p-3 border rounded">
                          <div>
                            <div className="font-medium">{match.team1.name} vs {match.team2.name}</div>
                            <div className="text-sm text-gray-500">
                              Court: {match.courtNumber || 'Not assigned'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">
                              {match.scheduledTime ? new Date(match.scheduledTime).toLocaleString() : 'Not scheduled'}
                            </div>
                            <div className="text-xs text-gray-500">{match.division}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No scheduled matches found.</p>
                )
              ) : (
                <p className="text-gray-500 text-center py-4">Select a tournament to view scheduled matches.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
              <CardDescription>
                View and manage teams across your tournaments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tournament.currentTournament ? (
                tournament.currentTournament.teams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {tournament.currentTournament.teams.slice(0, 9).map(team => (
                      <div key={team.id} className="p-3 border rounded">
                        <div className="font-medium">{team.name}</div>
                        <div className="text-sm text-gray-500">
                          {team.players.length} players
                          {team.seed && ` • Seed: ${team.seed}`}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No teams found in the current tournament.</p>
                )
              ) : (
                <p className="text-gray-500 text-center py-4">Select a tournament to view teams.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Home;
