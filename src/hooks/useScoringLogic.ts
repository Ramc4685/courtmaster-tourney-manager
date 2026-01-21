/**
 * Scoring Logic Hook for CourtMaster Tournament Management System
 * 
 * Provides a React hook for managing match scores according to sport-specific rules.
 * Integrates with the sport rules system and handles offline score tracking.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { databases, COLLECTIONS, APPWRITE_DATABASE_ID } from '../lib/appwrite';
import { Query } from 'appwrite';
import { useMatchScoreOfflineSync } from './useOfflineSync';
import SportRulesFactory from '../services/rules/SportRulesFactory';
import eventBus, { EventType } from '../events/eventBus';
import { useToast } from './useToast';
import { MatchScore, SetScore, ISportRules } from '../domain/rules/ISportRules';

export interface Match {
  id: string;
  tournament_id: string;
  division_id: string;
  team1_id: string;
  team2_id: string;
  team1_name: string;
  team2_name: string;
  court_id?: string;
  scheduled_time?: string;
  start_time?: string;
  end_time?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scores?: any;
  sport_type: string;
  format_id?: string;
  round?: number;
  match_number?: number;
  winner_id?: string;
}

interface UseScoringLogicOptions {
  autoSave?: boolean;
  autoSync?: boolean;
}

interface UseScoringLogicResult {
  score: MatchScore;
  currentSet: number;
  isComplete: boolean;
  winner: number | undefined;
  setWinner: number | undefined;
  servingSide: number;
  isSaving: boolean;
  addPoint: (team: 1 | 2, points?: number) => void;
  removePoint: () => void;
  completeMatch: () => Promise<boolean>;
  undoCompleteMatch: () => void;
  saveScore: () => Promise<boolean>;
  formatScore: (compact?: boolean) => string;
  formatSetScore: (setIndex: number) => string;
}

export const useScoringLogic = (
  match: Match | null,
  options: UseScoringLogicOptions = {}
): UseScoringLogicResult => {
  const { autoSave = false, autoSync = true } = options;
  const { toast } = useToast();
  
  // Get offline sync capabilities
  const {
    isOnline,
    queueScoreUpdate,
    syncNow,
    pendingScoreUpdates
  } = useMatchScoreOfflineSync(match?.tournament_id || '');
  
  // State for scoring logic
  const [score, setScore] = useState<MatchScore | null>(null);
  const [currentSet, setCurrentSet] = useState<number>(0);
  const [sportRules, setSportRules] = useState<ISportRules | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [servingSide, setServingSide] = useState<number>(1);
  
  // Keep a ref to the current match for use in callbacks
  const matchRef = useRef<Match | null>(null);
  
  // Initialize scoring based on match data
  useEffect(() => {
    if (!match) {
      setScore(null);
      setSportRules(null);
      return;
    }
    
    matchRef.current = match;
    
    // Get sport rules for this match
    const rules = SportRulesFactory.createRules(match.sport_type, match.format_id);
    setSportRules(rules);
    
    // Initialize score from match data or create new empty score
    if (match.scores) {
      // Parse scores if they're stored as a string
      const parsedScores = typeof match.scores === 'string'
        ? JSON.parse(match.scores)
        : match.scores;
      setScore(parsedScores);
      
      // Find the current active set
      const activeSetIndex = parsedScores.sets?.findIndex((set: SetScore) => !set.isComplete);
      setCurrentSet(activeSetIndex !== -1 ? activeSetIndex : 0);
      
      // Determine serving side
      if (rules) {
        try {
          // For racquet sports, get the serving side
          if ('getServingSide' in rules) {
            const side = rules.getServingSide(parsedScores, activeSetIndex !== -1 ? activeSetIndex : 0);
            setServingSide(side);
          }
        } catch (error) {
          console.error('Error determining serving side:', error);
        }
      }
    } else {
      // Create a new empty score
      const emptyScore = rules?.createEmptyScore(match.format_id) || {
        sets: [{ team1Score: 0, team2Score: 0, isComplete: false }],
        isComplete: false
      };
      setScore(emptyScore);
      setCurrentSet(0);
      setServingSide(1); // Default to team 1 serving first
    }
  }, [match]);
  
  // Update serving side when score changes
  useEffect(() => {
    if (!score || !sportRules || !('getServingSide' in sportRules)) {
      return;
    }
    
    try {
      // Update serving side based on current score
      const side = (sportRules as any).getServingSide(score, currentSet);
      setServingSide(side);
    } catch (error) {
      console.error('Error updating serving side:', error);
    }
  }, [score, currentSet, sportRules]);
  
  // Automatically save score changes if autoSave is enabled
  useEffect(() => {
    if (autoSave && score && match && match.status === 'in_progress') {
      const autoSaveDebounce = setTimeout(() => {
        saveScore();
      }, 2000);
      
      return () => clearTimeout(autoSaveDebounce);
    }
  }, [score, autoSave, match]);
  
  // Add points for a team
  const addPoint = useCallback((team: 1 | 2, points: number = 1) => {
    if (!score || !sportRules) return;
    
    const updatedScore = sportRules.addPoints(score, { team, points });
    setScore(updatedScore);
    
    // Update current set if needed
    const activeSetIndex = updatedScore.sets.findIndex(set => !set.isComplete);
    if (activeSetIndex !== -1) {
      setCurrentSet(activeSetIndex);
    }
    
    // Emit scoring event
    eventBus.emit(EventType.SCORE_UPDATED, {
      matchId: matchRef.current?.id,
      tournamentId: matchRef.current?.tournament_id,
      score: updatedScore
    }, 'ScoringLogic');
    
    // If match is now complete, emit match completed event
    if (updatedScore.isComplete && !score.isComplete) {
      eventBus.emit(EventType.MATCH_COMPLETED, {
        matchId: matchRef.current?.id,
        tournamentId: matchRef.current?.tournament_id,
        score: updatedScore,
        winnerId: updatedScore.winner === 1 ? matchRef.current?.team1_id : matchRef.current?.team2_id
      }, 'ScoringLogic');
    }
  }, [score, sportRules]);
  
  // Remove the last point
  const removePoint = useCallback(() => {
    if (!score || !sportRules) return;
    
    const updatedScore = sportRules.removePoint(score);
    setScore(updatedScore);
    
    // Update current set if needed
    const activeSetIndex = updatedScore.sets.findIndex(set => !set.isComplete);
    if (activeSetIndex !== -1) {
      setCurrentSet(activeSetIndex);
    }
    
    // Emit scoring event
    eventBus.emit(EventType.SCORE_UPDATED, {
      matchId: matchRef.current?.id,
      tournamentId: matchRef.current?.tournament_id,
      score: updatedScore
    }, 'ScoringLogic');
  }, [score, sportRules]);
  
  // Mark match as complete with current scores
  const completeMatch = useCallback(async (): Promise<boolean> => {
    if (!match || !score || !sportRules) return false;
    
    // Check if the score is valid for completion
    const validation = sportRules.validateScore(score);
    if (!validation.isValid) {
      toast({
        title: 'Invalid Score',
        description: 'The current score is not valid for match completion. ' + validation.errors[0],
        variant: 'destructive'
      });
      return false;
    }
    
    // Check if we have a winner
    if (score.isComplete && score.winner) {
      const winnerId = score.winner === 1 ? match.team1_id : match.team2_id;
      
      try {
        setIsSaving(true);
        
        // Update match record
        if (isOnline) {
          await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            COLLECTIONS.MATCHES,
            match.id,
            {
              status: 'completed',
              end_time: new Date().toISOString(),
              scores: JSON.stringify(score),
              winner_id: winnerId
            }
          );
        } else {
          // Queue offline update
          await queueScoreUpdate(match.id, {
            status: 'completed',
            end_time: new Date().toISOString(),
            scores: JSON.stringify(score),
            winner_id: winnerId
          });
        }
        
        // Emit match completed event
        eventBus.emit(EventType.MATCH_COMPLETED, {
          matchId: match.id,
          tournamentId: match.tournament_id,
          score: score,
          winnerId
        }, 'ScoringLogic');
        
        toast({
          title: 'Match Completed',
          description: `Match has been marked as complete. Winner: Team ${score.winner}.`
        });
        
        return true;
      } catch (error) {
        console.error('Error completing match:', error);
        toast({
          title: 'Error',
          description: 'Failed to complete the match. Please try again.',
          variant: 'destructive'
        });
        return false;
      } finally {
        setIsSaving(false);
      }
    } else {
      toast({
        title: 'Match Incomplete',
        description: 'Cannot complete the match without a valid final score.',
        variant: 'destructive'
      });
      return false;
    }
  }, [match, score, sportRules, isOnline, queueScoreUpdate, toast]);
  
  // Undo match completion
  const undoCompleteMatch = useCallback(() => {
    if (!score) return;
    
    const updatedScore = { ...score, isComplete: false, winner: undefined };
    setScore(updatedScore);
    
    // Emit scoring event
    eventBus.emit(EventType.SCORE_UPDATED, {
      matchId: matchRef.current?.id,
      tournamentId: matchRef.current?.tournament_id,
      score: updatedScore
    }, 'ScoringLogic');
  }, [score]);
  
  // Save the current score
  const saveScore = useCallback(async (): Promise<boolean> => {
    if (!match || !score) return false;
    
    try {
      setIsSaving(true);
      
      if (isOnline) {
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.MATCHES,
          match.id,
          {
            scores: JSON.stringify(score),
            status: score.isComplete ? 'completed' : 'in_progress',
            ...(score.isComplete && {
              end_time: new Date().toISOString(),
              winner_id: score.winner === 1 ? match.team1_id : match.team2_id
            }),
            ...(!match.start_time && { start_time: new Date().toISOString() })
          }
        );
      } else {
        // Queue offline update
        await queueScoreUpdate(match.id, {
          scores: JSON.stringify(score),
          status: score.isComplete ? 'completed' : 'in_progress',
          ...(score.isComplete && {
            end_time: new Date().toISOString(),
            winner_id: score.winner === 1 ? match.team1_id : match.team2_id
          }),
          ...(!match.start_time && { start_time: new Date().toISOString() })
        });
        
        toast({
          title: 'Score Saved Offline',
          description: 'Score has been saved locally and will sync when online.'
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error saving score:', error);
      toast({
        title: 'Error',
        description: 'Failed to save the score. Please try again.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [match, score, isOnline, queueScoreUpdate, toast]);
  
  // Format score for display
  const formatScore = useCallback((compact: boolean = false): string => {
    if (!score || !sportRules) return '0-0';
    
    if (compact) {
      // Get only completed sets for compact display
      const completedSets = score.sets.filter(set => set.isComplete);
      
      if (completedSets.length === 0) {
        // If no completed sets, show current set
        const currentSetObj = score.sets[currentSet];
        return `${currentSetObj.team1Score}-${currentSetObj.team2Score}`;
      }
      
      // Format completed sets
      return completedSets
        .map(set => `${set.team1Score}-${set.team2Score}`)
        .join(', ');
    }
    
    // Use sport-specific formatting if available
    if ('formatScoreForDisplay' in sportRules) {
      return sportRules.formatScoreForDisplay(score);
    }
    
    // Default formatting
    return score.sets
      .map(set => `${set.team1Score}-${set.team2Score}`)
      .join(', ');
  }, [score, sportRules, currentSet]);
  
  // Format a specific set score
  const formatSetScore = useCallback((setIndex: number): string => {
    if (!score || setIndex >= score.sets.length) return '0-0';
    
    const set = score.sets[setIndex];
    
    // Use sport-specific formatting if available
    if (sportRules && 'formatSetScoreForDisplay' in sportRules) {
      return sportRules.formatSetScoreForDisplay(set);
    }
    
    // Default formatting
    return `${set.team1Score}-${set.team2Score}`;
  }, [score, sportRules]);
  
  // Get current set winner
  const setWinner = score?.sets[currentSet]?.winner;
  
  return {
    score: score as MatchScore,
    currentSet,
    isComplete: score?.isComplete || false,
    winner: score?.winner,
    setWinner,
    servingSide,
    isSaving,
    addPoint,
    removePoint,
    completeMatch,
    undoCompleteMatch,
    saveScore,
    formatScore,
    formatSetScore
  };
};

export default useScoringLogic;
