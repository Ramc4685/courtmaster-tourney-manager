import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Trophy,
  Users,
  Calendar,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Crown
} from 'lucide-react';

interface BracketMatch {
  id: string;
  player1?: string;
  player2?: string;
  player1Score?: number;
  player2Score?: number;
  winner?: string;
  status: 'upcoming' | 'live' | 'completed';
  round: number;
  position: number;
  scheduledTime?: string;
  court?: string;
}

interface TournamentBracket {
  id: string;
  name: string;
  format: 'single-elimination' | 'double-elimination' | 'round-robin';
  rounds: number;
  matches: BracketMatch[];
}

interface TournamentBracketPublicProps {
  tournamentId: string;
  division?: string;
  showControls?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const TournamentBracketPublic: React.FC<TournamentBracketPublicProps> = ({
  tournamentId,
  division,
  showControls = true,
  autoRefresh = true,
  refreshInterval = 30000
}) => {
  const [bracket, setBracket] = useState<TournamentBracket | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>(division || 'main');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Mock bracket data
  const mockBracket: TournamentBracket = {
    id: tournamentId,
    name: 'Main Division',
    format: 'single-elimination',
    rounds: 4,
    matches: [
      // Round 1
      { id: '1', player1: 'John Smith', player2: 'Mike Johnson', winner: 'John Smith', status: 'completed', round: 1, position: 1, player1Score: 6, player2Score: 3 },
      { id: '2', player1: 'Sarah Davis', player2: 'Emma Wilson', winner: 'Sarah Davis', status: 'completed', round: 1, position: 2, player1Score: 6, player2Score: 4 },
      { id: '3', player1: 'Alex Brown', player2: 'Chris Taylor', status: 'live', round: 1, position: 3, player1Score: 4, player2Score: 2, court: 'Court 3' },
      { id: '4', player1: 'Lisa Anderson', player2: 'Tom Wilson', winner: 'Lisa Anderson', status: 'completed', round: 1, position: 4, player1Score: 6, player2Score: 2 },
      { id: '5', player1: 'David Lee', player2: 'Mark Garcia', status: 'upcoming', round: 1, position: 5, scheduledTime: '2024-01-15T16:00:00Z' },
      { id: '6', player1: 'Jessica Rodriguez', player2: 'Kevin Martinez', status: 'upcoming', round: 1, position: 6, scheduledTime: '2024-01-15T16:15:00Z' },
      { id: '7', player1: 'Ryan Moore', player2: 'Ashley White', status: 'upcoming', round: 1, position: 7, scheduledTime: '2024-01-15T16:30:00Z' },
      { id: '8', player1: 'Nicole Thompson', player2: 'James Clark', status: 'upcoming', round: 1, position: 8, scheduledTime: '2024-01-15T16:45:00Z' },

      // Round 2 (Quarterfinals)
      { id: '9', player1: 'John Smith', player2: 'Sarah Davis', status: 'upcoming', round: 2, position: 1, scheduledTime: '2024-01-15T17:00:00Z' },
      { id: '10', player1: 'TBD', player2: 'Lisa Anderson', status: 'upcoming', round: 2, position: 2 },
      { id: '11', player1: 'TBD', player2: 'TBD', status: 'upcoming', round: 2, position: 3 },
      { id: '12', player1: 'TBD', player2: 'TBD', status: 'upcoming', round: 2, position: 4 },

      // Round 3 (Semifinals)
      { id: '13', player1: 'TBD', player2: 'TBD', status: 'upcoming', round: 3, position: 1 },
      { id: '14', player1: 'TBD', player2: 'TBD', status: 'upcoming', round: 3, position: 2 },

      // Round 4 (Final)
      { id: '15', player1: 'TBD', player2: 'TBD', status: 'upcoming', round: 4, position: 1 }
    ]
  };

  useEffect(() => {
    fetchBracket();
  }, [tournamentId, selectedDivision]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchBracket();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const fetchBracket = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setBracket(mockBracket);
    } catch (error) {
      console.error('Error fetching bracket:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMatchesByRound = (round: number) => {
    return bracket?.matches.filter(match => match.round === round) || [];
  };

  const getMatchStatus = (match: BracketMatch) => {
    switch (match.status) {
      case 'live': return <Badge className="bg-green-100 text-green-800 animate-pulse">LIVE</Badge>;
      case 'completed': return <Badge variant="secondary">Completed</Badge>;
      case 'upcoming': return <Badge variant="outline">Upcoming</Badge>;
      default: return null;
    }
  };

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Semifinals';
    if (round === totalRounds - 2) return 'Quarterfinals';
    return `Round ${round}`;
  };

  const getWinnerDisplay = (match: BracketMatch) => {
    if (match.winner) {
      return (
        <div className="text-center p-2 bg-green-50 border border-green-200 rounded">
          <div className="flex items-center justify-center space-x-1">
            <Crown className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-green-800">{match.winner}</span>
          </div>
          {match.player1Score !== undefined && match.player2Score !== undefined && (
            <div className="text-xs text-green-600 mt-1">
              {match.winner === match.player1 ? `${match.player1Score}-${match.player2Score}` : `${match.player2Score}-${match.player1Score}`}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderMatch = (match: BracketMatch) => {
    return (
      <Card key={match.id} className={`mb-2 ${match.status === 'live' ? 'border-green-300 bg-green-50' : ''}`}>
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Match {match.id}</span>
              {getMatchStatus(match)}
            </div>

            {match.status === 'completed' && match.winner ? (
              getWinnerDisplay(match)
            ) : (
              <div className="space-y-1">
                {/* Player 1 */}
                <div className={`flex items-center justify-between p-2 rounded border ${
                  match.winner === match.player1 ? 'bg-green-100 border-green-300' : 'bg-gray-50'
                }`}>
                  <span className={`text-sm ${match.winner === match.player1 ? 'font-bold' : ''}`}>
                    {match.player1 || 'TBD'}
                  </span>
                  {match.player1Score !== undefined && (
                    <span className="font-bold">{match.player1Score}</span>
                  )}
                </div>

                {/* Player 2 */}
                <div className={`flex items-center justify-between p-2 rounded border ${
                  match.winner === match.player2 ? 'bg-green-100 border-green-300' : 'bg-gray-50'
                }`}>
                  <span className={`text-sm ${match.winner === match.player2 ? 'font-bold' : ''}`}>
                    {match.player2 || 'TBD'}
                  </span>
                  {match.player2Score !== undefined && (
                    <span className="font-bold">{match.player2Score}</span>
                  )}
                </div>
              </div>
            )}

            {/* Match Details */}
            {(match.scheduledTime || match.court) && (
              <div className="text-xs text-muted-foreground space-y-1">
                {match.scheduledTime && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(match.scheduledTime).toLocaleString()}</span>
                  </div>
                )}
                {match.court && (
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{match.court}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoomLevel(prev => {
      const newLevel = direction === 'in' ? Math.min(prev + 20, 200) : Math.max(prev - 20, 60);
      return newLevel;
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading tournament bracket...</span>
        </CardContent>
      </Card>
    );
  }

  if (!bracket) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Bracket Not Available</h3>
          <p className="text-muted-foreground">
            The tournament bracket is not yet available or the tournament format doesn't support brackets.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-xl">Tournament Bracket</CardTitle>
                <p className="text-muted-foreground">
                  {bracket.name} • {bracket.format.replace('-', ' ')} Format
                </p>
              </div>
            </div>

            {showControls && (
              <div className="flex items-center space-x-2">
                <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Division</SelectItem>
                    <SelectItem value="consolation">Consolation</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-1 border rounded">
                  <Button variant="ghost" size="sm" onClick={() => handleZoom('out')}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs px-2">{zoomLevel}%</span>
                  <Button variant="ghost" size="sm" onClick={() => handleZoom('in')}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>

                <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                  <Maximize className="h-4 w-4" />
                </Button>

                <Button variant="outline" size="sm" onClick={fetchBracket}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Bracket Display */}
      <div
        className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white p-4 overflow-auto' : ''}`}
        style={{ fontSize: `${zoomLevel}%` }}
      >
        <div className="flex space-x-6 overflow-x-auto pb-4">
          {Array.from({ length: bracket.rounds }, (_, roundIndex) => {
            const roundNumber = roundIndex + 1;
            const matches = getMatchesByRound(roundNumber);

            return (
              <div key={roundNumber} className="flex-shrink-0">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-primary">
                    {getRoundName(roundNumber, bracket.rounds)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {matches.filter(m => m.status === 'completed').length}/{matches.length} completed
                  </p>
                </div>

                <div className="space-y-4" style={{ minWidth: '250px' }}>
                  {matches.map(renderMatch)}
                </div>
              </div>
            );
          })}
        </div>

        {isFullscreen && (
          <Button
            className="fixed top-4 right-4"
            onClick={() => setIsFullscreen(false)}
          >
            Exit Fullscreen
          </Button>
        )}
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span>Winner</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-100 text-green-800" size="sm">LIVE</Badge>
              <span>In Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" size="sm">Upcoming</Badge>
              <span>Scheduled</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" size="sm">Completed</Badge>
              <span>Finished</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};