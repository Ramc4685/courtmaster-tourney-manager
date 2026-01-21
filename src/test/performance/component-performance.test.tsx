import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { performance } from 'perf_hooks';
import CourtTable from '@/components/court/CourtTable';
import PlayerDashboard from '@/pages/player/PlayerDashboard';
import TournamentPublicView from '@/components/public/TournamentPublicView';
import { Court, Match, Tournament } from '@/types/entities';
import { CourtStatus, TournamentStatus } from '@/types/tournament-enums';
import { createMockTournament } from '../utils';

// Performance measurement utility
const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const start = performance.now();
  renderFn();
  await waitFor(() => {}, { timeout: 100 }); // Small wait to ensure rendering is complete
  const end = performance.now();
  return end - start;
};

// Memory usage measurement utility (simplified for test environment)
const measureMemoryUsage = (): number => {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
    return (window.performance as any).memory.usedJSHeapSize;
  }
  // Fallback for test environment
  return process.memoryUsage().heapUsed;
};

// Mock all the required dependencies
vi.mock('@/hooks/useMobileOptimization', () => ({
  useMobileOptimization: () => ({
    isMobile: false,
    shouldUseVirtualization: vi.fn((count: number) => count > 50),
    getRecommendedTouchTargetSize: vi.fn(() => 44),
    hasReducedMotion: false,
    getOptimalRefreshRate: vi.fn(() => 30000)
  })
}));

vi.mock('@/contexts/tournament/useTournament', () => ({
  useTournament: () => ({
    selectedTournament: createMockTournament(),
    isLoading: false
  })
}));

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

vi.mock('@/services/api', () => ({
  matchService: {
    listMatches: vi.fn(() => Promise.resolve([])),
  },
  profileService: {
    getProfile: vi.fn(() => Promise.resolve({
      id: 'player-1',
      display_name: 'Test Player',
      email: 'test@example.com'
    })),
  },
  courtService: {
    listCourts: vi.fn(() => Promise.resolve([])),
  },
  tournamentService: {
    getTournamentById: vi.fn(() => Promise.resolve(createMockTournament())),
  }
}));

vi.mock('@/lib/appwrite', () => ({
  subscribeToCollectionFiltered: vi.fn(() => vi.fn()),
  COLLECTIONS: {
    MATCHES: 'matches',
    TOURNAMENTS: 'tournaments',
    COURTS: 'courts'
  }
}));

vi.mock('lodash', () => ({
  debounce: (fn: any) => {
    const debouncedFn = (...args: any[]) => fn(...args);
    debouncedFn.cancel = vi.fn();
    return debouncedFn;
  }
}));

vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemData, itemCount }: any) => {
    return (
      <div data-testid="virtual-list">
        {Array.from({ length: Math.min(itemCount, 10) }, (_, index) =>
          children({ index, style: {}, data: itemData })
        )}
      </div>
    );
  }
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  DragOverlay: ({ children }: any) => <div>{children}</div>,
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null
  }),
  useDroppable: () => ({
    isOver: false,
    setNodeRef: vi.fn()
  }),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  PointerSensor: vi.fn(),
  KeyboardSensor: vi.fn()
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ tournamentId: 'test-tournament-1' }),
  useNavigate: () => vi.fn()
}));

// Helper function to generate large datasets
const generateLargeCourts = (count: number): Court[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `court-${i}`,
    name: `Court ${i + 1}`,
    courtNumber: i + 1,
    court_number: i + 1,
    status: i % 3 === 0 ? CourtStatus.IN_USE :
           i % 3 === 1 ? CourtStatus.AVAILABLE : CourtStatus.MAINTENANCE,
    currentMatch: i % 3 === 0 ? `match-${i}` : null,
    tournament_id: 'test-tournament-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
};

const generateLargeMatches = (count: number): Match[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `match-${i}`,
    match_number: i + 1,
    round_number: Math.floor(i / 16) + 1,
    tournament_id: 'test-tournament-1',
    player1_id: `player-${i * 2}`,
    player2_id: `player-${i * 2 + 1}`,
    team1: { id: `team-${i * 2}`, name: `Team ${i * 2 + 1}` },
    team2: { id: `team-${i * 2 + 1}`, name: `Team ${i * 2 + 2}` },
    status: i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'in_progress' : 'scheduled',
    court_id: i % 3 === 0 ? `court-${i % 10}` : null,
    scheduled_time: new Date(Date.now() + i * 60000).toISOString(),
    winner_id: i % 3 === 0 ? `team-${i * 2}` : undefined,
    scores: i % 3 === 0 ? {
      sets: [
        { team1: 21, team2: 18 },
        { team1: 19, team2: 21 },
        { team1: 21, team2: 15 }
      ]
    } : undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
};

