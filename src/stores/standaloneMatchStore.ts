
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { AuditLog, Match, MatchScore, MatchStatus, Player, StandaloneMatch, Team, TournamentCategory } from '@/types/tournament';

// Define a simplified audit log type for standalone matches
interface StandaloneAuditLog {
  timestamp: Date;
  action: string;
  details: string | Record<string, any>;
  user_id: string; // Making it required to match AuditLog
  userName?: string;
}

// Modify the StandaloneMatch interface to use our simplified audit log
// This is for internal use only
interface StandaloneMatchWithCustomAudit extends Omit<StandaloneMatch, 'auditLogs'> {
  auditLogs: StandaloneAuditLog[];
}

// Define the store state type
interface StandaloneMatchStoreState {
  matches: StandaloneMatch[];
  currentMatch: StandaloneMatch | null;
  createMatch: (matchData: Partial<StandaloneMatch>) => StandaloneMatch;
  updateMatch: (match: StandaloneMatch) => StandaloneMatch;
  deleteMatch: (id: string) => void;
  loadMatchById: (id: string) => StandaloneMatch | null;
  setCurrentMatch: (match: StandaloneMatch | null) => void;
  saveMatch: () => Promise<boolean>;
  updateMatchScore: (
    matchId: string,
    setIndex: number,
    team1Score: number,
    team2Score: number,
    scorerName?: string
  ) => void;
  updateMatchStatus: (matchId: string, status: MatchStatus) => boolean;
  completeMatch: (matchId: string, scorerName?: string) => boolean;
  updateCourtNumber: (matchId: string, courtNumber: number) => void;
}

export const useStandaloneMatchStore = create<StandaloneMatchStoreState>()(
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

        // Create a default audit log
        const defaultAuditLog: AuditLog = {
          timestamp: new Date(),
          action: 'Match created',
          details: { message: `Match ${id} created`, creator: 'admin' },
          user_id: 'system'
        };

        // Create the new match with all defaults needed for quick match
        const newMatch: StandaloneMatch = {
          id,
          matchNumber,
          team1,
          team2,
          scores: matchData.scores || [],
          status: (matchData.status as MatchStatus) || 'SCHEDULED',
          scheduledTime: matchData.scheduledTime || new Date(),
          courtNumber: matchData.courtNumber || 1,
          courtName: matchData.courtName || 'Court 1',
          // Convert string dates to Date objects if needed
          createdAt: matchData.createdAt instanceof Date ? matchData.createdAt : new Date(),
          updatedAt: matchData.updatedAt instanceof Date ? matchData.updatedAt : new Date(),
          auditLogs: matchData.auditLogs || [defaultAuditLog],
          scorerName: matchData.scorerName || 'admin',
          categoryName: matchData.categoryName || 'Quick Match',
          tournamentName: matchData.tournamentName || 'Standalone Tournament'
        };

        // Add the new match to the store
        set((state) => ({
          matches: [...state.matches, newMatch],
          currentMatch: newMatch
        }));

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

          // Create a score object that matches the MatchScore type
          // Only include properties that are part of the MatchScore interface
          scores[setIndex] = {
            team1Score,
            team2Score
          };

          // Create a default audit log with the scorer information
          const scoreAuditLog: AuditLog = {
            timestamp: new Date(),
            action: `Score updated for set ${setIndex + 1}`,
            details: { 
              score: `${team1Score}-${team2Score}`,
              scorer: scorerName || 'admin',
              timestamp: new Date().toISOString()
            },
            user_id: 'system'
          };

          // Create the updated match
          const updatedMatch = {
            ...match,
            scores,
            updatedAt: new Date(),
            scorerName: scorerName || 'admin',
            auditLogs: [...match.auditLogs, scoreAuditLog]
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

          // Create a default audit log
          const statusAuditLog: AuditLog = {
            timestamp: new Date(),
            action: `Status changed to ${status}`,
            details: { newStatus: status, changedBy: 'admin' },
            user_id: 'system'
          };

          const updatedMatch = {
            ...match,
            status,
            updatedAt: new Date(),
            auditLogs: [...match.auditLogs, statusAuditLog]
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

          // Create completion audit log
          const completionAuditLog: AuditLog = {
            timestamp: new Date(),
            action: 'Match completed',
            details: { 
              winner: winner ? winner.name : 'No winner determined',
              scorer: scorerName || 'admin'
            },
            user_id: 'system'
          };

          const updatedMatch = {
            ...match,
            status: 'COMPLETED' as MatchStatus,
            updatedAt: new Date(),
            winner,
            scorerName: scorerName || 'admin',
            endTime: new Date(),
            auditLogs: [...match.auditLogs, completionAuditLog]
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

          // Create court assignment audit log
          const courtAuditLog: AuditLog = {
            timestamp: new Date(),
            action: 'Court assigned',
            details: { courtNumber, assignedBy: 'admin' },
            user_id: 'system'
          };

          const updatedMatch = {
            ...match,
            courtNumber,
            courtName: `Court ${courtNumber}`,
            updatedAt: new Date(),
            auditLogs: [...match.auditLogs, courtAuditLog]
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
