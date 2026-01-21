import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CourtTable from '@/components/court/CourtTable';
import { Court, Match } from '@/types/entities';
import { CourtStatus } from '@/types/tournament-enums';
import { createMockTournament } from '../utils';

// Mock the hooks
vi.mock('@/hooks/useMobileOptimization', () => ({
  useMobileOptimization: () => ({
    isMobile: false,
    shouldUseVirtualization: vi.fn(() => false),
    getRecommendedTouchTargetSize: vi.fn(() => 44),
    hasReducedMotion: false
  })
}));

vi.mock('@/contexts/tournament/useTournament', () => ({
  useTournament: () => ({
    selectedTournament: createMockTournament(),
    isLoading: false
  })
}));

// Mock react-window
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemData, itemCount }: any) => {
    return (
      <div data-testid="virtual-list">
        {Array.from({ length: itemCount }, (_, index) =>
          children({ index, style: {}, data: itemData })
        )}
      </div>
    );
  }
}));

// Mock dnd-kit
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

const mockCourts: Court[] = [
  {
    id: 'court-1',
    name: 'Main Court 1',
    courtNumber: 1,
    court_number: 1,
    status: CourtStatus.AVAILABLE,
    currentMatch: null,
    tournament_id: 'test-tournament-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'court-2',
    name: 'Practice Court 2',
    courtNumber: 2,
    court_number: 2,
    status: CourtStatus.IN_USE,
    currentMatch: 'match-1',
    tournament_id: 'test-tournament-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'court-3',
    name: 'Court 3',
    courtNumber: 3,
    court_number: 3,
    status: CourtStatus.MAINTENANCE,
    currentMatch: null,
    tournament_id: 'test-tournament-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

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
    court_id: 'court-2',
    courtId: 'court-2',
    scheduled_time: new Date().toISOString(),
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
    court_id: null,
    courtId: null,
    scheduled_time: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

describe('CourtTable', () => {
  const defaultProps = {
    courts: mockCourts,
    matches: mockMatches,
    onEditCourt: vi.fn(),
    onDeleteCourt: vi.fn(),
    onCourtUpdate: vi.fn(),
    onMatchUpdate: vi.fn(),
    onCourtAssignment: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders court table with provided courts', () => {
      render(<CourtTable {...defaultProps} />);

      expect(screen.getByText('Main Court 1')).toBeInTheDocument();
      expect(screen.getByText('Practice Court 2')).toBeInTheDocument();
      expect(screen.getByText('Court 3')).toBeInTheDocument();
    });

    it('displays court status badges correctly', () => {
      render(<CourtTable {...defaultProps} />);

      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('In Use')).toBeInTheDocument();
      expect(screen.getByText('Maintenance')).toBeInTheDocument();
    });

    it('shows match assignment section when unassigned matches exist', () => {
      render(<CourtTable {...defaultProps} />);

      expect(screen.getByText('Matches Awaiting Court Assignment')).toBeInTheDocument();
      expect(screen.getByText('Team Gamma vs Team Delta')).toBeInTheDocument();
    });

    it('displays current match information for courts in use', () => {
      render(<CourtTable {...defaultProps} />);

      expect(screen.getByText('Team Alpha vs Team Beta')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('filters courts by status when filter is applied', async () => {
      const user = userEvent.setup();
      render(<CourtTable {...defaultProps} />);

      // Click on "Available" filter
      await user.click(screen.getByRole('button', { name: 'Available' }));

      // Should only show available courts
      expect(screen.getByText('Main Court 1')).toBeInTheDocument();
      expect(screen.queryByText('Practice Court 2')).not.toBeInTheDocument();
    });

    it('shows all courts when "All Courts" filter is selected', async () => {
      const user = userEvent.setup();
      render(<CourtTable {...defaultProps} />);

      // First apply a filter
      await user.click(screen.getByRole('button', { name: 'In Use' }));

      // Then click "All Courts"
      await user.click(screen.getByRole('button', { name: 'All Courts' }));

      // All courts should be visible again
      expect(screen.getByText('Main Court 1')).toBeInTheDocument();
      expect(screen.getByText('Practice Court 2')).toBeInTheDocument();
      expect(screen.getByText('Court 3')).toBeInTheDocument();
    });
  });

  describe('Court Actions', () => {
    it('calls onEditCourt when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<CourtTable {...defaultProps} />);

      // Expand a court card first to access edit button
      const expandButton = screen.getAllByRole('button')[0]; // First expand button
      await user.click(expandButton);

      // Find and click edit button
      const editButton = screen.getByRole('button', { name: 'Edit Court' });
      await user.click(editButton);

      expect(defaultProps.onEditCourt).toHaveBeenCalledWith(mockCourts[0]);
    });

    it('calls onDeleteCourt when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<CourtTable {...defaultProps} />);

      // Expand a court card first
      const expandButton = screen.getAllByRole('button')[0];
      await user.click(expandButton);

      // Find and click delete button
      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(deleteButton);

      expect(defaultProps.onDeleteCourt).toHaveBeenCalledWith('court-1');
    });
  });

  describe('Touch Target Accessibility', () => {
    it('applies proper touch target sizes to interactive elements', () => {
      render(<CourtTable {...defaultProps} />);

      const buttons = screen.getAllByRole('button');

      // Check that buttons have minimum touch target size
      buttons.forEach((button) => {
        const style = window.getComputedStyle(button);
        // Note: In jsdom, computed styles might not reflect inline styles
        // So we check if the button has the style attribute
        expect(button.getAttribute('style')).toMatch(/minHeight|min-height/);
      });
    });
  });

  describe('Loading States', () => {
    it('renders empty state when no courts are provided', () => {
      render(<CourtTable {...defaultProps} courts={[]} />);

      expect(screen.getByText('No courts found matching the selected filter.')).toBeInTheDocument();
    });

    it('handles missing matches gracefully', () => {
      render(<CourtTable {...defaultProps} matches={[]} />);

      // Should still render courts
      expect(screen.getByText('Main Court 1')).toBeInTheDocument();
      // But no matches awaiting assignment section
      expect(screen.queryByText('Matches Awaiting Court Assignment')).not.toBeInTheDocument();
    });
  });

  describe('Court Statistics', () => {
    it('displays court statistics correctly', () => {
      render(<CourtTable {...defaultProps} />);

      // Check that statistics are displayed for each status
      const availableCount = mockCourts.filter(c => c.status === CourtStatus.AVAILABLE).length;
      const inUseCount = mockCourts.filter(c => c.status === CourtStatus.IN_USE).length;
      const maintenanceCount = mockCourts.filter(c => c.status === CourtStatus.MAINTENANCE).length;

      expect(screen.getByText(availableCount.toString())).toBeInTheDocument();
      expect(screen.getByText(inUseCount.toString())).toBeInTheDocument();
      expect(screen.getByText(maintenanceCount.toString())).toBeInTheDocument();
    });
  });

  describe('Mobile Optimization', () => {
    it('uses mobile layout when isMobile is true', () => {
      vi.mocked(vi.importMock('@/hooks/useMobileOptimization')).useMobileOptimization.mockReturnValue({
        isMobile: true,
        shouldUseVirtualization: vi.fn(() => false),
        getRecommendedTouchTargetSize: vi.fn(() => 48),
        hasReducedMotion: false
      });

      render(<CourtTable {...defaultProps} />);

      // Mobile layout should use cards instead of table
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('uses virtualization for large datasets', () => {
      vi.mocked(vi.importMock('@/hooks/useMobileOptimization')).useMobileOptimization.mockReturnValue({
        isMobile: true,
        shouldUseVirtualization: vi.fn(() => true),
        getRecommendedTouchTargetSize: vi.fn(() => 44),
        hasReducedMotion: false
      });

      const largeCourts = Array.from({ length: 100 }, (_, i) => ({
        ...mockCourts[0],
        id: `court-${i}`,
        name: `Court ${i}`,
        courtNumber: i
      }));

      render(<CourtTable {...defaultProps} courts={largeCourts} />);

      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing court properties gracefully', () => {
      const incompleteCourtData = [{
        id: 'incomplete-court',
        name: '',
        status: CourtStatus.AVAILABLE,
        tournament_id: 'test-tournament-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }] as Court[];

      expect(() => {
        render(<CourtTable {...defaultProps} courts={incompleteCourtData} />);
      }).not.toThrow();
    });

    it('handles callback errors gracefully', async () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      const user = userEvent.setup();
      render(<CourtTable {...defaultProps} onEditCourt={errorCallback} />);

      // Expand a court and try to edit
      const expandButton = screen.getAllByRole('button')[0];
      await user.click(expandButton);

      const editButton = screen.getByRole('button', { name: 'Edit Court' });

      // Should not crash the component
      expect(() => user.click(editButton)).not.toThrow();
    });
  });
});