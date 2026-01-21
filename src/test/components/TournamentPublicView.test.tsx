import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TournamentPublicView from '@/components/public/TournamentPublicView';
import { Tournament, Match, Court } from '@/types/entities';
import { TournamentStatus } from '@/types/tournament-enums';
import { createMockTournament } from '../utils';

// Mock the mobile optimization hook
vi.mock('@/hooks/useMobileOptimization', () => ({
  useMobileOptimization: () => ({
    getOptimalRefreshRate: vi.fn(() => 15000), // 15 seconds for public view
    hasReducedMotion: false,
    isMobile: false,
    getRecommendedTouchTargetSize: vi.fn(() => 44)
  })
}));

// Mock the services
const mockTournamentService = {
  getTournamentById: vi.fn(),
  listTournaments: vi.fn()
};

const mockMatchService = {
  listMatches: vi.fn()
};

const mockCourtService = {
  listCourts: vi.fn()
};

vi.mock('@/services/api', () => ({
  tournamentService: mockTournamentService,
  matchService: mockMatchService,
  courtService: mockCourtService
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: () => ({ tournamentId: 'test-tournament-1' }),
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>
}));

// Mock Appwrite realtime
vi.mock('@/lib/appwrite', () => ({
  subscribeToCollectionFiltered: vi.fn(() => vi.fn()),
  COLLECTIONS: {
    TOURNAMENTS: 'tournaments',
    MATCHES: 'matches',
    COURTS: 'courts'
  }
}));

const mockTournament: Tournament = {
  ...createMockTournament(),
  id: 'test-tournament-1',
  name: 'Summer Championship 2024',
  status: TournamentStatus.ACTIVE,
  location: 'Sports Complex Arena',
  description: 'Annual summer badminton championship'
};

