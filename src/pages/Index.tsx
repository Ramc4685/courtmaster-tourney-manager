
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Trophy, Clipboard, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="container py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">CourtMaster</h1>
        <p className="mt-3 text-xl text-muted-foreground">
          Badminton Tournament Management & Scoring
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Tournament Management Card */}
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
              Go to Tournaments <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* Quick Match Scoring Card */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="rounded-full bg-court-green/10 w-12 h-12 flex items-center justify-center mb-2">
              <Clipboard className="h-6 w-6 text-court-green" />
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
              className="w-full bg-court-green hover:bg-court-green/90" 
              onClick={() => navigate('/quick-match')}
            >
              Create Quick Match <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Index;