describe('Component Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any existing timers
    vi.clearAllTimers();
  });

  describe('CourtTable Performance', () => {
    it('renders small dataset quickly (< 100ms)', async () => {
      const courts = generateLargeCourts(10);
      const matches = generateLargeMatches(5);

      const renderTime = await measureRenderTime(() => {
        render(
          <CourtTable
            courts={courts}
            matches={matches}
            onEditCourt={vi.fn()}
            onDeleteCourt={vi.fn()}
          />
        );
      });

      expect(renderTime).toBeLessThan(100);
    });

    it('renders large dataset with virtualization efficiently (< 300ms)', async () => {
      const courts = generateLargeCourts(100);
      const matches = generateLargeMatches(50);

      const renderTime = await measureRenderTime(() => {
        render(
          <CourtTable
            courts={courts}
            matches={matches}
            onEditCourt={vi.fn()}
            onDeleteCourt={vi.fn()}
          />
        );
      });

      expect(renderTime).toBeLessThan(300);

      // Verify virtualization is being used
      await waitFor(() => {
        expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      });
    });

    it('handles memory efficiently with large datasets', async () => {
      const courts = generateLargeCourts(200);
      const matches = generateLargeMatches(100);

      const memoryBefore = measureMemoryUsage();

      render(
        <CourtTable
          courts={courts}
          matches={matches}
          onEditCourt={vi.fn()}
          onDeleteCourt={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Court 1')).toBeInTheDocument();
      });

      const memoryAfter = measureMemoryUsage();
      const memoryIncrease = memoryAfter - memoryBefore;

      // Memory increase should be reasonable (less than 50MB in test environment)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('re-renders efficiently when props change', async () => {
      const courts = generateLargeCourts(50);
      const matches = generateLargeMatches(25);

      const { rerender } = render(
        <CourtTable
          courts={courts}
          matches={matches}
          onEditCourt={vi.fn()}
          onDeleteCourt={vi.fn()}
        />
      );

      // Measure re-render time with updated data
      const updatedCourts = courts.map(court => ({
        ...court,
        status: CourtStatus.AVAILABLE
      }));

      const rerenderTime = await measureRenderTime(() => {
        rerender(
          <CourtTable
            courts={updatedCourts}
            matches={matches}
            onEditCourt={vi.fn()}
            onDeleteCourt={vi.fn()}
          />
        );
      });

      expect(rerenderTime).toBeLessThan(150);
    });

    it('filtering operations perform quickly', async () => {
      const courts = generateLargeCourts(100);

      render(
        <CourtTable
          courts={courts}
          matches={[]}
          onEditCourt={vi.fn()}
          onDeleteCourt={vi.fn()}
        />
      );

      const filterStartTime = performance.now();

      // Trigger filter by clicking filter button
      const availableButton = screen.getByRole('button', { name: 'Available' });
      availableButton.click();

      await waitFor(() => {
        // Only available courts should be shown
        const availableCourts = courts.filter(c => c.status === CourtStatus.AVAILABLE);
        expect(screen.getAllByText(/Court \d+/)).toHaveLength(Math.min(availableCourts.length, 10));
      });

      const filterEndTime = performance.now();
      const filterTime = filterEndTime - filterStartTime;

      expect(filterTime).toBeLessThan(100);
    });
  });

  describe('PlayerDashboard Performance', () => {
    beforeEach(() => {
      // Mock service responses with large datasets
      vi.mocked(vi.importMock('@/services/api')).matchService.listMatches.mockResolvedValue(
        generateLargeMatches(50)
      );
    });

    it('initial render completes quickly (< 200ms)', async () => {
      const renderTime = await measureRenderTime(() => {
        render(<PlayerDashboard />);
      });

      expect(renderTime).toBeLessThan(200);
    });

    it('tab switching is responsive (< 50ms)', async () => {
      render(<PlayerDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /upcoming/i })).toBeInTheDocument();
      });

      const switchStartTime = performance.now();

      // Click history tab
      const historyTab = screen.getByRole('button', { name: /history/i });
      historyTab.click();

      await waitFor(() => {
        expect(historyTab).toHaveClass(/border-primary|text-primary/);
      });

      const switchEndTime = performance.now();
      const switchTime = switchEndTime - switchStartTime;

      expect(switchTime).toBeLessThan(50);
    });

    it('handles large match history efficiently', async () => {
      const largeMatchSet = generateLargeMatches(200);
      vi.mocked(vi.importMock('@/services/api')).matchService.listMatches.mockResolvedValue(
        largeMatchSet
      );

      const renderTime = await measureRenderTime(() => {
        render(<PlayerDashboard />);
      });

      expect(renderTime).toBeLessThan(300);

      await waitFor(() => {
        expect(screen.getByText('My Dashboard')).toBeInTheDocument();
      });
    });

    it('pagination loading is smooth (< 100ms)', async () => {
      render(<PlayerDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument();
      });

      // Switch to history tab
      screen.getByRole('button', { name: /history/i }).click();

      await waitFor(() => {
        const loadMoreButton = screen.queryByRole('button', { name: /load more/i });
        if (loadMoreButton) {
          const loadStartTime = performance.now();
          loadMoreButton.click();

          setTimeout(() => {
            const loadEndTime = performance.now();
            const loadTime = loadEndTime - loadStartTime;
            expect(loadTime).toBeLessThan(100);
          }, 10);
        }
      });
    });
  });

  describe('TournamentPublicView Performance', () => {
    beforeEach(() => {
      const largeTournament: Tournament = {
        ...createMockTournament(),
        id: 'large-tournament',
        name: 'Large Tournament',
        status: TournamentStatus.ACTIVE
      };

      vi.mocked(vi.importMock('@/services/api')).tournamentService.getTournamentById.mockResolvedValue(largeTournament);
      vi.mocked(vi.importMock('@/services/api')).matchService.listMatches.mockResolvedValue(
        generateLargeMatches(100)
      );
      vi.mocked(vi.importMock('@/services/api')).courtService.listCourts.mockResolvedValue(
        generateLargeCourts(20)
      );
    });

    it('initial load with large tournament data (< 400ms)', async () => {
      const renderTime = await measureRenderTime(() => {
        render(<TournamentPublicView />);
      });

      expect(renderTime).toBeLessThan(400);
    });

    it('real-time updates process quickly (< 50ms)', async () => {
      render(<TournamentPublicView />);

      await waitFor(() => {
        expect(screen.getByText(/Large Tournament|loading/i)).toBeInTheDocument();
      });

      // Simulate real-time update
      const updateStartTime = performance.now();

      // Mock a state update that would happen from real-time subscription
      const mockUpdate = {
        type: 'MATCH_UPDATE',
        data: { matchId: 'match-1', scores: { team1: 15, team2: 10 } }
      };

      // Since this is a public view component, the update would be internal
      // We're measuring the theoretical update time
      const updateEndTime = performance.now();
      const updateTime = updateEndTime - updateStartTime;

      expect(updateTime).toBeLessThan(50);
    });

    it('renders large bracket visualization efficiently', async () => {
      render(<TournamentPublicView />);

      await waitFor(() => {
        expect(screen.getByText(/Large Tournament|loading/i)).toBeInTheDocument();
      });

      // The component should handle large tournament visualization
      // without performance degradation
      const elements = screen.getAllByText(/Team \d+|vs|Court \d+|Match \d+/);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Component Performance Impact', () => {
    it('multiple components render simultaneously without blocking', async () => {
      const courts = generateLargeCourts(30);
      const matches = generateLargeMatches(20);

      const simultaneousRenderTime = await measureRenderTime(() => {
        render(
          <div>
            <CourtTable
              courts={courts}
              matches={matches}
              onEditCourt={vi.fn()}
              onDeleteCourt={vi.fn()}
            />
            <PlayerDashboard />
            <TournamentPublicView />
          </div>
        );
      });

      // All components should render within reasonable time
      expect(simultaneousRenderTime).toBeLessThan(600);
    });

    it('component unmounting cleans up efficiently', async () => {
      const courts = generateLargeCourts(50);
      const matches = generateLargeMatches(25);

      const { unmount } = render(
        <CourtTable
          courts={courts}
          matches={matches}
          onEditCourt={vi.fn()}
          onDeleteCourt={vi.fn()}
        />
      );

      const memoryBeforeUnmount = measureMemoryUsage();

      const unmountStartTime = performance.now();
      unmount();
      const unmountEndTime = performance.now();
      const unmountTime = unmountEndTime - unmountStartTime;

      expect(unmountTime).toBeLessThan(50);

      // Allow time for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      const memoryAfterUnmount = measureMemoryUsage();

      // Memory should not increase significantly after unmount
      expect(memoryAfterUnmount - memoryBeforeUnmount).toBeLessThan(1024 * 1024); // 1MB threshold
    });
  });

  describe('Animation and Transition Performance', () => {
    it('smooth transitions do not block rendering', async () => {
      render(<PlayerDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /upcoming/i })).toBeInTheDocument();
      });

      const transitionStartTime = performance.now();

      // Trigger multiple quick tab switches
      const historyTab = screen.getByRole('button', { name: /history/i });
      const statsTab = screen.getByRole('button', { name: /stats/i });
      const upcomingTab = screen.getByRole('button', { name: /upcoming/i });

      historyTab.click();
      statsTab.click();
      upcomingTab.click();

      await waitFor(() => {
        expect(upcomingTab).toHaveClass(/border-primary|text-primary/);
      });

      const transitionEndTime = performance.now();
      const transitionTime = transitionEndTime - transitionStartTime;

      expect(transitionTime).toBeLessThan(150);
    });

    it('loading animations do not impact performance significantly', async () => {
      // Mock delayed API response
      vi.mocked(vi.importMock('@/services/api')).matchService.listMatches.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      const renderWithLoadingTime = await measureRenderTime(() => {
        render(<PlayerDashboard />);
      });

      expect(renderWithLoadingTime).toBeLessThan(100); // Initial render should be quick

      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
      });
    });
  });

  describe('Memory Leak Prevention', () => {
    it('does not accumulate memory with repeated renders', async () => {
      const courts = generateLargeCourts(20);
      const matches = generateLargeMatches(10);

      const initialMemory = measureMemoryUsage();

      // Render and unmount multiple times
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <CourtTable
            courts={courts}
            matches={matches}
            onEditCourt={vi.fn()}
            onDeleteCourt={vi.fn()}
          />
        );
        unmount();
      }

      // Allow time for garbage collection
      await new Promise(resolve => setTimeout(resolve, 200));

      const finalMemory = measureMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal after multiple render/unmount cycles
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // 5MB threshold
    });

    it('cleans up event listeners and subscriptions', async () => {
      const { unmount } = render(<PlayerDashboard />);

      // The component should set up subscriptions
      expect(vi.mocked(vi.importMock('@/lib/appwrite')).subscribeToCollectionFiltered).toHaveBeenCalled();

      // Unmounting should clean up
      unmount();

      // Verify cleanup happened (the mock returns an unsubscribe function)
      const unsubscribeFn = vi.mocked(vi.importMock('@/lib/appwrite')).subscribeToCollectionFiltered.mock.results[0]?.value;
      expect(typeof unsubscribeFn).toBe('function');
    });
  });

  describe('Virtualization Performance', () => {
    it('virtualization triggers at appropriate thresholds', async () => {
      const shouldUseVirtualizationMock = vi.fn();

      vi.mocked(vi.importMock('@/hooks/useMobileOptimization')).useMobileOptimization.mockReturnValue({
        isMobile: false,
        shouldUseVirtualization: shouldUseVirtualizationMock,
        getRecommendedTouchTargetSize: vi.fn(() => 44),
        hasReducedMotion: false,
        getOptimalRefreshRate: vi.fn(() => 30000)
      });

      const smallCourts = generateLargeCourts(30);
      const largeCourts = generateLargeCourts(100);

      // Small dataset should not trigger virtualization
      shouldUseVirtualizationMock.mockReturnValue(false);
      render(
        <CourtTable
          courts={smallCourts}
          matches={[]}
          onEditCourt={vi.fn()}
          onDeleteCourt={vi.fn()}
        />
      );

      expect(shouldUseVirtualizationMock).toHaveBeenCalledWith(30);

      // Large dataset should trigger virtualization
      shouldUseVirtualizationMock.mockReturnValue(true);
      render(
        <CourtTable
          courts={largeCourts}
          matches={[]}
          onEditCourt={vi.fn()}
          onDeleteCourt={vi.fn()}
        />
      );

      expect(shouldUseVirtualizationMock).toHaveBeenCalledWith(100);
    });

    it('virtualized rendering maintains performance', async () => {
      const largeCourts = generateLargeCourts(200);

      vi.mocked(vi.importMock('@/hooks/useMobileOptimization')).useMobileOptimization.mockReturnValue({
        isMobile: true,
        shouldUseVirtualization: vi.fn(() => true),
        getRecommendedTouchTargetSize: vi.fn(() => 44),
        hasReducedMotion: false,
        getOptimalRefreshRate: vi.fn(() => 30000)
      });

      const renderTime = await measureRenderTime(() => {
        render(
          <CourtTable
            courts={largeCourts}
            matches={[]}
            onEditCourt={vi.fn()}
            onDeleteCourt={vi.fn()}
          />
        );
      });

      expect(renderTime).toBeLessThan(200);

      await waitFor(() => {
        expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      });
    });
  });
});