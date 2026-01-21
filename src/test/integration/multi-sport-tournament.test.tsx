import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TournamentPublicView } from '../../components/public/TournamentPublicView';
import { createMockTournament, createMockTeam, mockAppwrite } from '../utils';
import { TournamentFormat } from '@/types/tournament-enums';

vi.mock('../../lib/appwrite', () => mockAppwrite);

describe('Multi-Sport Tournament Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Multiple Categories Tournament', () => {
    it('should display tournament with multiple categories', async () => {
      const tournament = createMockTournament({
        name: 'Multi-Sport Championship',
        format: TournamentFormat.SINGLE_ELIMINATION,
        categories: [
          {
            id: 'cat-1',
            name: "Men's Singles Badminton",
            type: 'SINGLES',
            division: 'OPEN'
          },
          {
            id: 'cat-2',
            name: "Women's Doubles Tennis",
            type: 'DOUBLES',
            division: 'OPEN'
          },
          {
            id: 'cat-3',
            name: "Mixed Volleyball",
            type: 'TEAM',
            division: 'OPEN'
          }
        ],
        teams: [
          ...Array.from({ length: 8 }, (_, i) =>
            createMockTeam({ id: `badminton-team-${i + 1}`, name: `Player ${i + 1}` })
          ),
          ...Array.from({ length: 4 }, (_, i) =>
            createMockTeam({ id: `tennis-team-${i + 1}`, name: `Pair ${i + 1}` })
          ),
          ...Array.from({ length: 6 }, (_, i) =>
            createMockTeam({ id: `volleyball-team-${i + 1}`, name: `Squad ${i + 1}` })
          )
        ]
      });

      mockAppwrite.databases.getDocument.mockResolvedValue(tournament);

      render(<TournamentPublicView tournamentId={tournament.id} />);

      await waitFor(() => {
        expect(screen.getByText('Multi-Sport Championship')).toBeInTheDocument();
      });

      // Verify categories are displayed
      expect(screen.getByText("Men's Singles Badminton")).toBeInTheDocument();
      expect(screen.getByText("Women's Doubles Tennis")).toBeInTheDocument();
      expect(screen.getByText("Mixed Volleyball")).toBeInTheDocument();
    });

    it('should handle tournament with no categories', async () => {
      const tournament = createMockTournament({
        name: 'Simple Tournament',
        categories: [],
        teams: []
      });

      mockAppwrite.databases.getDocument.mockResolvedValue(tournament);

      render(<TournamentPublicView tournamentId={tournament.id} />);

      await waitFor(() => {
        expect(screen.getByText('Simple Tournament')).toBeInTheDocument();
      });

      // Should handle empty state gracefully
      expect(screen.getByText(/No categories/i) || screen.getByText(/Tournament/i)).toBeInTheDocument();
    });

    it('should display tournament information correctly', async () => {
      const tournament = createMockTournament({
        name: 'Championship Tournament',
        description: 'Annual championship event',
        location: 'Sports Complex',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-02')
      });

      mockAppwrite.databases.getDocument.mockResolvedValue(tournament);

      render(<TournamentPublicView tournamentId={tournament.id} />);

      await waitFor(() => {
        expect(screen.getByText('Championship Tournament')).toBeInTheDocument();
      });

      expect(screen.getByText('Annual championship event')).toBeInTheDocument();
      expect(screen.getByText('Sports Complex')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockAppwrite.databases.getDocument.mockRejectedValue(new Error('Tournament not found'));

      render(<TournamentPublicView tournamentId="non-existent" />);

      await waitFor(() => {
        expect(screen.getByText(/error/i) || screen.getByText(/not found/i)).toBeInTheDocument();
      });
    });

    it('should handle loading states', async () => {
      // Mock a delayed response
      mockAppwrite.databases.getDocument.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(createMockTournament()), 100))
      );

      render(<TournamentPublicView tournamentId="tournament-1" />);

      // Should show loading state
      expect(screen.getByText(/loading/i) || screen.getByText(/Loading/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Test Tournament')).toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe('Tournament Categories Display', () => {
    it('should render different category types', async () => {
      const tournament = createMockTournament({
        categories: [
          {
            id: 'singles',
            name: 'Singles Category',
            type: 'SINGLES',
            division: 'OPEN'
          },
          {
            id: 'doubles',
            name: 'Doubles Category',
            type: 'DOUBLES',
            division: 'OPEN'
          },
          {
            id: 'team',
            name: 'Team Category',
            type: 'TEAM',
            division: 'OPEN'
          }
        ]
      });

      mockAppwrite.databases.getDocument.mockResolvedValue(tournament);

      render(<TournamentPublicView tournamentId={tournament.id} />);

      await waitFor(() => {
        expect(screen.getByText('Singles Category')).toBeInTheDocument();
        expect(screen.getByText('Doubles Category')).toBeInTheDocument();
        expect(screen.getByText('Team Category')).toBeInTheDocument();
      });
    });

    it('should handle tournaments with matches', async () => {
      const tournament = createMockTournament({
        matches: [
          {
            id: 'match-1',
            team1: createMockTeam({ name: 'Team A' }),
            team2: createMockTeam({ name: 'Team B' }),
            status: 'SCHEDULED',
            scores: []
          },
          {
            id: 'match-2',
            team1: createMockTeam({ name: 'Team C' }),
            team2: createMockTeam({ name: 'Team D' }),
            status: 'COMPLETED',
            scores: [{ team1: 21, team2: 15, completed: true, winner: 1 }]
          }
        ]
      });

      mockAppwrite.databases.getDocument.mockResolvedValue(tournament);

      render(<TournamentPublicView tournamentId={tournament.id} />);

      await waitFor(() => {
        expect(screen.getByText('Team A') || screen.getByText('Team C')).toBeInTheDocument();
      });
    });
  });
});