
/**
 * Optimized hooks and utilities for the tournament context
 */
import { useCallback, useMemo, useRef, useEffect } from 'react';
import { Tournament, Match, Court, Team, TournamentCategory } from '@/types/tournament';
import { isDeepEqual } from '@/utils/performanceUtils';

// Custom hook for tracking if an object has changed
export function useHasChanged<T>(value: T): boolean {
  const previousRef = useRef<T>(value);
  const hasChanged = !isDeepEqual(previousRef.current, value);
  
  useEffect(() => {
    // Only update the ref if the value has changed
    if (hasChanged) {
      previousRef.current = value;
    }
  }, [value, hasChanged]);
  
  return hasChanged;
}

// Optimized tournament selectors
export function useTournamentMatches(tournament: Tournament | null) {
  return useMemo(() => tournament?.matches || [], [tournament?.matches]);
}

export function useTournamentTeams(tournament: Tournament | null) {
  return useMemo(() => tournament?.teams || [], [tournament?.teams]);
}

export function useTournamentCourts(tournament: Tournament | null) {
  return useMemo(() => tournament?.courts || [], [tournament?.courts]);
}

export function useTournamentCategories(tournament: Tournament | null) {
  return useMemo(() => tournament?.categories || [], [tournament?.categories]);
}

// Filtering hooks with memoization
export function useFilteredMatches(
  matches: Match[],
  filterFn: (match: Match) => boolean
) {
  return useMemo(() => matches.filter(filterFn), [matches, filterFn]);
}

export function useScheduledMatches(matches: Match[]) {
  return useFilteredMatches(
    matches,
    useCallback((match) => match.status === "SCHEDULED", [])
  );
}

export function useInProgressMatches(matches: Match[]) {
  return useFilteredMatches(
    matches,
    useCallback((match) => match.status === "IN_PROGRESS", [])
  );
}

export function useCompletedMatches(matches: Match[]) {
  return useFilteredMatches(
    matches,
    useCallback((match) => match.status === "COMPLETED", [])
  );
}

// Find a specific entity by ID with memoization
export function useFindMatchById(matches: Match[], matchId: string | undefined) {
  return useMemo(() => {
    if (!matchId) return null;
    return matches.find(match => match.id === matchId) || null;
  }, [matches, matchId]);
}

export function useFindTeamById(teams: Team[], teamId: string | undefined) {
  return useMemo(() => {
    if (!teamId) return null;
    return teams.find(team => team.id === teamId) || null;
  }, [teams, teamId]);
}

export function useFindCourtById(courts: Court[], courtId: string | undefined) {
  return useMemo(() => {
    if (!courtId) return null;
    return courts.find(court => court.id === courtId) || null;
  }, [courts, courtId]);
}

export function useFindCategoryById(categories: TournamentCategory[], categoryId: string | undefined) {
  return useMemo(() => {
    if (!categoryId) return null;
    return categories.find(category => category.id === categoryId) || null;
  }, [categories, categoryId]);
}
