
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Users, Award, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold">Welcome to CourtMaster</h1>
        <p className="text-xl text-muted-foreground">
          Your comprehensive tournament management system
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarDays className="h-5 w-5 mr-2 text-primary" />
                Tournaments
              </CardTitle>
              <CardDescription>Manage your tournaments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Create and manage tournaments with flexible formats.</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/tournaments">View Tournaments</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                Players
              </CardTitle>
              <CardDescription>Manage players and teams</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Register players and teams for your tournaments.</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/players">View Players</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-primary" />
                Scores
              </CardTitle>
              <CardDescription>Track match results</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Record and manage match scores in real-time.</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/scoring">View Scoring</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-primary" />
                Settings
              </CardTitle>
              <CardDescription>Configure your account</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Customize your tournament management experience.</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/settings">View Settings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
