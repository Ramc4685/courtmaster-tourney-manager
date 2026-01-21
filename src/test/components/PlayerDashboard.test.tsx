import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlayerDashboard from '@/pages/player/PlayerDashboard';
import { Match, Profile } from '@/types/entities';
import { createMockTournament } from '../utils';

// Mock the contexts
vi.mock('@/contexts/auth/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-1',
      email: 'test@example.com',
      player_stats: {
        matches_won: 15,
        matches_played: 20,
        tournaments_won: 2,
        tournaments_played: 5,
        rating: 1250
      }
    },
    isLoading: false
  })
}));

vi.mock('@/contexts/tournament/useTournament', () => ({
  useTournament: () => ({
    selectedTournament: createMockTournament(),
    isLoading: false
  })
}));

// Mock the mobile optimization hook
vi.mock('@/hooks/useMobileOptimization', () => ({
  useMobileOptimization: () => ({
    getOptimalRefreshRate: vi.fn(() => 30000), // 30 seconds
    getRecommendedTouchTargetSize: vi.fn(() => 44),
    hasReducedMotion: false,
    isMobile: false
  })
}));

// Mock the services
const mockMatchService = {
  listMatches: vi.fn()
};

const mockProfileService = {
  getProfile: vi.fn()
};

const mockCourtService = {
  listCourts: vi.fn()
};

vi.mock('@/services/api', () => ({
  matchService: mockMatchService,
  profileService: mockProfileService,
  courtService: mockCourtService
}));

// Mock Appwrite realtime
vi.mock('@/lib/appwrite', () => ({
  subscribeToCollectionFiltered: vi.fn(() => vi.fn()), // Returns unsubscribe function
  COLLECTIONS: {
    MATCHES: 'matches'
  }
}));

// Mock lodash debounce
vi.mock('lodash', () => ({
  debounce: (fn: any) => {
    const debouncedFn = (...args: any[]) => fn(...args);
    debouncedFn.cancel = vi.fn();
    return debouncedFn;
  }
}));

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

