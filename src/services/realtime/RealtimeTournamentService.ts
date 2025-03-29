
import { Tournament, Match } from "@/types/tournament";

/**
 * Real-time tournament service interface
 * This service enables multi-user functionality and live updates
 */
class RealtimeTournamentService {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private matchListeners: Map<string, Set<(data: Match) => void>> = new Map();
  private inProgressListeners: Map<string, Set<(data: Match[]) => void>> = new Map();
  
  /**
   * Subscribe to changes for a specific tournament
   * @param tournamentId The tournament ID to subscribe to
   * @param callback The callback to execute when tournament data changes
   * @returns Unsubscribe function
   */
  subscribeTournament(tournamentId: string, callback: (tournament: Tournament) => void): () => void {
    const key = `tournament:${tournamentId}`;
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key)?.add(callback);
    console.log(`[DEBUG] Subscribed to tournament: ${tournamentId}`);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
      console.log(`[DEBUG] Unsubscribed from tournament: ${tournamentId}`);
    };
  }
  
  /**
   * Subscribe to changes for a specific match
   * @param matchId The match ID to subscribe to
   * @param callback The callback to execute when match data changes
   * @returns Unsubscribe function
   */
  subscribeMatch(matchId: string, callback: (match: Match) => void): () => void {
    const key = `match:${matchId}`;
    
    if (!this.matchListeners.has(key)) {
      this.matchListeners.set(key, new Set());
    }
    
    this.matchListeners.get(key)?.add(callback);
    console.log(`[DEBUG] Subscribed to match: ${matchId}`);
    
    // Return unsubscribe function
    return () => {
      this.matchListeners.get(key)?.delete(callback);
      console.log(`[DEBUG] Unsubscribed from match: ${matchId}`);
    };
  }
  
  /**
   * Subscribe to in-progress matches for a tournament
   * @param tournamentId The tournament ID
   * @param callback The callback to execute when in-progress matches change
   * @returns Unsubscribe function
   */
  subscribeInProgressMatches(tournamentId: string, callback: (matches: Match[]) => void): () => void {
    const key = `tournament:${tournamentId}:in-progress`;
    
    if (!this.inProgressListeners.has(key)) {
      this.inProgressListeners.set(key, new Set());
    }
    
    this.inProgressListeners.get(key)?.add(callback);
    console.log(`[DEBUG] Subscribed to in-progress matches for tournament: ${tournamentId}`);
    
    // Return unsubscribe function
    return () => {
      this.inProgressListeners.get(key)?.delete(callback);
      console.log(`[DEBUG] Unsubscribed from in-progress matches for tournament: ${tournamentId}`);
    };
  }
  
  /**
   * Publish tournament update to subscribers
   * @param tournament The updated tournament data
   */
  publishTournamentUpdate(tournament: Tournament): void {
    const key = `tournament:${tournament.id}`;
    console.log(`[DEBUG] Publishing tournament update: ${tournament.id}`);
    
    // Notify tournament subscribers
    if (this.listeners.has(key)) {
      this.listeners.get(key)?.forEach(listener => {
        try {
          listener(tournament);
        } catch (error) {
          console.error(`[ERROR] Error in tournament listener:`, error);
        }
      });
    }
    
    // Find in-progress matches and notify those subscribers
    const inProgressMatches = tournament.matches.filter(m => m.status === "IN_PROGRESS");
    const inProgressKey = `tournament:${tournament.id}:in-progress`;
    
    if (this.inProgressListeners.has(inProgressKey)) {
      this.inProgressListeners.get(inProgressKey)?.forEach(listener => {
        try {
          listener(inProgressMatches);
        } catch (error) {
          console.error(`[ERROR] Error in in-progress matches listener:`, error);
        }
      });
    }
    
    // Notify individual match subscribers
    tournament.matches.forEach(match => {
      const matchKey = `match:${match.id}`;
      
      if (this.matchListeners.has(matchKey)) {
        this.matchListeners.get(matchKey)?.forEach(listener => {
          try {
            listener(match);
          } catch (error) {
            console.error(`[ERROR] Error in match listener:`, error);
          }
        });
      }
    });
  }
  
  /**
   * Publish match update to subscribers
   * @param match The updated match data
   */
  publishMatchUpdate(match: Match): void {
    const key = `match:${match.id}`;
    console.log(`[DEBUG] Publishing match update: ${match.id}`);
    
    if (this.matchListeners.has(key)) {
      this.matchListeners.get(key)?.forEach(listener => {
        try {
          listener(match);
        } catch (error) {
          console.error(`[ERROR] Error in match listener:`, error);
        }
      });
    }
  }
}

// Create a singleton instance
export const realtimeTournamentService = new RealtimeTournamentService();
