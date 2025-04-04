
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ScoringContainer from '@/components/scoring/ScoringContainer';
import PageHeader from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useStandaloneMatchStore } from '@/stores/standaloneMatchStore';

const StandaloneScoring = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [teamOneName, setTeamOneName] = useState('Team 1');
  const [teamTwoName, setTeamTwoName] = useState('Team 2');
  const standaloneMatchStore = useStandaloneMatchStore();
  
  // Create a quick standalone match
  const createQuickMatch = () => {
    const newMatch = standaloneMatchStore.createMatch({
      team1: { name: teamOneName },
      team2: { name: teamTwoName }
    });

    if (newMatch) {
      toast({
        title: "Match created",
        description: "You can now start scoring this match."
      });
      
      // Navigate to the scoring screen with the match ID
      navigate(`/scoring/standalone/${newMatch.id}`);
    } else {
      toast({
        title: "Error creating match",
        description: "Could not create a standalone match.",
        variant: "destructive"
      });
    }
  };

  // Get existing standalone matches
  const matches = standaloneMatchStore.matches;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <PageHeader
          title="Standalone Match Scoring"
          description="Score matches that aren't part of a tournament"
        />
        
        <Tabs defaultValue="quick" className="space-y-4">
          <TabsList>
            <TabsTrigger value="quick">Quick Match</TabsTrigger>
            <TabsTrigger value="history">Match History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="quick" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Match Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Team 1 Name</label>
                  <Input 
                    value={teamOneName} 
                    onChange={(e) => setTeamOneName(e.target.value)}
                    placeholder="Enter team 1 name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Team 2 Name</label>
                  <Input 
                    value={teamTwoName} 
                    onChange={(e) => setTeamTwoName(e.target.value)}
                    placeholder="Enter team 2 name"
                  />
                </div>
                
                <Button 
                  onClick={createQuickMatch} 
                  className="w-full"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create and Start Scoring
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Match History</CardTitle>
              </CardHeader>
              <CardContent>
                {matches.length > 0 ? (
                  <div className="space-y-4">
                    {matches.map(match => (
                      <Card key={match.id} className="bg-gray-50">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">
                                {match.team1?.name || 'Team 1'} vs {match.team2?.name || 'Team 2'}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Status: {match.status}
                              </p>
                            </div>
                            <Button
                              onClick={() => navigate(`/scoring/standalone/${match.id}`)}
                              variant="outline"
                            >
                              View / Score
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No previous standalone matches found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StandaloneScoring;
