import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateId,
  findMatchById,
  findCourtById,
  findCourtByNumber,
  updateMatchInTournament,
  updateCourtInTournament,
  freeCourt,
  sortTeamsByRanking,
  areAllMatchesInStageCompleted,
  findNextScheduledMatch
} from '../../../utils/tournamentUtils';
import { createMockTournament, createMockTeam, createMockMatch, createMockCourt } from '../../utils';
import { MatchStatus, CourtStatus } from '@/types/tournament-enums';

describe('tournamentUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      const id3 = generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id3).toBeDefined();
      
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should generate IDs with correct format', () => {
      const id = generateId();
      
      // Should be a string
      expect(typeof id).toBe('string');
      
      // Should have reasonable length (UUIDs are typically 36 chars with hyphens)
      expect(id.length).toBeGreaterThan(10);
    });

    it('should generate multiple unique IDs in sequence', () => {
      const ids = Array.from({ length: 100 }, () => generateId());
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(100);
    });
  });

  describe('findMatchById', () => {
    it('should find match by ID in tournament', () => {
      const tournament = createMockTournament();
      const match = createMockMatch({ id: 'match-123' });
      tournament.matches = [match];
      
      const foundMatch = findMatchById(tournament, 'match-123');
      
      expect(foundMatch).toBe(match);
    });

    it('should return undefined for non-existent match ID', () => {
      const tournament = createMockTournament();
      tournament.matches = [createMockMatch({ id: 'match-1' })];
      
      const foundMatch = findMatchById(tournament, 'non-existent');
      
      expect(foundMatch).toBeUndefined();
    });

    it('should return undefined for empty matches array', () => {
      const tournament = createMockTournament();
      tournament.matches = [];
      
      const foundMatch = findMatchById(tournament, 'any-id');
      
      expect(foundMatch).toBeUndefined();
    });

    it('should handle null or undefined tournament', () => {
      expect(findMatchById(null as any, 'match-id')).toBeUndefined();
      expect(findMatchById(undefined as any, 'match-id')).toBeUndefined();
    });

    it('should handle null or undefined match ID', () => {
      const tournament = createMockTournament();
      tournament.matches = [createMockMatch({ id: 'match-1' })];
      
      expect(findMatchById(tournament, null as any)).toBeUndefined();
      expect(findMatchById(tournament, undefined as any)).toBeUndefined();
    });
  });

  describe('findCourtById', () => {
    it('should find court by ID', () => {
      const tournament = createMockTournament();
      const court = createMockCourt({ id: 'court-123' });
      tournament.courts = [court];
      
      const foundCourt = findCourtById(tournament, 'court-123');
      
      expect(foundCourt).toBe(court);
    });

    it('should return undefined for non-existent court ID', () => {
      const tournament = createMockTournament();
      tournament.courts = [createMockCourt({ id: 'court-1' })];
      
      const foundCourt = findCourtById(tournament, 'non-existent');
      
      expect(foundCourt).toBeUndefined();
    });

    it('should return undefined for empty courts array', () => {
      const tournament = createMockTournament();
      tournament.courts = [];
      
      const foundCourt = findCourtById(tournament, 'any-id');
      
      expect(foundCourt).toBeUndefined();
    });
  });

  describe('findCourtByNumber', () => {
    it('should find court by number', () => {
      const tournament = createMockTournament();
      const court = createMockCourt({ number: 5 });
      tournament.courts = [court];
      
      const foundCourt = findCourtByNumber(tournament, 5);
      
      expect(foundCourt).toBe(court);
    });

    it('should return undefined for non-existent court number', () => {
      const tournament = createMockTournament();
      tournament.courts = [createMockCourt({ number: 1 })];
      
      const foundCourt = findCourtByNumber(tournament, 99);
      
      expect(foundCourt).toBeUndefined();
    });

    it('should handle multiple courts and find correct one', () => {
      const tournament = createMockTournament();
      const court1 = createMockCourt({ number: 1 });
      const court2 = createMockCourt({ number: 2 });
      const court3 = createMockCourt({ number: 3 });
      tournament.courts = [court1, court2, court3];
      
      expect(findCourtByNumber(tournament, 1)).toBe(court1);
      expect(findCourtByNumber(tournament, 2)).toBe(court2);
      expect(findCourtByNumber(tournament, 3)).toBe(court3);
    });
  });

  describe('updateMatchInTournament', () => {
    it('should update match and preserve tournament structure', () => {
      const tournament = createMockTournament();
      const originalMatch = createMockMatch({ id: 'match-1', status: 'SCHEDULED' });
      tournament.matches = [originalMatch];

      const updatedMatch = { ...originalMatch, status: 'IN_PROGRESS' };
      const result = updateMatchInTournament(tournament, updatedMatch);

      expect(result.matches[0]).toEqual(updatedMatch);
      expect(result.matches[0].status).toBe('IN_PROGRESS');
      expect(result.updatedAt).toBeDefined();
      expect(result.updatedAt).not.toBe(tournament.updatedAt);
    });

    it('should update timestamp when match is updated', () => {
      const tournament = createMockTournament();
      const originalTimestamp = tournament.updatedAt;
      const match = createMockMatch({ id: 'match-1' });
      tournament.matches = [match];

      // Wait a bit to ensure timestamp difference
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      const updatedMatch = { ...match, status: 'COMPLETED' };
      const result = updateMatchInTournament(tournament, updatedMatch);

      expect(result.updatedAt).not.toBe(originalTimestamp);

      vi.useRealTimers();
    });

    it('should not modify original tournament object', () => {
      const tournament = createMockTournament();
      const match = createMockMatch({ id: 'match-1', status: 'SCHEDULED' });
      tournament.matches = [match];

      const updatedMatch = { ...match, status: 'COMPLETED' };
      const result = updateMatchInTournament(tournament, updatedMatch);

      expect(tournament.matches[0].status).toBe('SCHEDULED');
      expect(result.matches[0].status).toBe('COMPLETED');
      expect(result).not.toBe(tournament);
    });

    it('should handle non-existent match ID gracefully', () => {
      const tournament = createMockTournament();
      const existingMatch = createMockMatch({ id: 'match-1' });
      tournament.matches = [existingMatch];

      const nonExistentMatch = createMockMatch({ id: 'non-existent' });
      const result = updateMatchInTournament(tournament, nonExistentMatch);

      // Should return tournament unchanged
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0]).toBe(existingMatch);
    });
  });

  describe('updateCourtInTournament', () => {
    it('should update court and preserve tournament structure', () => {
      const tournament = createMockTournament();
      const originalCourt = createMockCourt({ id: 'court-1', status: 'AVAILABLE' });
      tournament.courts = [originalCourt];

      const updatedCourt = { ...originalCourt, status: 'IN_USE' };
      const result = updateCourtInTournament(tournament, updatedCourt);

      expect(result.courts[0]).toEqual(updatedCourt);
      expect(result.courts[0].status).toBe('IN_USE');
      expect(result.updatedAt).toBeDefined();
    });

    it('should not modify original tournament object', () => {
      const tournament = createMockTournament();
      const court = createMockCourt({ id: 'court-1', status: 'AVAILABLE' });
      tournament.courts = [court];

      const updatedCourt = { ...court, status: 'IN_USE' };
      const result = updateCourtInTournament(tournament, updatedCourt);

      expect(tournament.courts[0].status).toBe('AVAILABLE');
      expect(result.courts[0].status).toBe('IN_USE');
      expect(result).not.toBe(tournament);
    });
  });

  describe('freeCourt', () => {
    it('should set court status to available', () => {
      const tournament = createMockTournament();
      const court = createMockCourt({ number: 1, status: CourtStatus.IN_USE });
      tournament.courts = [court];

      const result = freeCourt(tournament, 1);

      expect(result.courts[0].status).toBe('AVAILABLE');
      expect(result.courts[0].currentMatch).toBeUndefined();
    });

    it('should clear current match from court', () => {
      const tournament = createMockTournament();
      const court = createMockCourt({
        number: 1,
        status: CourtStatus.IN_USE,
        currentMatch: 'match-1'
      });
      tournament.courts = [court];

      const result = freeCourt(tournament, 1);

      expect(result.courts[0].currentMatch).toBeUndefined();
    });

    it('should handle non-existent court number gracefully', () => {
      const tournament = createMockTournament();
      const court = createMockCourt({ number: 1 });
      tournament.courts = [court];

      const result = freeCourt(tournament, 99);

      expect(result.courts).toHaveLength(1);
      expect(result.courts[0]).toBe(court);
    });
  });

  describe('sortTeamsByRanking', () => {
    it('should sort teams by ranking in ascending order', () => {
      const team1 = createMockTeam({ initialRanking: 3 });
      const team2 = createMockTeam({ initialRanking: 1 });
      const team3 = createMockTeam({ initialRanking: 2 });
      const teams = [team1, team2, team3];

      const sorted = sortTeamsByRanking(teams);

      expect(sorted[0].initialRanking).toBe(1);
      expect(sorted[1].initialRanking).toBe(2);
      expect(sorted[2].initialRanking).toBe(3);
    });

    it('should handle teams without rankings', () => {
      const team1 = createMockTeam({ initialRanking: 2 });
      const team2 = createMockTeam({ initialRanking: undefined });
      const team3 = createMockTeam({ initialRanking: 1 });
      const teams = [team1, team2, team3];

      const sorted = sortTeamsByRanking(teams);

      // Teams with rankings should come first, sorted by ranking
      expect(sorted[0].initialRanking).toBe(1);
      expect(sorted[1].initialRanking).toBe(2);
      expect(sorted[2].initialRanking).toBeUndefined();
    });

    it('should handle all teams without rankings', () => {
      const team1 = createMockTeam({ initialRanking: undefined });
      const team2 = createMockTeam({ initialRanking: undefined });
      const teams = [team1, team2];

      const sorted = sortTeamsByRanking(teams);

      expect(sorted).toHaveLength(2);
      expect(sorted[0].initialRanking).toBeUndefined();
      expect(sorted[1].initialRanking).toBeUndefined();
    });

    it('should handle empty array', () => {
      const sorted = sortTeamsByRanking([]);
      expect(sorted).toEqual([]);
    });

    it('should not modify original array', () => {
      const team1 = createMockTeam({ initialRanking: 3 });
      const team2 = createMockTeam({ initialRanking: 1 });
      const originalTeams = [team1, team2];

      const sorted = sortTeamsByRanking(originalTeams);

      expect(originalTeams[0]).toBe(team1);
      expect(originalTeams[1]).toBe(team2);
      expect(sorted[0]).toBe(team2);
      expect(sorted[1]).toBe(team1);
    });
  });

  describe('areAllMatchesInStageCompleted', () => {
    it('should return true when all matches in stage are completed', () => {
      const tournament = createMockTournament();
      const match1 = createMockMatch({ stage: 'semifinals', status: 'COMPLETED' });
      const match2 = createMockMatch({ stage: 'semifinals', status: 'COMPLETED' });
      tournament.matches = [match1, match2];

      const result = areAllMatchesInStageCompleted(tournament, 'semifinals');

      expect(result).toBe(true);
    });

    it('should return false when some matches in stage are not completed', () => {
      const tournament = createMockTournament();
      const match1 = createMockMatch({ stage: 'semifinals', status: 'COMPLETED' });
      const match2 = createMockMatch({ stage: 'semifinals', status: 'IN_PROGRESS' });
      tournament.matches = [match1, match2];

      const result = areAllMatchesInStageCompleted(tournament, 'semifinals');

      expect(result).toBe(false);
    });

    it('should return true for stage with no matches', () => {
      const tournament = createMockTournament();
      tournament.matches = [];

      const result = areAllMatchesInStageCompleted(tournament, 'finals');

      expect(result).toBe(true);
    });

    it('should ignore matches from other stages', () => {
      const tournament = createMockTournament();
      const match1 = createMockMatch({ stage: 'semifinals', status: 'COMPLETED' });
      const match2 = createMockMatch({ stage: 'finals', status: 'SCHEDULED' });
      tournament.matches = [match1, match2];

      const result = areAllMatchesInStageCompleted(tournament, 'semifinals');

      expect(result).toBe(true);
    });
  });

  describe('findNextScheduledMatch', () => {
    it('should find next unassigned scheduled match', () => {
      const tournament = createMockTournament();
      const match1 = createMockMatch({
        status: 'COMPLETED',
        courtNumber: 1
      });
      const match2 = createMockMatch({
        status: 'SCHEDULED',
        courtNumber: undefined
      });
      const match3 = createMockMatch({
        status: 'SCHEDULED',
        courtNumber: 2
      });
      tournament.matches = [match1, match2, match3];

      const result = findNextScheduledMatch(tournament);

      expect(result).toBe(match2);
    });

    it('should return undefined when no unassigned matches exist', () => {
      const tournament = createMockTournament();
      const match1 = createMockMatch({
        status: 'COMPLETED',
        courtNumber: 1
      });
      const match2 = createMockMatch({
        status: 'SCHEDULED',
        courtNumber: 2
      });
      tournament.matches = [match1, match2];

      const result = findNextScheduledMatch(tournament);

      expect(result).toBeUndefined();
    });

    it('should return undefined for empty matches array', () => {
      const tournament = createMockTournament();
      tournament.matches = [];

      const result = findNextScheduledMatch(tournament);

      expect(result).toBeUndefined();
    });

    it('should find matches without court assignments', () => {
      const tournament = createMockTournament();
      const match1 = createMockMatch({
        id: 'match-1',
        status: 'SCHEDULED',
        courtNumber: undefined,
        createdAt: new Date('2023-01-01T10:00:00Z')
      });
      const match2 = createMockMatch({
        id: 'match-2',
        status: 'SCHEDULED',
        courtNumber: undefined,
        createdAt: new Date('2023-01-01T09:00:00Z')
      });
      tournament.matches = [match1, match2];

      const result = findNextScheduledMatch(tournament);

      // Should find the first match without court assignment
      expect(result).toBe(match1);
    });
  });
});
