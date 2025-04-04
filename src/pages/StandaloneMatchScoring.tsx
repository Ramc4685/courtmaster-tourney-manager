import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScoringAdapter } from '@/hooks/scoring/useScoringAdapter';
import ScoringContainer from '@/components/scoring/ScoringContainer';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const StandaloneMatchScoring = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  
  // Use the scoring adapter hook with standalone mode
  const scoringLogic = useScoringAdapter({ 
    scorerType: "STANDALONE",
    matchId: matchId || undefined
  });

  // Get the current match from the scoring logic
  const match = scoringLogic.selectedMatch;

  if (!matchId) {
    return (
      <ScoringContainer>
        <div className="space-y-4">
          <PageHeader
            title="Error"
            description="No match ID provided"
          />
          <Button onClick={() => navigate('/scoring/standalone')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quick Match
          </Button>
        </div>
      </ScoringContainer>
    );
  }

  if (!match) {
    return (
      <ScoringContainer>
        <div className="space-y-4">
          <PageHeader
            title="Error"
            description={`Match with ID ${matchId} not found`}
          />
          <Button onClick={() => navigate('/scoring/standalone')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quick Match
          </Button>
        </div>
      </ScoringContainer>
    );
  }

  return (
    <ScoringContainer>
      <div className="space-y-6">
        <PageHeader
          title="Standalone Match Scoring"
          description={`${match.team1?.name || 'TBD'} vs ${match.team2?.name || 'TBD'}`}
        />
        
        {/* Add your scoring interface components here */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Team 1: {match.team1?.name || 'TBD'}</h3>
            <div className="space-y-2">
              {match.team1?.players?.map(player => (
                <div key={player.id} className="text-sm">
                  {player.name}
                </div>
              )) || <div className="text-sm">No players</div>}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Team 2: {match.team2?.name || 'TBD'}</h3>
            <div className="space-y-2">
              {match.team2?.players?.map(player => (
                <div key={player.id} className="text-sm">
                  {player.name}
                </div>
              )) || <div className="text-sm">No players</div>}
            </div>
          </div>
        </div>
        
        <Button onClick={() => navigate('/scoring/standalone')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quick Match
        </Button>
      </div>
    </ScoringContainer>
  );
};

export default StandaloneMatchScoring; 