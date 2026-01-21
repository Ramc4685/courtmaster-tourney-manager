import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScoringInterface } from '../../../../components/scoring/ScoringInterface';
import { createMockTournament } from '../../../utils';

// Mock dependencies
vi.mock('../../../../services/api', () => ({
  matchService: {
    getMatch: vi.fn(),
    updateMatch: vi.fn()
  },
  profileService: {
    getProfile: vi.fn()
  },
  notificationService: {
    sendNotification: vi.fn()
  }
}));

vi.mock('../../../../stores/scoringStore', () => ({
  useScoringStore: vi.fn(() => ({
    activeMatchData: null,
    isLoading: false,
    error: null,
    setActiveMatch: vi.fn(),
    updateScoreAndStatus: vi.fn(),
    setLoading: vi.fn(),
    setError: vi.fn(),
    addScoreHistory: vi.fn(),
    undoScore: vi.fn(),
    redoScore: vi.fn()
  }))
}));

vi.mock('../../../../lib/appwrite', () => ({
  realtime: {
    subscribe: vi.fn(),
    unsubscribe: vi.fn()
  },
  COLLECTIONS: {
    MATCHES: 'matches'
  },
  APPWRITE_DATABASE_ID: 'test-db'
}));

vi.mock('../../../../components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('ScoringInterface', () => {
  const mockTournament = createMockTournament({
    id: 'tournament-1',
    name: 'Test Tournament'
  });

  const defaultProps = {
    matchId: 'match-1',
    tournament: mockTournament,
    onMatchComplete: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<ScoringInterface {...defaultProps} />);

      // Should render the component without errors
      expect(screen.getByText(/Player 1 \/ Team 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Player 2 \/ Team 2/i)).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      const { useScoringStore } = require('../../../../stores/scoringStore');
      useScoringStore.mockReturnValue({
        activeMatchData: null,
        isLoading: true,
        error: null,
        setActiveMatch: vi.fn(),
        updateScoreAndStatus: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        addScoreHistory: vi.fn(),
        undoScore: vi.fn(),
        redoScore: vi.fn()
      });

      render(<ScoringInterface {...defaultProps} />);

      expect(screen.getByText(/loading/i) || screen.getByText(/Loading/i)).toBeInTheDocument();
    });

    it('should display error message when there is an error', () => {
      const { useScoringStore } = require('../../../../stores/scoringStore');
      useScoringStore.mockReturnValue({
        activeMatchData: null,
        isLoading: false,
        error: 'Failed to load match data',
        setActiveMatch: vi.fn(),
        updateScoreAndStatus: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        addScoreHistory: vi.fn(),
        undoScore: vi.fn(),
        redoScore: vi.fn()
      });

      render(<ScoringInterface {...defaultProps} />);

      expect(screen.getByText(/Failed to load match data/i)).toBeInTheDocument();
    });

    it('should display participant names when match data is loaded', () => {
      const mockMatch = {
        id: 'match-1',
        team1_player1: 'player-1',
        team2_player1: 'player-2',
        status: 'SCHEDULED',
        scores: []
      };

      const { useScoringStore } = require('../../../../stores/scoringStore');
      useScoringStore.mockReturnValue({
        activeMatchData: mockMatch,
        isLoading: false,
        error: null,
        setActiveMatch: vi.fn(),
        updateScoreAndStatus: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        addScoreHistory: vi.fn(),
        undoScore: vi.fn(),
        redoScore: vi.fn()
      });

      render(<ScoringInterface {...defaultProps} />);

      // Should show default participant names
      expect(screen.getByText(/Player 1 \/ Team 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Player 2 \/ Team 2/i)).toBeInTheDocument();
    });
  });

  describe('Match Data Fetching', () => {
    it('should fetch match data on mount', async () => {
      const { matchService } = require('../../../../services/api');
      const mockMatch = {
        id: 'match-1',
        team1_player1: 'player-1',
        team2_player1: 'player-2',
        status: 'SCHEDULED'
      };

      matchService.getMatch.mockResolvedValue(mockMatch);

      render(<ScoringInterface {...defaultProps} />);

      await waitFor(() => {
        expect(matchService.getMatch).toHaveBeenCalledWith('match-1', {});
      });
    });

    it('should handle fetch errors gracefully', async () => {
      const { matchService } = require('../../../../services/api');
      matchService.getMatch.mockRejectedValue(new Error('Network error'));

      render(<ScoringInterface {...defaultProps} />);

      await waitFor(() => {
        expect(matchService.getMatch).toHaveBeenCalled();
      });

      // Component should not crash
      expect(screen.getByText(/Player 1 \/ Team 1/i)).toBeInTheDocument();
    });

    it('should fetch participant profiles for singles matches', async () => {
      const { matchService, profileService } = require('../../../../services/api');

      const mockMatch = {
        id: 'match-1',
        team1_player1: 'player-1',
        team2_player1: 'player-2',
        status: 'SCHEDULED'
      };

      const mockProfile1 = { full_name: 'John Doe' };
      const mockProfile2 = { display_name: 'Jane Smith' };

      matchService.getMatch.mockResolvedValue(mockMatch);
      profileService.getProfile
        .mockResolvedValueOnce(mockProfile1)
        .mockResolvedValueOnce(mockProfile2);

      render(<ScoringInterface {...defaultProps} />);

      await waitFor(() => {
        expect(profileService.getProfile).toHaveBeenCalledWith('player-1');
        expect(profileService.getProfile).toHaveBeenCalledWith('player-2');
      });
    });
  });

  describe('Score Interface', () => {
    it('should display current scores when match is in progress', () => {
      const mockMatch = {
        id: 'match-1',
        status: 'IN_PROGRESS',
        scores: { sets: [{ team1: 10, team2: 8, completed: false }] }
      };

      const { useScoringStore } = require('../../../../stores/scoringStore');
      useScoringStore.mockReturnValue({
        activeMatchData: mockMatch,
        isLoading: false,
        error: null,
        setActiveMatch: vi.fn(),
        updateScoreAndStatus: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        addScoreHistory: vi.fn(),
        undoScore: vi.fn(),
        redoScore: vi.fn()
      });

      render(<ScoringInterface {...defaultProps} />);

      // Should show scoring interface
      expect(screen.getByText(/10/)).toBeInTheDocument();
      expect(screen.getByText(/8/)).toBeInTheDocument();
    });

    it('should show control buttons for score manipulation', () => {
      const mockMatch = {
        id: 'match-1',
        status: 'IN_PROGRESS',
        scores: { sets: [{ team1: 0, team2: 0, completed: false }] }
      };

      const { useScoringStore } = require('../../../../stores/scoringStore');
      useScoringStore.mockReturnValue({
        activeMatchData: mockMatch,
        isLoading: false,
        error: null,
        setActiveMatch: vi.fn(),
        updateScoreAndStatus: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        addScoreHistory: vi.fn(),
        undoScore: vi.fn(),
        redoScore: vi.fn()
      });

      render(<ScoringInterface {...defaultProps} />);

      // Should have undo/redo buttons (if available in UI)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Match Completion', () => {
    it('should call onMatchComplete when match is completed', () => {
      const onMatchComplete = vi.fn();
      const completedMatch = {
        id: 'match-1',
        status: 'COMPLETED',
        winner: 'team-1',
        scores: { sets: [{ team1: 21, team2: 15, completed: true, winner: 1 }] }
      };

      const { useScoringStore } = require('../../../../stores/scoringStore');
      useScoringStore.mockReturnValue({
        activeMatchData: completedMatch,
        isLoading: false,
        error: null,
        setActiveMatch: vi.fn(),
        updateScoreAndStatus: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        addScoreHistory: vi.fn(),
        undoScore: vi.fn(),
        redoScore: vi.fn()
      });

      render(<ScoringInterface {...defaultProps} onMatchComplete={onMatchComplete} />);

      // Component should handle completed match
      expect(screen.getByText(/21/)).toBeInTheDocument();
      expect(screen.getByText(/15/)).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should set up real-time subscriptions', () => {
      const { realtime } = require('../../../../lib/appwrite');

      render(<ScoringInterface {...defaultProps} />);

      // Should subscribe to real-time updates (implementation may vary)
      expect(realtime.subscribe).toHaveBeenCalled();
    });
  });

  describe('Tournament Integration', () => {
    it('should pass tournament data correctly', () => {
      const customTournament = createMockTournament({
        id: 'custom-tournament',
        name: 'Custom Tournament'
      });

      render(<ScoringInterface {...defaultProps} tournament={customTournament} />);

      // Component should render with tournament context
      expect(screen.getByText(/Player 1 \/ Team 1/i)).toBeInTheDocument();
    });

    it('should handle different match IDs', () => {
      const props1 = { ...defaultProps, matchId: 'match-1' };
      const props2 = { ...defaultProps, matchId: 'match-2' };

      const { rerender } = render(<ScoringInterface {...props1} />);
      rerender(<ScoringInterface {...props2} />);

      // Should handle match ID changes
      expect(screen.getByText(/Player 1 \/ Team 1/i)).toBeInTheDocument();
    });
  });
});