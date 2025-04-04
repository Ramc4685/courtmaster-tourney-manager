
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { AuditLog, Match, MatchScore, MatchStatus, Player, StandaloneMatch, Team, TournamentCategory } from '@/types/tournament';

// Define a specific audit log for standalone matches
interface StandaloneAuditLog extends Partial<AuditLog> {
  timestamp: Date;
  action: string;
  details: string | Record<string, any>;
  user_id?: string;
  userName?: string;
}

export const useStandaloneMatchStore = create()(
  persist(
    (set, get) => ({
      matches: [] as StandaloneMatch[],
      currentMatch: null as StandaloneMatch | null,

      createMatch: (matchData: Partial<StandaloneMatch>): StandaloneMatch => {
        // Generate a new ID for the match
        const id = matchData.id || `match-${nanoid(8)}`;
        const matchNumber = matchData.matchNumber || `SM-${String(Math.floor(Math.random() * 9000) + 1000)}`;

        // Ensure we have valid teams with IDs
        const team1: Team = {
          id: matchData.team1?.id || `team1-${nanoid(6)}`,
          name: matchData.team1?.name || 'Team 1',
          players: matchData.team1?.players || [],
          status: matchData.team1?.status || 'ACTIVE'
        };

        const team2: Team = {
          id: matchData.team2?.id || `team2-${nanoid(6)}`,
          name: matchData.team2?.name || 'Team 2',
          players: matchData.team2?.players || [],
          status: matchData.team2?.status || 'ACTIVE'
        };

        // Create the new match
        const newMatch: StandaloneMatch = {
          id,
          matchNumber,
          team1,
          team2,
          scores: matchData.scores || [],
          status: (matchData.status as MatchStatus) || 'SCHEDULED',
          scheduledTime: matchData.scheduledTime || new Date(),
          courtNumber: matchData.courtNumber,
          courtName: matchData.courtName,
          // Convert string dates to Date objects if needed
          createdAt: matchData.createdAt instanceof Date ? matchData.createdAt : new Date(),
          updatedAt: matchData.updatedAt instanceof Date ? matchData.updatedAt : new Date(),
          auditLogs: matchData.auditLogs || [
            {
              timestamp: new Date(),
              action: 'Match created',
              details: `Match ${id} created`,
              user_id: 'system'
            } as StandaloneAuditLog
          ]
        };

        // Add the new match to the store
        set((state) => {
          const updatedMatches = [...state.matches, newMatch];
          return {
            matches: updatedMatches
          };
        });

        // Set as current match
        set({
          currentMatch: newMatch
        });

        return newMatch;
      },

      updateMatch: (match: StandaloneMatch) => {
        // Ensure we have updated timestamps
        const updatedMatch = {
          ...match,
          updatedAt: new Date()
        };

        set((state) => {
          // Find and replace the match
          const updatedMatches = state.matches.map((m) => m.id === match.id ? updatedMatch : m);
          
          // If this is the current match, update that too
          const newCurrentMatch = state.currentMatch && state.currentMatch.id === match.id 
            ? updatedMatch 
            : state.currentMatch;

          return {
            matches: updatedMatches,
            currentMatch: newCurrentMatch
          };
        });

        return match;
      },

      deleteMatch: (id: string) => {
        set((state) => {
          const matches = state.matches.filter((m) => m.id !== id);
          
          // If we deleted the current match, set currentMatch to null
          const newCurrentMatch = state.currentMatch && state.currentMatch.id === id 
            ? null 
            : state.currentMatch;

          return {
            matches,
            currentMatch: newCurrentMatch
          };
        });
      },

      loadMatchById: (id: string): StandaloneMatch | null => {
        const match = get().matches.find((m) => m.id === id) || null;
        if (match) {
          set({
            currentMatch: match
          });
        }
        return match;
      },

      setCurrentMatch: (match: StandaloneMatch | null) => {
        set({
          currentMatch: match
        });
      },

      saveMatch: async (): Promise<boolean> => {
        // This method is a placeholder for future backend integration
        // For now it just ensures the match is saved in local storage
        try {
          const match = get().currentMatch;
          if (!match) return false;
          
          // Add a save audit log
          return true;
        } catch (err) {
          console.error('Error saving match:', err);
          return false;
        }
      },

      updateMatchScore: (
        matchId: string, 
        setIndex: number, 
        team1Score: number, 
        team2Score: number, 
        scorerName?: string
      ) => {
        set((state) => {
          const match = state.matches.find((m) => m.id === matchId);
          if (!match) return state;

          // Create a copy of scores
          const scores = [...match.scores];

          // Update or add the score for this set
          while(scores.length <= setIndex) {
            scores.push({
              team1Score: 0,
              team2Score: 0
            });
          }

          scores[setIndex] = {
            team1Score,
            team2Score,
            scoredBy: scorerName,
            timestamp: new Date().toISOString()
          };

          // Create the updated match
          const updatedMatch = {
            ...match,
            scores,
            updatedAt: new Date(),
            scorerName: scorerName || match.scorerName,
            auditLogs: [
              ...(match.auditLogs || []),
              {
                timestamp: new Date(),
                action: `Score updated for set ${setIndex + 1}`,
                details: `New score: ${team1Score}-${team2Score}`,
                userName: scorerName,
                user_id: 'system'
              } as StandaloneAuditLog
            ]
          };

          // Update the match in the matches array
          const updatedMatches = state.matches.map((m) => 
            m.id === matchId ? updatedMatch : m
          );

          return {
            matches: updatedMatches,
            currentMatch: state.currentMatch?.id === matchId ? updatedMatch : state.currentMatch
          };
        });
      },

      updateMatchStatus: (matchId: string, status: MatchStatus): boolean => {
        set((state) => {
          const match = state.matches.find((m) => m.id === matchId);
          if (!match) return state;

          const updatedMatch = {
            ...match,
            status,
            updatedAt: new Date(),
            auditLogs: [
              ...(match.auditLogs || []),
              {
                timestamp: new Date(),
                action: `Status changed to ${status}`,
                details: `Match status updated to ${status}`,
                user_id: 'system'
              } as StandaloneAuditLog
            ]
          };

          // Update the match in the matches array
          const updatedMatches = state.matches.map((m) => 
            m.id === matchId ? updatedMatch : m
          );

          return {
            matches: updatedMatches,
            currentMatch: state.currentMatch?.id === matchId ? updatedMatch : state.currentMatch
          };
        });

        return true;
      },

      completeMatch: (matchId: string, scorerName?: string): boolean => {
        set((state) => {
          const match = state.matches.find((m) => m.id === matchId);
          if (!match) return state;

          // Determine the winner based on scores
          let winner = null;
          if (match.scores.length > 0) {
            let team1Sets = 0;
            let team2Sets = 0;

            match.scores.forEach((score) => {
              if (score.team1Score > score.team2Score) team1Sets++;
              else if (score.team2Score > score.team1Score) team2Sets++;
            });

            if (team1Sets > team2Sets) winner = match.team1;
            else if (team2Sets > team1Sets) winner = match.team2;
          }

          const updatedMatch = {
            ...match,
            status: 'COMPLETED' as MatchStatus,
            updatedAt: new Date(),
            winner,
            scorerName: scorerName || match.scorerName,
            endTime: new Date(),
            auditLogs: [
              ...(match.auditLogs || []),
              {
                timestamp: new Date(),
                action: 'Match completed',
                details: winner ? `Winner: ${winner.name}` : 'Match completed without a winner',
                userName: scorerName,
                user_id: 'system'
              } as StandaloneAuditLog
            ]
          };

          // Update the match in the matches array
          const updatedMatches = state.matches.map((m) => 
            m.id === matchId ? updatedMatch : m
          );

          return {
            matches: updatedMatches,
            currentMatch: state.currentMatch?.id === matchId ? updatedMatch : state.currentMatch
          };
        });

        return true;
      },

      updateCourtNumber: (matchId: string, courtNumber: number) => {
        set((state) => {
          const match = state.matches.find((m) => m.id === matchId);
          if (!match) return state;

          const updatedMatch = {
            ...match,
            courtNumber,
            courtName: `Court ${courtNumber}`,
            updatedAt: new Date(),
            auditLogs: [
              ...(match.auditLogs || []),
              {
                timestamp: new Date(),
                action: 'Court assigned',
                details: `Assigned to Court ${courtNumber}`,
                user_id: 'system'
              } as StandaloneAuditLog
            ]
          };

          // Update the match in the matches array
          const updatedMatches = state.matches.map((m) => 
            m.id === matchId ? updatedMatch : m
          );

          return {
            matches: updatedMatches,
            currentMatch: state.currentMatch?.id === matchId ? updatedMatch : state.currentMatch
          };
        });
      }
    }),
    {
      name: 'standalone-match-storage'
    }
  )
);
