
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTournament } from '@/contexts/tournament/useTournament';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock, Gauge, List } from 'lucide-react';
import ScoringContainer from '@/components/scoring/ScoringContainer';
import CourtSelectionPanel from '@/components/scoring/CourtSelectionPanel';
import ScheduledMatchesList from '@/components/scoring/ScheduledMatchesList';
import TournamentScoring from '@/components/scoring/TournamentScoring';
import PageHeader from '@/components/shared/PageHeader';
import LiveVideoLink from '@/components/shared/LiveVideoLink';
import { useScoringLogic } from '@/hooks/scoring/useScoringLogic';
import { useToast } from '@/hooks/use-toast';

// Define a type adapter for the activeView type
type TournamentScoringViewAdapter = "scoring" | "courts";

const Scoring = () => {
  const { tournamentId, matchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tournaments, setCurrentTournament, currentTournament, initializeScoring } = useTournament();
  const [activeTab, setActiveTab] = useState('courts');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use the scoring logic hook to handle scoring operations
  const scoringLogic = useScoringLogic();

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
            
            // If a matchId is provided, initialize scoring for that match
            if (matchId) {
              console.log(`Match ID provided: ${matchId}, initializing scoring`);
              setActiveTab('all'); // Switch to the "All Matches" tab where TournamentScoring is located
              
              const match = await initializeScoring(matchId);
              if (match) {
                console.log(`Match initialized, ID: ${match.id}`);
                // The scoring logic will initialize the match
                scoringLogic.handleSelectMatch(match);
                scoringLogic.setActiveView("scoring");
              } else {
                toast({
                  title: "Match Not Found",
                  description: `Could not find or initialize match with ID ${matchId}`,
                  variant: "destructive"
                });
              }
            }
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
  }, [tournamentId, matchId, tournaments, setCurrentTournament, navigate, initializeScoring, scoringLogic, toast]);

  // Handle selecting a court
  const handleCourtSelect = (court) => {
    scoringLogic.handleSelectCourt(court);
  };

  // Handle selecting a match
  const handleMatchSelect = (match) => {
    scoringLogic.handleSelectMatch(match);
  };

  // Handle starting a match
  const handleStartMatch = (match) => {
    scoringLogic.handleStartMatch(match);
  };

  // Create an adapter function for score changes to match the expected signature
  const handleScoreChangeAdapter = (team1Score: number, team2Score: number) => {
    // The adapter converts from the TournamentScoring expected format to the scoring logic format
    // This is a simplified adapter that increments team1 score
    // In a real implementation, you would compare with previous scores to determine which team to increment
    const currentScores = scoringLogic.selectedMatch?.scores[scoringLogic.currentSet] || { team1Score: 0, team2Score: 0 };
    
    if (team1Score > currentScores.team1Score) {
      scoringLogic.handleScoreChange("team1", true);
    } else if (team1Score < currentScores.team1Score) {
      scoringLogic.handleScoreChange("team1", false);
    }
    
    if (team2Score > currentScores.team2Score) {
      scoringLogic.handleScoreChange("team2", true);
    } else if (team2Score < currentScores.team2Score) {
      scoringLogic.handleScoreChange("team2", false);
    }
  };

  // Create an adapter function for setActiveView to match the expected signature
  const setActiveViewAdapter = (view: TournamentScoringViewAdapter) => {
    // Convert from TournamentScoring's view type to scoring logic's view type
    scoringLogic.setActiveView(view);
  };

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

        {/* Add Live Video Link */}
        <div className="mb-4">
          <LiveVideoLink tournamentId={tournamentId} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="courts" className="flex items-center">
              <Gauge className="mr-2 h-4 w-4" />
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
              onCourtSelect={handleCourtSelect}
              onMatchSelect={handleMatchSelect}
              onStartMatch={handleStartMatch}
            />
          </TabsContent>
          
          <TabsContent value="scheduled" className="space-y-4">
            <ScheduledMatchesList 
              matches={currentTournament.matches?.filter(m => m.status === 'SCHEDULED') || []}
              onStartMatch={handleStartMatch}
            />
          </TabsContent>
          
          <TabsContent value="all" className="space-y-4">
            <TournamentScoring 
              currentTournament={currentTournament}
              tournamentId={currentTournament.id}
              activeView={scoringLogic.activeView}
              selectedMatch={scoringLogic.selectedMatch}
              currentSet={scoringLogic.currentSet}
              setCurrentSet={scoringLogic.setCurrentSet}
              settingsOpen={scoringLogic.settingsOpen}
              setSettingsOpen={scoringLogic.setSettingsOpen}
              scoringSettings={scoringLogic.scoringSettings}
              newSetDialogOpen={scoringLogic.newSetDialogOpen}
              setNewSetDialogOpen={scoringLogic.setNewSetDialogOpen}
              completeMatchDialogOpen={scoringLogic.completeMatchDialogOpen}
              setCompleteMatchDialogOpen={scoringLogic.setCompleteMatchDialogOpen}
              onSelectMatch={scoringLogic.handleSelectMatch}
              onSelectCourt={scoringLogic.handleSelectCourt}
              courts={currentTournament.courts || []}
              onScoreChange={handleScoreChangeAdapter}
              onNewSet={scoringLogic.handleNewSet}
              onCompleteMatch={scoringLogic.handleCompleteMatch}
              setActiveView={setActiveViewAdapter}
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
