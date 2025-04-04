
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { StandaloneMatch, MatchStatus, Team, MatchScore, AuditLog } from '@/types/tournament';

// Define a custom audit log format for standalone matches that works with our types
interface StandaloneAuditLog extends Omit<AuditLog, 'meta'> {
  timestamp: Date;
  action: string;
  details: string;
  userName?: string;
  user_id?: string;
}

export interface StandaloneMatchStore {
  matches: StandaloneMatch[];
  currentMatch: StandaloneMatch | null;
  
  // Actions
  createMatch: (matchData: Partial<StandaloneMatch>) => StandaloneMatch;
  updateMatch: (match: StandaloneMatch) => void;
  deleteMatch: (id: string) => void;
  loadMatchById: (id: string) => StandaloneMatch | null;
  setCurrentMatch: (match: StandaloneMatch | null) => void;
  
  // Additional actions for match operations
  updateMatchScore: (matchId: string, setIndex: number, team1Score: number, team2Score: number, scorerName?: string) => void;
  updateMatchStatus: (matchId: string, status: MatchStatus) => void;
  completeMatch: (matchId: string, scorerName?: string) => boolean;
  updateCourtNumber: (matchId: string, courtNumber: number) => void;
  saveMatch?: () => Promise<boolean>;
}

// Helper to ensure audit logs match the expected format
const createAuditLog = (action: string, details: string, userName?: string): AuditLog => {
  return {
    timestamp: new Date(),
    action,
    details,
    user_id: '',
    userName: userName || '',
  };
};