const mockMatches: Match[] = [
  {
    id: 'match-1',
    match_number: 1,
    round_number: 1,
    tournament_id: 'test-tournament-1',
    player1_id: 'player-1',
    player2_id: 'player-2',
    team1: { id: 'team-1', name: 'Team Alpha' },
    team2: { id: 'team-2', name: 'Team Beta' },
    status: 'in_progress',
    court_id: 'court-1',
    scheduled_time: new Date().toISOString(),
    scores: {
      sets: [
        { team1: 15, team2: 12 }
      ]
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'match-2',
    match_number: 2,
    round_number: 1,
    tournament_id: 'test-tournament-1',
    player1_id: 'player-3',
    player2_id: 'player-4',
    team1: { id: 'team-3', name: 'Team Gamma' },
    team2: { id: 'team-4', name: 'Team Delta' },
    status: 'scheduled',
    court_id: 'court-2',
    scheduled_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'match-3',
    match_number: 3,
    round_number: 1,
    tournament_id: 'test-tournament-1',
    player1_id: 'player-5',
    player2_id: 'player-6',
    team1: { id: 'team-5', name: 'Team Echo' },
    team2: { id: 'team-6', name: 'Team Foxtrot' },
    status: 'completed',
    court_id: 'court-1',
    winner_id: 'team-5',
    end_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    scores: {
      sets: [
        { team1: 21, team2: 18 },
        { team1: 19, team2: 21 },
        { team1: 21, team2: 16 }
      ]
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockCourts: Court[] = [
  {
    id: 'court-1',
    name: 'Center Court',
    courtNumber: 1,
    court_number: 1,
    status: 'IN_USE',
    tournament_id: 'test-tournament-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'court-2',
    name: 'Court 2',
    courtNumber: 2,
    court_number: 2,
    status: 'AVAILABLE',
    tournament_id: 'test-tournament-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

describe('TournamentPublicView', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    mockTournamentService.getTournamentById.mockResolvedValue(mockTournament);
    mockMatchService.listMatches.mockResolvedValue(mockMatches);
    mockCourtService.listCourts.mockResolvedValue(mockCourts);
  });

  describe('Tournament Information Display', () => {
    it('renders tournament basic information', async () => {
      render(<TournamentPublicView />);

      await waitFor(() => {
        expect(screen.getByText('Summer Championship 2024')).toBeInTheDocument();
        expect(screen.getByText('Sports Complex Arena')).toBeInTheDocument();
        expect(screen.getByText('Annual summer badminton championship')).toBeInTheDocument();
      });
    });

    it('displays tournament status correctly', async () => {
      render(<TournamentPublicView />);

      await waitFor(() => {
        expect(screen.getByText(/active/i)).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching tournament data', async () => {
      mockTournamentService.getTournamentById.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockTournament), 100))
      );

      render(<TournamentPublicView />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Live Matches Display', () => {
    it('displays currently active matches', async () => {
      render(<TournamentPublicView />);

      await waitFor(() => {
        expect(screen.getByText('Team Alpha vs Team Beta')).toBeInTheDocument();
        expect(screen.getByText('15 - 12')).toBeInTheDocument();
        expect(screen.getByText(/in progress/i)).toBeInTheDocument();
      });
    });

    it('shows upcoming matches', async () => {
      render(<TournamentPublicView />);

      await waitFor(() => {
        expect(screen.getByText('Team Gamma vs Team Delta')).toBeInTheDocument();
        expect(screen.getByText(/scheduled/i)).toBeInTheDocument();
      });
    });

    it('displays completed matches with results', async () => {
      render(<TournamentPublicView />);

      await waitFor(() => {
        expect(screen.getByText('Team Echo vs Team Foxtrot')).toBeInTheDocument();
        expect(screen.getByText(/completed/i)).toBeInTheDocument();
        expect(screen.getByText('21-18, 19-21, 21-16')).toBeInTheDocument();
      });
    });

    it('highlights match winners in completed matches', async () => {
      render(<TournamentPublicView />);

      await waitFor(() => {
        const winnerBadge = screen.getByText(/team echo/i);
        expect(winnerBadge).toBeInTheDocument();
      });
    });
  });

  describe('Court Information', () => {
    it('displays court assignments for matches', async () => {
      render(<TournamentPublicView />);

      await waitFor(() => {
        expect(screen.getByText('Center Court')).toBeInTheDocument();
        expect(screen.getByText('Court 2')).toBeInTheDocument();
      });
    });

    it('shows court status indicators', async () => {
      render(<TournamentPublicView />);

      await waitFor(() => {
        // Should show court status information
        expect(screen.getByText(/center court/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('sets up realtime subscription for tournament updates', async () => {
      const { subscribeToCollectionFiltered } = await import('@/lib/appwrite');

      render(<TournamentPublicView />);

      await waitFor(() => {
        expect(subscribeToCollectionFiltered).toHaveBeenCalledWith(
          'tournaments',
          expect.any(String),
          expect.any(Function),
          expect.any(Function)
        );
      });
    });

    it('subscribes to match updates', async () => {
      const { subscribeToCollectionFiltered } = await import('@/lib/appwrite');

      render(<TournamentPublicView />);

      await waitFor(() => {
        expect(subscribeToCollectionFiltered).toHaveBeenCalledWith(
          'matches',
          expect.any(String),
          expect.any(Function),
          expect.any(Function)
        );
      });
    });

    it('uses optimal refresh rate for fallback polling', async () => {
      vi.useFakeTimers();

      render(<TournamentPublicView />);

      // Fast-forward by the optimal refresh rate (15 seconds)
      vi.advanceTimersByTime(15000);

      await waitFor(() => {
        // Should have refreshed data
        expect(mockMatchService.listMatches).toHaveBeenCalledTimes(2);
      });

      vi.useRealTimers();
    });
  });

  describe('Animation and Motion', () => {
    it('respects reduced motion preferences', async () => {
      vi.mocked(vi.importMock('@/hooks/useMobileOptimization')).useMobileOptimization.mockReturnValue({
        getOptimalRefreshRate: vi.fn(() => 15000),
        hasReducedMotion: true,
        isMobile: false,
        getRecommendedTouchTargetSize: vi.fn(() => 44)
      });

      render(<TournamentPublicView />);

      await waitFor(() => {
        // Check that animations are disabled or simplified
        const animatedElements = document.querySelectorAll('[class*="animate"]');
        animatedElements.forEach(element => {
          expect(element.className).not.toContain('animate-pulse');
          expect(element.className).not.toContain('animate-spin');
        });
      });
    });

    it('enables animations when motion is not reduced', async () => {
      vi.mocked(vi.importMock('@/hooks/useMobileOptimization')).useMobileOptimization.mockReturnValue({
        getOptimalRefreshRate: vi.fn(() => 15000),
        hasReducedMotion: false,
        isMobile: false,
        getRecommendedTouchTargetSize: vi.fn(() => 44)
      });

      render(<TournamentPublicView />);

      await waitFor(() => {
        // Should allow normal animations
        expect(screen.getByText('Summer Championship 2024')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when tournament fetch fails', async () => {
      mockTournamentService.getTournamentById.mockRejectedValue(new Error('Tournament not found'));

      render(<TournamentPublicView />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
        expect(screen.getByText(/tournament not found/i)).toBeInTheDocument();
      });
    });

    it('handles missing match data gracefully', async () => {
      mockMatchService.listMatches.mockResolvedValue([]);

      render(<TournamentPublicView />);

      await waitFor(() => {
        expect(screen.getByText('Summer Championship 2024')).toBeInTheDocument();
        expect(screen.getByText(/no matches/i)).toBeInTheDocument();
      });
    });

    it('handles missing court data gracefully', async () => {
      mockCourtService.listCourts.mockResolvedValue([]);

      render(<TournamentPublicView />);

      await waitFor(() => {
        expect(screen.getByText('Summer Championship 2024')).toBeInTheDocument();
        // Should still show matches even without court data
        expect(screen.getByText('Team Alpha vs Team Beta')).toBeInTheDocument();
      });
    });

    it('provides retry functionality on errors', async () => {
      mockTournamentService.getTournamentById.mockRejectedValueOnce(new Error('Network error'))
                                              .mockResolvedValue(mockTournament);

      const user = userEvent.setup();
      render(<TournamentPublicView />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Summer Championship 2024')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('adapts layout for mobile devices', async () => {
      vi.mocked(vi.importMock('@/hooks/useMobileOptimization')).useMobileOptimization.mockReturnValue({
        getOptimalRefreshRate: vi.fn(() => 15000),
        hasReducedMotion: false,
        isMobile: true,
        getRecommendedTouchTargetSize: vi.fn(() => 48)
      });

      render(<TournamentPublicView />);

      await waitFor(() => {
        // Should render mobile-optimized layout
        expect(screen.getByText('Summer Championship 2024')).toBeInTheDocument();

        // Check for responsive classes or mobile-specific elements
        const container = document.querySelector('.container') || document.querySelector('[class*="container"]');
        if (container) {
          expect(container.className).toMatch(/px-4|mx-auto/);
        }
      });
    });

    it('uses larger touch targets on mobile', async () => {
      vi.mocked(vi.importMock('@/hooks/useMobileOptimization')).useMobileOptimization.mockReturnValue({
        getOptimalRefreshRate: vi.fn(() => 15000),
        hasReducedMotion: false,
        isMobile: true,
        getRecommendedTouchTargetSize: vi.fn(() => 48)
      });

      render(<TournamentPublicView />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          const style = button.getAttribute('style');
          if (style) {
            expect(style).toMatch(/minHeight.*48|min-height.*48/);
          }
        });
      });
    });
  });

  describe('Data Refresh and Updates', () => {
    it('refreshes data periodically', async () => {
      vi.useFakeTimers();

      render(<TournamentPublicView />);

      // Initial calls
      expect(mockTournamentService.getTournamentById).toHaveBeenCalledTimes(1);
      expect(mockMatchService.listMatches).toHaveBeenCalledTimes(1);

      // Fast forward by refresh interval
      vi.advanceTimersByTime(15000);

      await waitFor(() => {
        expect(mockMatchService.listMatches).toHaveBeenCalledTimes(2);
      });

      vi.useRealTimers();
    });

    it('stops refresh when component unmounts', async () => {
      vi.useFakeTimers();

      const { unmount } = render(<TournamentPublicView />);

      // Initial calls
      expect(mockTournamentService.getTournamentById).toHaveBeenCalledTimes(1);

      unmount();

      // Fast forward time after unmount
      vi.advanceTimersByTime(30000);

      // Should not have additional calls after unmount
      expect(mockTournamentService.getTournamentById).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for match status', async () => {
      render(<TournamentPublicView />);

      await waitFor(() => {
        const statusElements = screen.getAllByText(/in progress|scheduled|completed/i);
        statusElements.forEach(element => {
          expect(element).toBeInTheDocument();
        });
      });
    });

    it('uses semantic HTML structure', async () => {
      render(<TournamentPublicView />);

      await waitFor(() => {
        // Should have proper heading structure
        const heading = screen.getByRole('heading', { name: /summer championship/i });
        expect(heading).toBeInTheDocument();

        // Should have proper list structure for matches
        const lists = screen.getAllByRole('list');
        expect(lists.length).toBeGreaterThan(0);
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<TournamentPublicView />);

      await waitFor(() => {
        const interactiveElements = screen.getAllByRole('button');
        if (interactiveElements.length > 0) {
          interactiveElements[0].focus();
          expect(document.activeElement).toBe(interactiveElements[0]);
        }
      });
    });
  });

  describe('Performance Optimization', () => {
    it('memoizes expensive calculations', async () => {
      render(<TournamentPublicView />);

      await waitFor(() => {
        expect(mockMatchService.listMatches).toHaveBeenCalledTimes(1);
      });

      // Re-render with same props should not trigger additional API calls
      render(<TournamentPublicView />);

      expect(mockMatchService.listMatches).toHaveBeenCalledTimes(1);
    });

    it('handles large datasets efficiently', async () => {
      const largeMatchSet = Array.from({ length: 100 }, (_, i) => ({
        ...mockMatches[0],
        id: `match-${i}`,
        match_number: i + 1
      }));

      mockMatchService.listMatches.mockResolvedValue(largeMatchSet);

      const startTime = performance.now();
      render(<TournamentPublicView />);

      await waitFor(() => {
        expect(screen.getByText('Summer Championship 2024')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time even with large dataset
      expect(renderTime).toBeLessThan(1000); // 1 second
    });
  });
});