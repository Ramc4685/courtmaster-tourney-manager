
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { useTournament } from '@/contexts/TournamentContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const Home = () => {
  const { tournaments } = useTournament();

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <PageHeader
          title="CourtMaster - Badminton Tournament Manager"
          description="Create and manage badminton tournaments with live scoring and court management"
        />

        <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Create Tournament</CardTitle>
              <CardDescription>Start a new badminton tournament</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p>Set up a new tournament with custom settings, teams, and matches.</p>
            </CardContent>
            <CardFooter>
              <Link to="/tournament/create">
                <Button>Create New Tournament</Button>
              </Link>
            </CardFooter>
          </Card>

          {tournaments && tournaments.length > 0 && tournaments.map((tournament) => (
            <Card key={tournament.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{tournament.name}</CardTitle>
                <CardDescription>
                  {tournament.status} • {tournament.teams.length} Teams
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p>{tournament.description || 'No description available'}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Start Date: {new Date(tournament.startDate).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link to={`/tournament/${tournament.id}`}>
                  <Button variant="outline">Manage</Button>
                </Link>
                <Link to={`/scoring/${tournament.id}`}>
                  <Button>Score Matches</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Public View</CardTitle>
              <CardDescription>View tournament information</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p>Access the public view of tournament standings and match results.</p>
            </CardContent>
            <CardFooter>
              <Link to="/public">
                <Button variant="outline">Open Public View</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Live Scoring</CardTitle>
              <CardDescription>Real-time match updates</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p>Watch live scoring updates for ongoing matches.</p>
            </CardContent>
            <CardFooter>
              <Link to="/public-live">
                <Button variant="outline">View Live Scoring</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
