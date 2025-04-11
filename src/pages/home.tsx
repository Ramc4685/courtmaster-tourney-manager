
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Badminton Tournament Manager</h1>
        <p className="text-xl text-center text-muted-foreground mb-12">
          Schedule, manage, and track badminton tournaments with ease
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Create Tournament</CardTitle>
              <CardDescription>Start a new tournament with custom settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/tournament/create')} 
                className="w-full"
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Match</CardTitle>
              <CardDescription>Create a standalone match for scoring</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/match/create')} 
                variant="outline" 
                className="w-full"
              >
                New Match
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard 
              title="Tournament Management" 
              description="Create and manage tournaments with various formats including single elimination, round robin, and more."
            />
            <FeatureCard 
              title="Real-time Scoring" 
              description="Track scores in real-time with an intuitive scoring interface."
            />
            <FeatureCard 
              title="Brackets & Scheduling" 
              description="Automated bracket generation and match scheduling."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{title: string; description: string}> = ({
  title,
  description
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

export default Home;
