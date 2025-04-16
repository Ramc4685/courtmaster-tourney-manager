import React from 'react';
import { Tournament, Match, Team } from '@/types/tournament';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MatchStatus } from '@/types/tournament-enums';

interface TournamentBracketProps {
  tournament: Tournament;
  division?: string;
  onUpdate?: (tournament: Tournament) => Promise<void>;
}

interface BracketMatchProps {
  match: Match;
  isLastRound: boolean;
}

const BracketMatch: React.FC<BracketMatchProps> = ({ match, isLastRound }) => {
  const getTeamDisplay = (team: Team | null) => {
    if (!team || team.id === 'TBD') return 'TBD';
    return team.name;
  };

  const getMatchStatusColor = () => {
    switch (match.status) {
      case MatchStatus.COMPLETED:
        return 'border-green-500';
      case MatchStatus.IN_PROGRESS:
        return 'border-blue-500';
      case MatchStatus.READY:
        return 'border-yellow-500';
      default:
        return 'border-gray-200';
    }
  };

  return (
    <div className={`flex flex-col p-2 border-2 rounded-md mb-4 ${getMatchStatusColor()}`}>
      <div className={`flex justify-between items-center p-1 ${match.winner?.id === match.team1?.id ? 'bg-green-100' : ''}`}>
        <span>{getTeamDisplay(match.team1)}</span>
        <span className="ml-2">{match.scores?.[0]?.team1Score || 0}</span>
      </div>
      <div className={`flex justify-between items-center p-1 ${match.winner?.id === match.team2?.id ? 'bg-green-100' : ''}`}>
        <span>{getTeamDisplay(match.team2)}</span>
        <span className="ml-2">{match.scores?.[0]?.team2Score || 0}</span>
      </div>
      {!isLastRound && (
        <div className="absolute h-full border-r-2 border-gray-300" style={{ left: '100%', top: '50%' }} />
      )}
    </div>
  );
};

const TournamentBracket: React.FC<TournamentBracketProps> = ({ tournament, division, onUpdate }) => {
  // Group matches by round
  const matchesByRound = React.useMemo(() => {
    const filteredMatches = tournament.matches
      .filter(m => !division || m.division === division)
      .reduce((rounds, match) => {
        const round = match.bracketRound || 1;
        if (!rounds[round]) rounds[round] = [];
        rounds[round].push(match);
        return rounds;
      }, {} as Record<number, Match[]>);

    // Sort matches within each round by bracket position
    Object.values(filteredMatches).forEach(matches => {
      matches.sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0));
    });

    return filteredMatches;
  }, [tournament.matches, division]);

  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

  return (
    <Card className="w-full overflow-x-auto">
      <CardHeader>
        <CardTitle>Tournament Bracket</CardTitle>
        <CardDescription>
          {division ? `${division} Division` : 'All Divisions'} - {rounds.length} Rounds
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-8 p-4 min-w-[800px]">
          {rounds.map((round, roundIndex) => (
            <div 
              key={round} 
              className="flex flex-col justify-around"
              style={{ 
                gap: `${100 / Math.pow(2, roundIndex)}%`,
                flex: '1 0 200px'
              }}
            >
              <div className="text-center font-medium mb-4">
                Round {round}
              </div>
              {matchesByRound[round].map((match) => (
                <BracketMatch 
                  key={match.id} 
                  match={match}
                  isLastRound={roundIndex === rounds.length - 1}
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TournamentBracket;