export const useStandaloneMatchStore = create<StandaloneMatchStore>()(
  persist(
    (set, get) => ({
      matches: [],
      currentMatch: null,
      
      createMatch: (matchData) => {
        // Generate a new ID for the match
        const id = matchData.id || `match-${uuidv4()}`;
        const matchNumber = matchData.matchNumber || `SM-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        
        // Ensure we have valid teams with IDs
        const team1: Team = {
          ...(matchData.team1 || {}),
          id: matchData.team1?.id || `team1-${uuidv4()}`,
          players: matchData.team1?.players || []
        };
        
        const team2: Team = {
          ...(matchData.team2 || {}),
          id: matchData.team2?.id || `team2-${uuidv4()}`,
          players: matchData.team2?.players || []
        };
        
        // Create the new match
        const newMatch: StandaloneMatch = {
          id,
          matchNumber,
          team1,
          team2,
          scores: matchData.scores || [],
          status: matchData.status || 'SCHEDULED',
          scheduledTime: matchData.scheduledTime || new Date(),
          courtNumber: matchData.courtNumber,
          courtName: matchData.courtName,
          createdAt: matchData.createdAt instanceof Date ? matchData.createdAt : new Date(),
          updatedAt: matchData.updatedAt instanceof Date ? matchData.updatedAt : new Date(),
          auditLogs: matchData.auditLogs || [
            createAuditLog('Match created', `Match ${id} created`)
          ]
        };
        
        // Add the new match to the store
        set((state) => {
          const updatedMatches = [...state.matches, newMatch];
          return { matches: updatedMatches };
        });
        
        // Set as current match
        set({ currentMatch: newMatch });
        
        return newMatch;
      },
      
      updateMatch: (match) => {
        // Ensure we have updated timestamps
        const updatedMatch = {
          ...match,
          updatedAt: new Date()
        };
        
        set((state) => {
          // Find and replace the match
          const updatedMatches = state.matches.map((m) => 
            m.id === match.id ? updatedMatch : m
          );
          
          // If this is the current match, update that too
          const newCurrentMatch = state.currentMatch && state.currentMatch.id === match.id
            ? updatedMatch
            : state.currentMatch;
            
          return { 
            matches: updatedMatches,
            currentMatch: newCurrentMatch
          };
        });
      },
      
      deleteMatch: (id) => {
        set((state) => {
          const matches = state.matches.filter((m) => m.id !== id);
          
          // If we deleted the current match, set currentMatch to null
          const newCurrentMatch = state.currentMatch && state.currentMatch.id === id
            ? null
            : state.currentMatch;
            
          return { matches, currentMatch: newCurrentMatch };
        });
      },
      
      loadMatchById: (id) => {
        const match = get().matches.find(m => m.id === id) || null;
        if (match) {
          set({ currentMatch: match });
        }
        return match;
      },
      
      setCurrentMatch: (match) => {
        set({ currentMatch: match });
      },
      
      updateMatchScore: (matchId, setIndex, team1Score, team2Score, scorerName) => {
        set((state) => {
          const match = state.matches.find(m => m.id === matchId);
          if (!match) return state;
          
          // Create a copy of scores
          const scores = [...match.scores];
          
          // Update or add the score for this set
          while (scores.length <= setIndex) {
            scores.push({ team1Score: 0, team2Score: 0 });
          }
          
          // Create a proper MatchScore object without extraneous properties
          scores[setIndex] = {
            team1Score,
            team2Score
          };
          
          // Create the updated match
          const updatedMatch = {
            ...match,
            scores,
            updatedAt: new Date(),
            scorerName: scorerName || match.scorerName,
            auditLogs: [
              ...(match.auditLogs || []),
              createAuditLog(
                `Score updated for set ${setIndex + 1}`,
                `New score: ${team1Score}-${team2Score}`,
                scorerName
              )
            ]
          };
          
          // Update the match in the matches array
          const updatedMatches = state.matches.map(m => 
            m.id === matchId ? updatedMatch : m
          );
          
          return {
            matches: updatedMatches,
            currentMatch: state.currentMatch?.id === matchId ? updatedMatch : state.currentMatch
          };
        });
      },
      
      updateMatchStatus: (matchId, status) => {
        set((state) => {
          const match = state.matches.find(m => m.id === matchId);
          if (!match) return state;
          
          const updatedMatch: StandaloneMatch = {
            ...match,
            status,
            updatedAt: new Date(),
            auditLogs: [
              ...(match.auditLogs || []),
              createAuditLog(
                `Status changed to ${status}`,
                `Match status updated to ${status}`
              )
            ]
          };
          
          // Update the match in the matches array
          const updatedMatches = state.matches.map(m => 
            m.id === matchId ? updatedMatch : m
          );
          
          return {
            matches: updatedMatches,
            currentMatch: state.currentMatch?.id === matchId ? updatedMatch : state.currentMatch
          };
        });
        
        return true;
      },
      
      completeMatch: (matchId, scorerName) => {
        set((state) => {
          const match = state.matches.find(m => m.id === matchId);
          if (!match) return state;
          
          // Determine the winner based on scores
          let winner = null;
          if (match.scores.length > 0) {
            let team1Sets = 0;
            let team2Sets = 0;
            
            match.scores.forEach(score => {
              if (score.team1Score > score.team2Score) team1Sets++;
              else if (score.team2Score > score.team1Score) team2Sets++;
            });
            
            if (team1Sets > team2Sets) winner = match.team1;
            else if (team2Sets > team1Sets) winner = match.team2;
          }
          
          const updatedMatch: StandaloneMatch = {
            ...match,
            status: 'COMPLETED',
            updatedAt: new Date(),
            winner,
            scorerName: scorerName || match.scorerName,
            endTime: new Date(),
            auditLogs: [
              ...(match.auditLogs || []),
              createAuditLog(
                'Match completed',
                winner ? `Winner: ${winner.name}` : 'Match completed without a winner',
                scorerName
              )
            ]
          };
          
          // Update the match in the matches array
          const updatedMatches = state.matches.map(m => 
            m.id === matchId ? updatedMatch : m
          );
          
          return {
            matches: updatedMatches,
            currentMatch: state.currentMatch?.id === matchId ? updatedMatch : state.currentMatch
          };
        });
        
        return true;
      },
      
      updateCourtNumber: (matchId, courtNumber) => {
        set((state) => {
          const match = state.matches.find(m => m.id === matchId);
          if (!match) return state;
          
          const updatedMatch: StandaloneMatch = {
            ...match,
            courtNumber,
            courtName: `Court ${courtNumber}`,
            updatedAt: new Date(),
            auditLogs: [
              ...(match.auditLogs || []),
              createAuditLog(
                'Court assigned',
                `Assigned to Court ${courtNumber}`
              )
            ]
          };
          
          // Update the match in the matches array
          const updatedMatches = state.matches.map(m => 
            m.id === matchId ? updatedMatch : m
          );
          
          return {
            matches: updatedMatches,
            currentMatch: state.currentMatch?.id === matchId ? updatedMatch : state.currentMatch
          };
        });
      },
      
      // Add save match function
      saveMatch: async () => {
        // Just return true since we're already using Zustand with persist middleware
        return Promise.resolve(true);
      }
    }),
    {
      name: 'standalone-match-storage'
    }
  )
);
