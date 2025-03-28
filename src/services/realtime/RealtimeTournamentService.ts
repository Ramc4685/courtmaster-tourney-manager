
import { Tournament, Match } from "@/types/tournament";
import { RealTimeStorageService } from "../storage/StorageService";

// This is a mock implementation of a real-time service
// In a real app, this would be implemented using WebSockets or a
// real-time database like Firebase or Supabase

export class RealtimeTournamentService {
  private realTimeStorage = new RealTimeStorageService();
  private TOURNAMENT_KEY_PREFIX = 'tournament:';
  private MATCH_KEY_PREFIX = 'match:';

  // Get tournament updates in real-time
  subscribeTournament(tournamentId: string, callback: (tournament: Tournament) => void): () => void {
    const key = `${this.TOURNAMENT_KEY_PREFIX}${tournamentId}`;
    return this.realTimeStorage.subscribe<Tournament>(key, callback);
  }

  // Subscribe to match updates
  subscribeMatch(matchId: string, callback: (match: Match) => void): () => void {
    const key = `${this.MATCH_KEY_PREFIX}${matchId}`;
    return this.realTimeStorage.subscribe<Match>(key, callback);
  }

  // Subscribe to all in-progress matches for a tournament
  subscribeInProgressMatches(tournamentId: string, callback: (matches: Match[]) => void): () => void {
    // In a real implementation, this would use a proper subscription
    // For this demo, we're using a simple interval to simulate updates
    const intervalId = setInterval(() => {
      this.realTimeStorage.getItem<Tournament>(`${this.TOURNAMENT_KEY_PREFIX}${tournamentId}`)
        .then(tournament => {
          if (tournament) {
            const inProgressMatches = tournament.matches.filter(m => m.status === "IN_PROGRESS");
            callback(inProgressMatches);
          }
        });
    }, 2000);

    return () => clearInterval(intervalId);
  }

  // Publish tournament update (would be called by the backend in a real app)
  async publishTournamentUpdate(tournament: Tournament): Promise<void> {
    const key = `${this.TOURNAMENT_KEY_PREFIX}${tournament.id}`;
    await this.realTimeStorage.setItem(key, tournament);
    
    // Also update individual matches
    tournament.matches.forEach(async match => {
      const matchKey = `${this.MATCH_KEY_PREFIX}${match.id}`;
      await this.realTimeStorage.setItem(matchKey, match);
    });
  }
}

export const realtimeTournamentService = new RealtimeTournamentService();