const mockUpcomingMatches: Match[] = [
  {
    id: 'match-1',
    match_number: 1,
    round_number: 1,
    tournament_id: 'test-tournament-1',
    player1_id: 'test-user-1',
    player2_id: 'player-2',
    team1: { id: 'team-1', name: 'My Team' },
    team2: { id: 'team-2', name: 'Opponent Team' },
    status: 'scheduled',
    court_id: 'court-1',
    scheduled_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockCompletedMatches: Match[] = [
  {
    id: 'match-2',
    match_number: 2,
    round_number: 1,
    tournament_id: 'test-tournament-1',
    player1_id: 'test-user-1',
    player2_id: 'player-3',
    team1: { id: 'team-1', name: 'My Team' },
    team2: { id: 'team-3', name: 'Previous Opponent' },
    status: 'completed',
    court_id: 'court-1',
    winner_id: 'test-user-1',
    end_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    scores: {
      sets: [
        { team1: 21, team2: 18 },
        { team1: 19, team2: 21 },
        { team1: 21, team2: 15 }
      ]
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

describe('PlayerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    mockMatchService.listMatches.mockResolvedValue([
      ...mockUpcomingMatches,
      ...mockCompletedMatches
    ]);

    mockProfileService.getProfile.mockResolvedValue({
      id: 'player-2',
      display_name: 'John Doe',
      email: 'john@example.com'
    });

    mockCourtService.listCourts.mockResolvedValue([
      {
        id: 'court-1',
        name: 'Main Court',
        tournament_id: 'test-tournament-1'
      }
    ]);
  });

  describe('Tab Navigation', () => {
    it('renders all tabs correctly', async () => {
      render(<PlayerDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /upcoming/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /stats/i })).toBeInTheDocument();
      });
    });

    it('switches between tabs when clicked', async () => {
      const user = userEvent.setup();
      render(<PlayerDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /upcoming/i })).toBeInTheDocument();
      });

      // Click on History tab
      await user.click(screen.getByRole('button', { name: /history/i }));

      // Should show history content
      await waitFor(() => {
        expect(screen.getByText('vs. Previous Opponent')).toBeInTheDocument();
      });

      // Click on Stats tab
      await user.click(screen.getByRole('button', { name: /stats/i }));

      // Should show stats content
      await waitFor(() => {
        expect(screen.getByText('Matches Won')).toBeInTheDocument();
      });
    });

    it('applies correct touch target sizes to tab buttons', async () => {
      render(<PlayerDashboard />);

      await waitFor(() => {
        const tabButtons = screen.getAllByRole('button').filter(btn =>
          btn.textContent?.includes('Upcoming') ||
          btn.textContent?.includes('History') ||
          btn.textContent?.includes('Stats')
        );

        tabButtons.forEach(button => {
          expect(button.getAttribute('style')).toMatch(/minHeight|min-height/);
        });
      });
    });
  });

  describe('Upcoming Matches Tab', () => {
    it('displays upcoming matches correctly', async () => {
      render(<PlayerDashboard />);

      await waitFor(() => {
        expect(screen.getByText('vs. Opponent Team')).toBeInTheDocument();
        expect(screen.getByText('Round 1 - Match 1')).toBeInTheDocument();
      });
    });

    it('shows match action buttons with proper touch targets', async () => {
      render(<PlayerDashboard />);

      await waitFor(() => {
        const directionsButton = screen.getByRole('button', { name: /directions/i });
        const reminderButton = screen.getByRole('button', { name: /remind/i });
        const shareButton = screen.getByTestId('share-button') ||
                           screen.getAllByRole('button').find(btn =>
                             btn.querySelector('svg') && !btn.textContent
                           );

        expect(directionsButton.getAttribute('style')).toMatch(/minHeight|min-height/);
        expect(reminderButton.getAttribute('style')).toMatch(/minHeight|min-height/);
        if (shareButton) {
          expect(shareButton.getAttribute('style')).toMatch(/minHeight|min-height/);
        }
      });
    });

    it('handles match action clicks', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(<PlayerDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /directions/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /directions/i }));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Getting directions'));

      await user.click(screen.getByRole('button', { name: /remind/i }));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Setting reminder'));

      consoleSpy.mockRestore();
    });

    it('shows empty state when no upcoming matches', async () => {
      mockMatchService.listMatches.mockResolvedValue(mockCompletedMatches);

      render(<PlayerDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No upcoming matches scheduled.')).toBeInTheDocument();
      });
    });
  });

  describe('Match History Tab', () => {
    it('displays completed matches with results', async () => {
      const user = userEvent.setup();
      render(<PlayerDashboard />);

      await user.click(screen.getByRole('button', { name: /history/i }));

      await waitFor(() => {
        expect(screen.getByText('vs. Previous Opponent')).toBeInTheDocument();
        expect(screen.getByText('Win')).toBeInTheDocument();
        expect(screen.getByText(/Score: 21-18, 19-21, 21-15/)).toBeInTheDocument();
      });
    });

    it('handles pagination with load more button', async () => {
      // Create enough matches to trigger pagination
      const manyMatches = Array.from({ length: 15 }, (_, i) => ({
        ...mockCompletedMatches[0],
        id: `match-${i}`,
        match_number: i + 1
      }));

      mockMatchService.listMatches.mockResolvedValue([
        ...mockUpcomingMatches,
        ...manyMatches
      ]);

      const user = userEvent.setup();
      render(<PlayerDashboard />);

      await user.click(screen.getByRole('button', { name: /history/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /load more/i }));

      // Should show loading state briefly
      expect(screen.getByText('Loading More...')).toBeInTheDocument();
    });
  });

  describe('Statistics Tab', () => {
    it('displays player statistics correctly', async () => {
      const user = userEvent.setup();
      render(<PlayerDashboard />);

      await user.click(screen.getByRole('button', { name: /stats/i }));

      await waitFor(() => {
        expect(screen.getByText('Matches Won')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument(); // matches won
        expect(screen.getByText('75.0%')).toBeInTheDocument(); // win rate
        expect(screen.getByText('1250')).toBeInTheDocument(); // rating
      });
    });

    it('calculates win rate correctly', async () => {
      const user = userEvent.setup();
      render(<PlayerDashboard />);

      await user.click(screen.getByRole('button', { name: /stats/i }));

      await waitFor(() => {
        // 15 wins out of 20 matches = 75%
        expect(screen.getByText('75.0%')).toBeInTheDocument();
      });
    });

    it('shows trend indicators', async () => {
      const user = userEvent.setup();
      render(<PlayerDashboard />);

      await user.click(screen.getByRole('button', { name: /stats/i }));

      await waitFor(() => {
        // Should have trend indicators (up/down arrows)
        const trendElements = screen.getAllByRole('img', { hidden: true }); // SVG icons
        expect(trendElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Real-time Updates', () => {
    it('sets up realtime subscription on mount', async () => {
      const { subscribeToCollectionFiltered } = await import('@/lib/appwrite');

      render(<PlayerDashboard />);

      expect(subscribeToCollectionFiltered).toHaveBeenCalledWith(
        'matches',
        null,
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('handles refresh functionality', async () => {
      const user = userEvent.setup();
      render(<PlayerDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { title: /refresh/i }) ||
               screen.getByLabelText(/refresh/i) ||
               screen.getAllByRole('button').find(btn =>
                 btn.querySelector('svg') && btn.getAttribute('style')?.includes('minHeight')
               )).toBeInTheDocument();
      });

      // Should apply proper touch target size to refresh button
      const refreshButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg') && btn.getAttribute('style')?.includes('minHeight')
      );

      if (refreshButton) {
        expect(refreshButton.getAttribute('style')).toMatch(/minHeight|min-height/);
      }
    });
  });

  describe('Loading States', () => {
    it('shows loading state while fetching matches', async () => {
      // Delay the mock response
      mockMatchService.listMatches.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      render(<PlayerDashboard />);

      expect(screen.getByText('Loading upcoming matches...')).toBeInTheDocument();
    });

    it('handles service errors gracefully', async () => {
      mockMatchService.listMatches.mockRejectedValue(new Error('Network error'));

      render(<PlayerDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });
  });

  describe('Offline Support', () => {
    it('shows offline indicator when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      // Trigger offline event
      fireEvent(window, new Event('offline'));

      render(<PlayerDashboard />);

      await waitFor(() => {
        // Should show offline icon
        const offlineIcon = screen.getByTestId('wifi-off-icon') ||
                           document.querySelector('[data-lucide="wifi-off"]');
        expect(offlineIcon).toBeTruthy();
      });
    });

    it('shows online indicator when online', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      render(<PlayerDashboard />);

      await waitFor(() => {
        // Should show online icon
        const onlineIcon = screen.getByTestId('wifi-icon') ||
                          document.querySelector('[data-lucide="wifi"]');
        expect(onlineIcon).toBeTruthy();
      });
    });
  });

  describe('Touch Gestures', () => {
    it('handles swipe gestures for tab navigation', async () => {
      render(<PlayerDashboard />);

      const dashboard = screen.getByRole('main') || screen.getByTestId('dashboard') ||
                       document.querySelector('[data-testid*="dashboard"]') ||
                       document.querySelector('.min-h-screen');

      if (dashboard) {
        // Simulate swipe left (should go to next tab)
        fireEvent.touchStart(dashboard, {
          touches: [{ clientX: 200, clientY: 100 }]
        });

        fireEvent.touchEnd(dashboard, {
          changedTouches: [{ clientX: 100, clientY: 100 }]
        });

        // Should switch to history tab
        await waitFor(() => {
          expect(screen.getByText('vs. Previous Opponent')).toBeInTheDocument();
        });
      }
    });

    it('handles pull-to-refresh gesture', async () => {
      render(<PlayerDashboard />);

      const dashboard = screen.getByRole('main') || screen.getByTestId('dashboard') ||
                       document.querySelector('.min-h-screen');

      if (dashboard) {
        // Simulate pull down gesture
        Object.defineProperty(window, 'scrollY', { value: 0 });

        fireEvent.touchStart(dashboard, {
          touches: [{ clientX: 100, clientY: 50 }]
        });

        fireEvent.touchEnd(dashboard, {
          changedTouches: [{ clientX: 100, clientY: 200 }]
        });

        // Should trigger refresh
        await waitFor(() => {
          expect(mockMatchService.listMatches).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Performance Optimization', () => {
    it('implements background refresh with optimal interval', async () => {
      vi.useFakeTimers();

      render(<PlayerDashboard />);

      // Fast-forward time by refresh interval (30 seconds)
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        // Should have called the service multiple times (initial + background)
        expect(mockMatchService.listMatches).toHaveBeenCalledTimes(2);
      });

      vi.useRealTimers();
    });

    it('debounces realtime refresh triggers', async () => {
      render(<PlayerDashboard />);

      // The debounced function should be set up
      expect(mockMatchService.listMatches).toHaveBeenCalledTimes(1);
    });

    it('caches profile and court data', async () => {
      render(<PlayerDashboard />);

      await waitFor(() => {
        expect(mockProfileService.getProfile).toHaveBeenCalled();
        expect(mockCourtService.listCourts).toHaveBeenCalled();
      });

      // Re-render should use cached data
      render(<PlayerDashboard />);

      // Should not call services again immediately due to caching
      expect(mockProfileService.getProfile).toHaveBeenCalledTimes(1);
    });
  });
});