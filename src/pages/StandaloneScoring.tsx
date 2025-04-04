
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ScoringContainer from '@/components/scoring/ScoringContainer';
import PageHeader from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Match, Division, TournamentStage, TournamentCategory, CategoryType } from '@/types/tournament';
import { useNavigate } from 'react-router-dom';

const StandaloneScoring = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [teamOneName, setTeamOneName] = useState('Team 1');
  const [teamTwoName, setTeamTwoName] = useState('Team 2');
  
  // Sample match for quick standalone scoring
  const createQuickMatch = () => {
    const newMatch: Match = {
      id: `standalone-${Date.now()}`,
      team1: {
        id: `team1-${Date.now()}`,
        name: teamOneName,
        players: [
          { id: `player1-${Date.now()}`, name: `${teamOneName} Player 1` },
          { id: `player2-${Date.now()}`, name: `${teamOneName} Player 2` }
        ]
      },
      team2: {
        id: `team2-${Date.now()}`,
        name: teamTwoName,
        players: [
          { id: `player1-${Date.now()}`, name: `${teamTwoName} Player 1` },
          { id: `player2-${Date.now()}`, name: `${teamTwoName} Player 2` }
        ]
      },
      scores: [],
      status: 'SCHEDULED',
      division: 'INITIAL' as Division,  // Using 'INITIAL' instead of 'EXHIBITION'
      tournamentId: 'standalone',
      stage: 'INITIAL_ROUND' as TournamentStage,  // Using 'INITIAL_ROUND' instead of 'EXHIBITION'
      category: {
        id: 'default',
        name: 'Default Category',
        type: 'MENS_SINGLES' as CategoryType
      } as TournamentCategory
    };

    toast({
      title: "Match created",
      description: "You can now start scoring this match."
    });
    
    // Navigate to the scoring screen with the match ID
    navigate(`/scoring/standalone/${newMatch.id}`);
  };

  return (
    <ScoringContainer>
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
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Quick Match Setup</h3>
              
              <div className="space-y-4">
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
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card className="p-6">
              <div className="text-center py-8 text-gray-500">
                <p>No previous standalone matches found</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScoringContainer>
  );
};

export default StandaloneScoring;
