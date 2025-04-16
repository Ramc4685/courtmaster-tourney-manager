
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Trophy, Clipboard, Users } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="container py-12">
      <div className="text-center mb-12 max-w-3xl mx-auto">
        <Trophy className="h-16 w-16 mx-auto mb-4 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight mb-4">CourtMaster</h1>
        <p className="text-xl text-muted-foreground">
          All-in-one Tournament Management & Scoring System for Badminton Events
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Button 
            size="lg"
            onClick={() => navigate('/tournaments')}
            className="px-6"
          >
            Browse Tournaments
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate('/login')}
            className="px-6"
          >
            Sign In
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
        <div className="text-center p-4">
          <div className="rounded-full bg-primary/10 w-14 h-14 flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">Tournament Management</h3>
          <p className="text-muted-foreground">Create and manage full tournaments with customizable formats</p>
        </div>
        
        <div className="text-center p-4">
          <div className="rounded-full bg-primary/10 w-14 h-14 flex items-center justify-center mx-auto mb-4">
            <Clipboard className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">Real-time Scoring</h3>
          <p className="text-muted-foreground">Score matches in real-time with our intuitive interface</p>
        </div>
        
        <div className="text-center p-4">
          <div className="rounded-full bg-primary/10 w-14 h-14 flex items-center justify-center mx-auto mb-4">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">Player Registration</h3>
          <p className="text-muted-foreground">Streamlined registration process for participants</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-2">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Tournament Management</CardTitle>
            <CardDescription>
              Create and manage full badminton tournaments with brackets, scheduling and more
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-2">
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Create tournaments with multiple categories</li>
              <li>Manage teams, courts and schedules</li>
              <li>Track scores and generate brackets</li>
              <li>View comprehensive tournament statistics</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => navigate('/tournaments')}
            >
              Explore Tournaments
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="rounded-full bg-green-500/10 w-12 h-12 flex items-center justify-center mb-2">
              <Clipboard className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle>Quick Match Scoring</CardTitle>
            <CardDescription>
              Create standalone matches for immediate scoring without tournament context
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-2">
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Create matches with simple team/player entry</li>
              <li>Score matches in real-time</li>
              <li>Share match scores via public links</li>
              <li>No tournament setup required</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-green-500 hover:bg-green-600" 
              onClick={() => navigate('/quick-match')}
            >
              Create Quick Match
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Home;
