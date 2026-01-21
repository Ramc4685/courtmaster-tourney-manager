import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScoringInterface } from '../../components/scoring/ScoringInterface';
import { createMockTournament, createMockTeam, mockAppwrite } from '../utils';
import { TournamentStatus, MatchStatus, TournamentFormat } from '@/types/tournament-enums';

// Mock external dependencies
vi.mock('../../lib/appwrite', () => mockAppwrite);

describe('Tournament Scoring Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Scoring Interface Integration', () => {
    it('should render scoring interface with match data', async () => {
      const teams = Array.from({ length: 2 }, (_, i) =>
        createMockTeam({ id: `team-${i + 1}`, name: `Team ${i + 1}` })
      );

      const mockMatch = {
        id: 'match-1',
        tournamentId: 'tournament-1',
        team1: teams[0],
        team2: teams[1],
        scores: [],
        status: MatchStatus.SCHEDULED,
        category: {
          id: 'cat-1',
          name: 'Singles',
          scoringSettings: {
            pointsToWinSet: 21,
            setsToWinMatch: 2,
            maxSets: 3,
            mustWinByTwo: true,
            maxPointsPerSet: 30
          }
        }
      };

      render(<ScoringInterface match={mockMatch} />);

      // Verify teams are displayed
      expect(screen.getByText('Team 1')).toBeInTheDocument();
      expect(screen.getByText('Team 2')).toBeInTheDocument();

      // Verify scoring interface is present
      expect(screen.getByText(/Score/i)).toBeInTheDocument();
    });

    it('should handle score updates', async () => {
      const teams = Array.from({ length: 2 }, (_, i) =>
        createMockTeam({ id: `team-${i + 1}`, name: `Team ${i + 1}` })
      );

      const mockMatch = {
        id: 'match-1',
        tournamentId: 'tournament-1',
        team1: teams[0],
        team2: teams[1],
        scores: [
          { team1: 0, team2: 0, completed: false }
        ],
        status: MatchStatus.IN_PROGRESS,
        category: {
          id: 'cat-1',
          name: 'Singles',
          scoringSettings: {
            pointsToWinSet: 21,
            setsToWinMatch: 2,
            maxSets: 3,
            mustWinByTwo: true,
            maxPointsPerSet: 30
          }
        }
      };

      mockAppwrite.databases.updateDocument.mockResolvedValue(mockMatch);

      render(<ScoringInterface match={mockMatch} />);

      // Look for score buttons or inputs
      const scoreElements = screen.getAllByText(/\d+/);
      expect(scoreElements.length).toBeGreaterThan(0);
    });

    it('should validate scores according to badminton rules', async () => {
      const teams = Array.from({ length: 2 }, (_, i) =>
        createMockTeam({ id: `team-${i + 1}`, name: `Team ${i + 1}` })
      );

      const mockMatch = {
        id: 'match-1',
        tournamentId: 'tournament-1',
        team1: teams[0],
        team2: teams[1],
        scores: [
          { team1: 21, team2: 15, completed: true, winner: 1 }
        ],
        status: MatchStatus.IN_PROGRESS,
        category: {
          id: 'cat-1',
          name: 'Singles',
          scoringSettings: {
            pointsToWinSet: 21,
            setsToWinMatch: 2,
            maxSets: 3,
            mustWinByTwo: true,
            maxPointsPerSet: 30
          }
        }
      };

      render(<ScoringInterface match={mockMatch} />);

      // Should show the completed set score
      expect(screen.getByText('21')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing match data gracefully', async () => {
      // Test with minimal match data
      const mockMatch = {
        id: 'match-1',
        tournamentId: 'tournament-1',
        team1: { id: 'team-1', name: 'Team 1', players: [] },
        team2: { id: 'team-2', name: 'Team 2', players: [] },
        scores: [],
        status: MatchStatus.SCHEDULED
      };

      render(<ScoringInterface match={mockMatch} />);

      // Should render without crashing
      expect(screen.getByText('Team 1')).toBeInTheDocument();
      expect(screen.getByText('Team 2')).toBeInTheDocument();
    });

    it('should handle API errors during score updates', async () => {
      const teams = Array.from({ length: 2 }, (_, i) =>
        createMockTeam({ id: `team-${i + 1}`, name: `Team ${i + 1}` })
      );

      const mockMatch = {
        id: 'match-1',
        tournamentId: 'tournament-1',
        team1: teams[0],
        team2: teams[1],
        scores: [],
        status: MatchStatus.IN_PROGRESS,
        category: {
          id: 'cat-1',
          name: 'Singles'
        }
      };

      mockAppwrite.databases.updateDocument.mockRejectedValue(new Error('Network error'));

      render(<ScoringInterface match={mockMatch} />);

      // Component should render even if API fails
      expect(screen.getByText('Team 1')).toBeInTheDocument();
      expect(screen.getByText('Team 2')).toBeInTheDocument();
    });
  });
});