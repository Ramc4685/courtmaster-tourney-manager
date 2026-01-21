import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SingleEliminationFormat } from '../../../services/tournament/formats/SingleEliminationFormat';
import { createMockTeam, createMockTournament } from '../../utils';
import { MatchStatus, TournamentFormat, TournamentStageEnum, CategoryType, Division } from '@/types/tournament-enums';

describe('SingleEliminationFormat', () => {
  let format: SingleEliminationFormat;

  beforeEach(() => {
    format = new SingleEliminationFormat();
    vi.clearAllMocks();
  });

  describe('generateMatches', () => {
    describe('Power of 2 teams', () => {
      it('should generate correct matches for 4 teams', () => {
        const teams = Array.from({ length: 4 }, (_, i) =>
          createMockTeam({ id: `team-${i + 1}`, name: `Team ${i + 1}` })
        );

        const mockCategory = {
          id: 'cat-1',
          name: 'Test Category',
          type: CategoryType.SINGLES,
          division: Division.OPEN
        };

        const matches = format.generateMatches(teams, mockCategory);

        expect(matches).toHaveLength(3); // 2 first round + 1 final

        // Check first round matches
        const firstRound = matches.filter(m => m.bracketRound === 1);
        expect(firstRound).toHaveLength(2);

        // Check final round
        const finalRound = matches.filter(m => m.bracketRound === 2);
        expect(finalRound).toHaveLength(1);

        // Verify match structure
        firstRound.forEach(match => {
          expect(match.team1.id).toBeDefined();
          expect(match.team2.id).toBeDefined();
          expect(match.status).toBe(MatchStatus.SCHEDULED);
          expect(match.stage).toBe(TournamentStageEnum.ELIMINATION_ROUND);
        });
      });

      it('should generate correct matches for 8 teams', () => {
        const teams = Array.from({ length: 8 }, (_, i) =>
          createMockTeam({ id: `team-${i + 1}` })
        );

        const mockCategory = {
          id: 'cat-1',
          name: 'Test Category',
          type: CategoryType.SINGLES,
          division: Division.OPEN
        };

        const matches = format.generateMatches(teams, mockCategory);

        expect(matches).toHaveLength(7); // 4 + 2 + 1

        const round1 = matches.filter(m => m.bracketRound === 1);
        const round2 = matches.filter(m => m.bracketRound === 2);
        const round3 = matches.filter(m => m.bracketRound === 3);

        expect(round1).toHaveLength(4);
        expect(round2).toHaveLength(2);
        expect(round3).toHaveLength(1);
      });

      it('should generate correct matches for 16 teams', () => {
        const teams = Array.from({ length: 16 }, (_, i) =>
          createMockTeam({ id: `team-${i + 1}` })
        );

        const mockCategory = {
          id: 'cat-1',
          name: 'Test Category',
          type: CategoryType.SINGLES,
          division: Division.OPEN
        };

        const matches = format.generateMatches(teams, mockCategory);

        expect(matches).toHaveLength(15); // 8 + 4 + 2 + 1

        const round1 = matches.filter(m => m.bracketRound === 1);
        const round2 = matches.filter(m => m.bracketRound === 2);
        const round3 = matches.filter(m => m.bracketRound === 3);
        const round4 = matches.filter(m => m.bracketRound === 4);

        expect(round1).toHaveLength(8);
        expect(round2).toHaveLength(4);
        expect(round3).toHaveLength(2);
        expect(round4).toHaveLength(1);
      });
    });

    describe('Non-power of 2 teams', () => {
      it('should handle 3 teams with bye', () => {
        const teams = Array.from({ length: 3 }, (_, i) =>
          createMockTeam({ id: `team-${i + 1}`, initialRanking: i + 1 })
        );

        const mockCategory = {
          id: 'cat-1',
          name: 'Test Category',
          type: CategoryType.SINGLES,
          division: Division.OPEN
        };

        const matches = format.generateMatches(teams, mockCategory);

        expect(matches).toHaveLength(2); // 1 first round + 1 final

        // One match should have actual teams
        const firstRound = matches.filter(m => m.bracketRound === 1);
        expect(firstRound).toHaveLength(1);

        const firstMatch = firstRound[0];
        expect(firstMatch.team1.id).toBeDefined();
        expect(firstMatch.team2.id).toBeDefined();

        // Check that finals exist
        const finals = matches.filter(m => m.bracketRound === 2);
        expect(finals).toHaveLength(1);
      });

      it('should handle 5 teams with byes', () => {
        const teams = Array.from({ length: 5 }, (_, i) =>
          createMockTeam({ id: `team-${i + 1}`, initialRanking: i + 1 })
        );

        const mockCategory = {
          id: 'cat-1',
          name: 'Test Category',
          type: CategoryType.SINGLES,
          division: Division.OPEN
        };

        const matches = format.generateMatches(teams, mockCategory);

        expect(matches.length).toBeGreaterThan(0);

        const firstRound = matches.filter(m => m.bracketRound === 1);
        expect(firstRound.length).toBeGreaterThan(0);
      });

      it('should handle 7 teams with bye', () => {
        const teams = Array.from({ length: 7 }, (_, i) =>
          createMockTeam({ id: `team-${i + 1}`, initialRanking: i + 1 })
        );

        const mockCategory = {
          id: 'cat-1',
          name: 'Test Category',
          type: CategoryType.SINGLES,
          division: Division.OPEN
        };

        const matches = format.generateMatches(teams, mockCategory);

        expect(matches.length).toBeGreaterThan(0);

        const firstRound = matches.filter(m => m.bracketRound === 1);
        expect(firstRound.length).toBeGreaterThan(0);
      });
    });

    describe('Edge cases', () => {
      it('should handle minimum teams (2)', () => {
        const teams = [
          createMockTeam({ id: 'team-1' }),
          createMockTeam({ id: 'team-2' })
        ];

        const mockCategory = {
          id: 'cat-1',
          name: 'Test Category',
          type: CategoryType.SINGLES,
          division: Division.OPEN
        };

        const matches = format.generateMatches(teams, mockCategory);

        expect(matches).toHaveLength(1);
        expect(matches[0].bracketRound).toBe(1);
        expect(matches[0].team1.id).toBe('team-1');
        expect(matches[0].team2.id).toBe('team-2');
      });

      it('should return empty array for single team', () => {
        const teams = [createMockTeam({ id: 'team-1' })];

        const mockCategory = {
          id: 'cat-1',
          name: 'Test Category',
          type: CategoryType.SINGLES,
          division: Division.OPEN
        };

        const matches = format.generateMatches(teams, mockCategory);
        expect(matches).toEqual([]);
      });

      it('should return empty array for empty teams array', () => {
        const mockCategory = {
          id: 'cat-1',
          name: 'Test Category',
          type: CategoryType.SINGLES,
          division: Division.OPEN
        };

        const matches = format.generateMatches([], mockCategory);
        expect(matches).toEqual([]);
      });
    });
  });

  describe('generateBracket', () => {
    it('should create proper bracket structure', () => {
      const teams = Array.from({ length: 4 }, (_, i) =>
        createMockTeam({ id: `team-${i + 1}` })
      );

      const bracket = format.generateBracket(teams);

      expect(bracket).toBeDefined();
      expect(bracket.length).toBeGreaterThan(0);

      // Check that bracket has proper structure
      const finalRound = bracket.filter(m => m.bracketRound === Math.max(...bracket.map(m => m.bracketRound)));
      expect(finalRound).toHaveLength(1);
      expect(finalRound[0].stage).toBe(TournamentStageEnum.ELIMINATION_ROUND);
    });

    it('should link matches properly in bracket', () => {
      const teams = Array.from({ length: 8 }, (_, i) =>
        createMockTeam({ id: `team-${i + 1}` })
      );

      const bracket = format.generateBracket(teams);

      // Verify that progression is set up correctly
      const round1 = bracket.filter(m => m.bracketRound === 1);
      const round2 = bracket.filter(m => m.bracketRound === 2);

      round1.forEach(match => {
        expect(match.progression?.nextMatchId).toBeDefined();
      });

      expect(round2.length).toBe(Math.ceil(round1.length / 2));
    });
  });

  describe('handleByes', () => {
    it('should assign byes to top seeds correctly', () => {
      const teams = Array.from({ length: 3 }, (_, i) =>
        createMockTeam({ id: `team-${i + 1}`, seed: i + 1 })
      );

      const result = format.handleByes(teams);

      expect(result.byes).toBeDefined();
      expect(result.matches).toBeDefined();
      expect(result.byes.length).toBeGreaterThan(0);
    });

    it('should handle multiple byes correctly', () => {
      const teams = Array.from({ length: 6 }, (_, i) =>
        createMockTeam({ id: `team-${i + 1}`, seed: i + 1 })
      );

      const result = format.handleByes(teams);

      expect(result.byes).toBeDefined();
      expect(result.matches).toBeDefined();
      expect(result.matches.length).toBeGreaterThan(0);
    });
  });

  describe('updateMatchProgression', () => {
    it('should advance winners correctly', () => {
      const teams = Array.from({ length: 4 }, (_, i) =>
        createMockTeam({ id: `team-${i + 1}` })
      );

      const tournament = createMockTournament({
        teams,
        format: TournamentFormat.SINGLE_ELIMINATION
      });

      const mockCategory = {
        id: 'cat-1',
        name: 'Test Category',
        type: CategoryType.SINGLES,
        division: Division.OPEN
      };

      const matches = format.generateMatches(teams, mockCategory);
      tournament.matches = matches;

      // Complete a first round match
      const firstRoundMatch = matches.find(m => m.bracketRound === 1);
      if (firstRoundMatch) {
        firstRoundMatch.status = MatchStatus.COMPLETED;
        firstRoundMatch.winner = firstRoundMatch.team1;

        const updatedTournament = format.updateMatchProgression(tournament, firstRoundMatch);

        // Check that winner advanced to next round
        const nextRoundMatches = updatedTournament.matches.filter(m => m.bracketRound === 2);
        const nextMatch = nextRoundMatches.find(m =>
          m.team1.id === firstRoundMatch.winner?.id || m.team2.id === firstRoundMatch.winner?.id
        );

        expect(nextMatch).toBeDefined();
      }
    });

    it('should not advance if match is not completed', () => {
      const teams = Array.from({ length: 4 }, (_, i) =>
        createMockTeam({ id: `team-${i + 1}` })
      );

      const tournament = createMockTournament({
        teams,
        format: TournamentFormat.SINGLE_ELIMINATION
      });

      const mockCategory = {
        id: 'cat-1',
        name: 'Test Category',
        type: CategoryType.SINGLES,
        division: Division.OPEN
      };

      const matches = format.generateMatches(teams, mockCategory);
      tournament.matches = matches;

      // Try to update with incomplete match
      const firstRoundMatch = matches.find(m => m.bracketRound === 1);
      if (firstRoundMatch) {
        firstRoundMatch.status = MatchStatus.IN_PROGRESS;

        const updatedTournament = format.updateMatchProgression(tournament, firstRoundMatch);

        // Tournament should remain unchanged
        expect(updatedTournament.matches).toEqual(matches);
      }
    });
  });

  describe('validateFormat', () => {
    it('should validate correct tournament configurations', () => {
      const tournament = createMockTournament({
        teams: Array.from({ length: 4 }, (_, i) => createMockTeam({ id: `team-${i + 1}` })),
        format: TournamentFormat.SINGLE_ELIMINATION
      });

      const result = format.validateFormat(tournament);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should catch invalid tournament configurations', () => {
      const tournament = createMockTournament({
        teams: [createMockTeam({ id: 'team-1' })], // Only 1 team
        format: TournamentFormat.SINGLE_ELIMINATION
      });

      const result = format.validateFormat(tournament);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate team count requirements', () => {
      const tournament = createMockTournament({
        teams: [],
        format: TournamentFormat.SINGLE_ELIMINATION
      });

      const result = format.validateFormat(tournament);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tournament must have at least 2 teams');
    });
  });

  describe('validateScore', () => {
    it('should validate scores based on match category settings', () => {
      const mockMatch = {
        id: 'match-1',
        category: {
          id: 'cat-1',
          name: 'Test Category',
          scoringSettings: {
            pointsToWin: 21,
            mustWinByTwo: true,
            maxPoints: 30,
            maxSets: 3
          }
        }
      };

      const validScore = [21, 15, 21, 18]; // Two sets: 21-15, 21-18

      const result = format.validateScore(mockMatch as any, validScore);

      expect(result).toBe(true);
    });

    it('should reject invalid scores', () => {
      const mockMatch = {
        id: 'match-1',
        category: {
          id: 'cat-1',
          name: 'Test Category',
          scoringSettings: {
            pointsToWin: 21,
            mustWinByTwo: true,
            maxPoints: 30,
            maxSets: 3
          }
        }
      };

      const invalidScore = [35, 15]; // Exceeds max points

      const result = format.validateScore(mockMatch as any, invalidScore);

      expect(result).toBe(false);
    });
  });

  describe('calculateStandings', () => {
    it('should rank teams by tournament progress', () => {
      const teams = Array.from({ length: 4 }, (_, i) =>
        createMockTeam({ id: `team-${i + 1}`, name: `Team ${i + 1}` })
      );

      const tournament = createMockTournament({
        teams,
        format: TournamentFormat.SINGLE_ELIMINATION
      });

      const mockCategory = {
        id: 'cat-1',
        name: 'Test Category',
        type: CategoryType.SINGLES,
        division: Division.OPEN
      };

      const matches = format.generateMatches(teams, mockCategory);

      // Complete some matches to create standings
      const firstRoundMatch = matches.find(m => m.bracketRound === 1 && m.team1.id === 'team-1');
      if (firstRoundMatch) {
        firstRoundMatch.status = MatchStatus.COMPLETED;
        firstRoundMatch.winner = firstRoundMatch.team1;
      }

      tournament.matches = matches;

      const standings = format.calculateStandings(tournament);

      expect(standings).toBeDefined();
      expect(standings.length).toBe(teams.length);

      // Winner should have advanced further
      const winner = standings.find(s => s.id === 'team-1');
      expect(winner).toBeDefined();
    });

    it('should handle completed tournament', () => {
      const teams = Array.from({ length: 4 }, (_, i) =>
        createMockTeam({ id: `team-${i + 1}` })
      );

      const tournament = createMockTournament({
        teams,
        format: TournamentFormat.SINGLE_ELIMINATION
      });

      const mockCategory = {
        id: 'cat-1',
        name: 'Test Category',
        type: CategoryType.SINGLES,
        division: Division.OPEN
      };

      const matches = format.generateMatches(teams, mockCategory);

      // Complete all matches
      matches.forEach(match => {
        match.status = MatchStatus.COMPLETED;
        match.winner = match.team1; // Team 1 always wins
      });

      tournament.matches = matches;

      const standings = format.calculateStandings(tournament);

      expect(standings.length).toBe(teams.length);
      // The algorithm should rank teams by how far they advanced
      expect(standings[0]).toBeDefined();
    });
  });

  describe('canAddTeams and canRemoveTeams', () => {
    it('should allow team changes before tournament starts', () => {
      const tournament = createMockTournament({
        status: TournamentStatus.DRAFT,
        teams: Array.from({ length: 4 }, (_, i) => createMockTeam({ id: `team-${i + 1}` }))
      });

      // Mock all matches as scheduled
      tournament.matches = tournament.matches.map(m => ({ ...m, status: MatchStatus.SCHEDULED }));

      expect(format.canAddTeams(tournament)).toBe(true);
      expect(format.canRemoveTeams(tournament)).toBe(true);
    });

    it('should not allow team changes after tournament starts', () => {
      const tournament = createMockTournament({
        status: TournamentStatus.IN_PROGRESS,
        teams: Array.from({ length: 4 }, (_, i) => createMockTeam({ id: `team-${i + 1}` }))
      });

      // Mock some matches as in progress
      tournament.matches = tournament.matches.map((m, i) => ({
        ...m,
        status: i === 0 ? MatchStatus.IN_PROGRESS : MatchStatus.SCHEDULED
      }));

      expect(format.canAddTeams(tournament)).toBe(false);
      expect(format.canRemoveTeams(tournament)).toBe(false);
    });

    it('should not allow team changes in completed tournament', () => {
      const tournament = createMockTournament({
        status: TournamentStatus.COMPLETED,
        teams: Array.from({ length: 4 }, (_, i) => createMockTeam({ id: `team-${i + 1}` }))
      });

      // Mock all matches as completed
      tournament.matches = tournament.matches.map(m => ({ ...m, status: MatchStatus.COMPLETED }));

      expect(format.canAddTeams(tournament)).toBe(false);
      expect(format.canRemoveTeams(tournament)).toBe(false);
    });
  });

  describe('third place match', () => {
    it('should generate third place match when enabled', () => {
      const teams = Array.from({ length: 4 }, (_, i) =>
        createMockTeam({ id: `team-${i + 1}` })
      );

      const mockCategory = {
        id: 'cat-1',
        name: 'Test Category',
        type: CategoryType.SINGLES,
        division: Division.OPEN
      };

      const config = { thirdPlaceMatch: true };
      const matches = format.generateBracket(teams, config, mockCategory);

      const thirdPlaceMatches = matches.filter(m => m.stage === TournamentStageEnum.THIRD_PLACE);
      expect(thirdPlaceMatches).toHaveLength(1);

      const thirdPlace = thirdPlaceMatches[0];
      expect(thirdPlace.team1.id).toBe('TBD'); // Will be filled from semifinal losers
      expect(thirdPlace.team2.id).toBe('TBD');
    });

    it('should not generate third place match by default', () => {
      const teams = Array.from({ length: 4 }, (_, i) =>
        createMockTeam({ id: `team-${i + 1}` })
      );

      const mockCategory = {
        id: 'cat-1',
        name: 'Test Category',
        type: CategoryType.SINGLES,
        division: Division.OPEN
      };

      const matches = format.generateBracket(teams, undefined, mockCategory);

      const thirdPlaceMatches = matches.filter(m => m.stage === TournamentStageEnum.THIRD_PLACE);
      expect(thirdPlaceMatches).toHaveLength(0);
    });
  });
});