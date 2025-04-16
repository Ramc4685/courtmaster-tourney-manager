import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Trophy, Calendar, Users, Activity } from 'lucide-react';
import type { Tournament, Match } from '@/types/tournament';
import { TournamentStatus, MatchStatus } from '@/types/tournament-enums';
import { APIService } from '@/services/api';

const api = new APIService();

export default function DashboardPage() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all tournaments where user is organizer
        const userTournaments = await api.listTournaments({ 
          organizer_id: user?.id 
        });
        console.log('Loaded tournaments:', userTournaments);
        setTournaments(userTournaments);

        // Load upcoming matches where user is a player
        const matches = await api.listMatches({ status: MatchStatus.SCHEDULED });
        const userMatches = matches.filter(match => {
          const team1Players = match.team1?.players?.map(p => p.id) || [];
          const team2Players = match.team2?.players?.map(p => p.id) || [];
          return team1Players.includes(user?.id) || team2Players.includes(user?.id);
        });
        setUpcomingMatches(userMatches);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Tournaments</h2>
        {tournaments.length > 0 ? (
          <ul className="space-y-4">
            {tournaments.map(tournament => (
              <li key={tournament.id} className="border p-4 rounded-lg">
                <h3 className="text-xl font-medium">{tournament.name}</h3>
                <p className="text-gray-600">{tournament.location}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No active tournaments found.</p>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Upcoming Matches</h2>
        {upcomingMatches.length > 0 ? (
          <ul className="space-y-4">
            {upcomingMatches.map(match => (
              <li key={match.id} className="border p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{match.team1?.name} vs {match.team2?.name}</p>
                    <p className="text-sm text-gray-600">
                      {match.scheduledTime ? new Date(match.scheduledTime).toLocaleString() : 'Time TBD'}
                    </p>
                  </div>
                  {match.courtNumber && (
                    <div className="bg-blue-100 px-3 py-1 rounded">
                      Court {match.courtNumber}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No upcoming matches found.</p>
        )}
      </section>
    </div>
  );
} 