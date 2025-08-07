import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { matchService, profileService, courtService } from '@/services/api';
import { Match, Profile, Court, MatchScores } from '@/types/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, isFuture } from 'date-fns';
import { CalendarDays, Clock, MapPin, BarChart2, Trophy, Percent, History } from 'lucide-react';
import { subscribeToMatches } from '@/lib/appwrite';
import { Badge } from "@/components/ui/badge";

const PlayerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [completedMatches, setCompletedMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [errorMatches, setErrorMatches] = useState<string | null>(null);
  const [profileMap, setProfileMap] = useState<Map<string, string>>(new Map());
  const [teamMap, setTeamMap] = useState<Map<string, string>>(new Map());
  const [courtMap, setCourtMap] = useState<Map<string, string>>(new Map());
  const [tournamentId, setTournamentId] = useState<string | null>(null);

  const fetchMatchesAndNames = useCallback(async () => {
    if (!user) {
      setUpcomingMatches([]);
      setCompletedMatches([]);
      return;
    }
    setIsLoadingMatches(true);
    setErrorMatches(null);
    try {
      const allMatches = await matchService.listMatches({});
      const playerMatches = allMatches.filter(m => 
        (m.player1_id === user.id || m.player2_id === user.id) ||
        false
      );

      const upcoming = playerMatches
        .filter(m => m.status === 'scheduled' && m.scheduled_time && isFuture(parseISO(m.scheduled_time)))
        .sort((a, b) => parseISO(a.scheduled_time!).getTime() - parseISO(b.scheduled_time!).getTime());
        
      const completed = playerMatches
        .filter(m => m.status === 'completed')
        .sort((a, b) => parseISO(b.end_time || b.updated_at).getTime() - parseISO(a.end_time || a.updated_at).getTime());

      setUpcomingMatches(upcoming);
      setCompletedMatches(completed);

      const allRelevantMatches = [...upcoming, ...completed];
      const playerIds = new Set<string>();
      const teamIds = new Set<string>();
      const courtIds = new Set<string>();
      allRelevantMatches.forEach(m => {
        if (m.player1_id) playerIds.add(m.player1_id);
        if (m.player2_id) playerIds.add(m.player2_id);
        if (m.team1_id) teamIds.add(m.team1_id);
        if (m.team2_id) teamIds.add(m.team2_id);
        if (m.court_id) courtIds.add(m.court_id);
      });

      const profilePromises = Array.from(playerIds).map(id => profileService.getProfile(id));
      const courtsPromise = courtService.listCourts(tournamentId);

      const [profilesResult, courtsResult] = await Promise.allSettled([
        Promise.all(profilePromises),
        courtsPromise
      ]);

      const newProfileMap = new Map<string, string>();
      if (profilesResult.status === 'fulfilled') {
        profilesResult.value.forEach(p => newProfileMap.set(p.id, p.display_name || p.full_name || p.email || 'Unknown Player'));
      } else {
        console.error("Failed to fetch some profiles:", profilesResult.reason);
      }
      setProfileMap(newProfileMap);
      
      const newCourtMap = new Map<string, string>();
      if (courtsResult.status === 'fulfilled') {
        courtsResult.value.forEach(c => newCourtMap.set(c.id, c.name));
      } else {
        console.error("Failed to fetch courts:", courtsResult.reason);
      }
      setCourtMap(newCourtMap);
      
    } catch (err) {
      console.error("Failed to fetch matches or names:", err);
      setErrorMatches(err instanceof Error ? err.message : 'Failed to load matches');
    } finally {
      setIsLoadingMatches(false);
    }
  }, [user, tournamentId]);

  useEffect(() => {
    fetchMatchesAndNames();
  }, [fetchMatchesAndNames]);

  useEffect(() => {
    if (!user) return;

    const handleMatchUpdate = (payload: RealtimePostgresChangesPayload<Match>) => {
      console.log('Player Dashboard: Match update received:', payload);
      const changedMatch = payload.new as Match;
      const oldMatch = payload.old as Partial<Match>;

      const isUserInvolved = 
        changedMatch.player1_id === user.id || 
        changedMatch.player2_id === user.id ||
        false;

      if (isUserInvolved) {
        console.log(`Match update relevant to user ${user.id}, refetching matches and names...`);
        fetchMatchesAndNames();
      }
    };

    // Subscribe to match updates using Appwrite
    const unsubscribe = subscribeToMatches((payload) => {
      console.log('Received match update payload:', payload);
      // Check if the update is relevant to the current user
      if (payload.events.some(event => 
        event.payload.player1_id === user.id || 
        event.payload.player2_id === user.id ||
        event.payload.team1_id === user.id ||
        event.payload.team2_id === user.id
      )) {
        console.log(`Match update relevant to user ${user.id}, refetching matches and names...`);
        fetchMatchesAndNames();
      }
    });

    // Initial fetch
    fetchMatchesAndNames();

    return () => {
      if (unsubscribe) {
        unsubscribe();
        console.log(`Unsubscribed from player ${user.id} match updates`);
      }
    };

  }, [user, fetchMatchesAndNames]);

  const renderOpponent = (match: Match) => {
     let opponentName = 'TBD';
     if (match.player1_id && match.player2_id) {
        const opponentId = match.player1_id === user?.id ? match.player2_id : match.player1_id;
        opponentName = profileMap.get(opponentId) || `Player ID: ${opponentId}`;
     } else if (match.team1_id && match.team2_id) {
        opponentName = 'Team Opponent';
     } 
     return opponentName;
  }

  const renderCourt = (courtId: string | null) => {
      if (!courtId) return 'Court TBD';
      return courtMap.get(courtId) || `Court ID: ${courtId}`;
  }

  const renderScore = (scores: MatchScores | null) => {
      if (!scores) return 'N/A';
      return scores.sets.map(s => `${s.team1}-${s.team2}`).join(', ');
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">My Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Matches</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingMatches && <div>Loading upcoming matches...</div>}
          {errorMatches && <div className="text-red-500">Error: {errorMatches}</div>}
          {!isLoadingMatches && !errorMatches && upcomingMatches.length === 0 && (
            <p>No upcoming matches scheduled.</p>
          )}
          {!isLoadingMatches && !errorMatches && upcomingMatches.length > 0 && (
            <ul className="space-y-4">
              {upcomingMatches.map(match => (
                <li key={match.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-4 border-b last:border-b-0">
                  <div className="flex-grow">
                     <p className="font-semibold">vs. {renderOpponent(match)}</p>
                     <p className="text-sm text-muted-foreground">Round {match.round_number} - Match {match.match_number}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground flex-shrink-0">
                     <span className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4"/>
                        {match.scheduled_time ? format(parseISO(match.scheduled_time), 'P') : 'Date TBD'}
                     </span>
                     <span className="flex items-center gap-1">
                         <Clock className="h-4 w-4"/>
                        {match.scheduled_time ? format(parseISO(match.scheduled_time), 'p') : 'Time TBD'}
                     </span>
                     <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4"/>
                        {renderCourt(match.court_id)}
                     </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
             <History className="h-5 w-5" /> Match History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingMatches && <div>Loading match history...</div>}
          {errorMatches && <div className="text-red-500">Error: {errorMatches}</div>}
          {!isLoadingMatches && !errorMatches && completedMatches.length === 0 && (
            <p>No completed matches found.</p>
          )}
          {!isLoadingMatches && !errorMatches && completedMatches.length > 0 && (
            <ul className="space-y-4">
              {completedMatches.map(match => {
                const won = (match.winner_id === user?.id) || false;
                return (
                  <li key={match.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-4 border-b last:border-b-0">
                    <div className="flex-grow">
                       <p className="font-semibold">vs. {renderOpponent(match)}</p>
                       <p className="text-sm text-muted-foreground">Round {match.round_number} - Match {match.match_number}</p>
                       <p className="text-sm text-muted-foreground">Completed: {format(parseISO(match.end_time || match.updated_at), 'P p')}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm flex-shrink-0">
                       <span className="font-semibold">Score: {renderScore(match.scores)}</span>
                       <Badge variant={won ? "default" : "destructive"} className={won ? "bg-green-500" : ""}>{won ? 'Win' : 'Loss'}</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Player Stats Card (NEW) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
             <BarChart2 className="h-5 w-5" /> My Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingMatches && <div>Loading stats...</div>} 
          {!user && !isLoadingMatches && <div>Could not load user data for stats.</div>}
          {user && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatItem icon={<Trophy className="h-4 w-4"/>} label="Matches Won" value={user.player_stats?.matches_won ?? 0} />
              <StatItem icon={<Percent className="h-4 w-4"/>} label="Win Rate" value={`${(((user.player_stats?.matches_won ?? 0) / (user.player_stats?.matches_played || 1)) * 100).toFixed(1)}%`} /> 
              <StatItem label="Matches Played" value={user.player_stats?.matches_played ?? 0} />
              <StatItem label="Tournaments Won" value={user.player_stats?.tournaments_won ?? 0} />
              <StatItem label="Tournaments Played" value={user.player_stats?.tournaments_played ?? 0} />
              <StatItem label="Current Rating" value={user.player_stats?.rating ?? 'N/A'} />
              {/* Add more stats like Ranking if available */}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for other dashboard sections (Task 9.3, 9.4) */}
      {/* <Card> ... Performance Stats ... </Card> */}
      {/* <Card> ... Match History ... </Card> */}

    </div>
  );
};

// Helper component for individual stats
interface StatItemProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value }) => (
  <div className="flex flex-col p-3 bg-muted/50 rounded-lg">
    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-2xl font-semibold">{value}</div>
  </div>
);

export default PlayerDashboard; 