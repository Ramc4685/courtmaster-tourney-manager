
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournament } from '@/contexts/tournament/useTournament';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Gauge, List } from 'lucide-react'; // Changed Court to Gauge
import ScoringContainer from '@/components/scoring/ScoringContainer';
import CourtSelectionPanel from '@/components/scoring/CourtSelectionPanel';
import ScheduledMatchesList from '@/components/scoring/ScheduledMatchesList';
import TournamentScoring from '@/components/scoring/TournamentScoring';
import PageHeader from '@/components/shared/PageHeader';

const Scoring = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { tournaments, setCurrentTournament, currentTournament, updateMatch, completeMatch } = useTournament();
  const [activeTab, setActiveTab] = useState('courts');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Find the tournament and set it as current
  useEffect(() => {
    const loadTournament = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (!tournamentId) {
          // If no tournament ID is provided, redirect to the tournament list
          if (tournaments.length > 0) {
            navigate(`/scoring/${tournaments[0].id}`);
            return;
          } else {
            setError('No tournament selected. Please select a tournament to score matches.');
          }
        } else {
          // Find the tournament by ID
          const tournament = tournaments.find(t => t.id === tournamentId);
          
          if (!tournament) {
            setError(`Tournament with ID ${tournamentId} not found.`);
          } else {
            await setCurrentTournament(tournament);
            console.log(`Loaded tournament: ${tournament.name}`);
          }
        }
      } catch (err) {
        console.error('Error loading tournament:', err);
        setError('Failed to load tournament data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTournament();
  }, [tournamentId, tournaments, setCurrentTournament, navigate]);

  // If we're still loading or have an error, show the container with appropriate state
  if (isLoading || error || !currentTournament) {
    return <ScoringContainer isLoading={isLoading} errorMessage={error || 'No tournament selected'} />;
  }

  return (
    <ScoringContainer>
      <div className="space-y-6">
        <PageHeader
          title="Tournament Scoring"
          description={currentTournament.name}
          action={
            <Link to="/tournaments">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tournaments
              </Button>
            </Link>
          }
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="courts" className="flex items-center">
              <Gauge className="mr-2 h-4 w-4" /> {/* Changed Court to Gauge */}
              <span>Courts</span>
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              <span>Scheduled</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center">
              <List className="mr-2 h-4 w-4" />
              <span>All Matches</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="courts" className="space-y-4">
            <CourtSelectionPanel 
              courts={currentTournament.courts || []}
              matches={currentTournament.matches || []}
            />
          </TabsContent>
          
          <TabsContent value="scheduled" className="space-y-4">
            <ScheduledMatchesList 
              matches={currentTournament.matches?.filter(m => m.status === 'SCHEDULED') || []}
            />
          </TabsContent>
          
          <TabsContent value="all" className="space-y-4">
            <TournamentScoring 
              tournamentId={currentTournament.id}
            />
          </TabsContent>
        </Tabs>
        
        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to={`/tournament/${currentTournament.id}`}>
            <Card className="p-6 hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-4">
                <ArrowLeft className="h-6 w-6" />
                <div>
                  <h3 className="font-medium">Tournament Details</h3>
                  <p className="text-sm text-muted-foreground">
                    Return to tournament management
                  </p>
                </div>
              </div>
            </Card>
          </Link>
          
          <Link to="/scoring/standalone">
            <Card className="p-6 hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-4">
                <Clock className="h-6 w-6" />
                <div>
                  <h3 className="font-medium">Quick Match</h3>
                  <p className="text-sm text-muted-foreground">
                    Score a standalone match
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </ScoringContainer>
  );
};

export default Scoring;
