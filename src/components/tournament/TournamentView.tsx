
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams } from 'react-router-dom';
import { useTournament } from '@/contexts/tournament/useTournament';
import TournamentHeader from './TournamentHeader';
import OverviewTab from './tabs/OverviewTab';
import TeamsTab from './tabs/TeamsTab';
import MatchesTab from './tabs/MatchesTab';
import CourtsTab from './tabs/CourtsTab';
import BracketTab from './tabs/BracketTab';

export const TournamentView = () => {
  const { id } = useParams();
  const { tournament, isLoading } = useTournament(id);

  if (isLoading) {
    return <div className="container p-6">Loading tournament...</div>;
  }

  if (!tournament) {
    return <div className="container p-6">Tournament not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <TournamentHeader tournament={tournament} />
      
      <div className="container px-4">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-card/50 backdrop-blur">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="courts">Courts</TabsTrigger>
            <TabsTrigger value="bracket">Bracket</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <OverviewTab tournament={tournament} />
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <TeamsTab tournament={tournament} />
          </TabsContent>

          <TabsContent value="matches" className="space-y-4">
            <MatchesTab tournament={tournament} />
          </TabsContent>

          <TabsContent value="courts" className="space-y-4">
            <CourtsTab tournament={tournament} />
          </TabsContent>

          <TabsContent value="bracket" className="space-y-4">
            <BracketTab tournament={tournament} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TournamentView;
