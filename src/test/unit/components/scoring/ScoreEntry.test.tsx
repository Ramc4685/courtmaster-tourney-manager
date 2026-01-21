import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScoreEntry } from '../../../../components/scoring/ScoreEntry';
import { ScoringRules } from '../../../../types/tournament';

// Mock scoring rules
const mockBadmintonRules: ScoringRules = {
  pointsToWin: 21,
  mustWinByTwo: true,
  maxPoints: 30,
  setsToWin: 2
};

const mockTennisRules: ScoringRules = {
  pointsToWin: 6,
  mustWinByTwo: true,
  maxPoints: 7,
  setsToWin: 2,
  tiebreakAt: 6
};

describe('ScoreEntry', () => {
  const defaultProps = {
    team1Name: 'Team A',
    team2Name: 'Team B',
    team1Score: 0,
    team2Score: 0,
    scoringRules: mockBadmintonRules,
    onScoreChange: vi.fn(),
    disabled: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render team names correctly', () => {
      render(<ScoreEntry {...defaultProps} />);
      
      expect(screen.getByText('Team A')).toBeInTheDocument();
      expect(screen.getByText('Team B')).toBeInTheDocument();
    });

    it('should display current scores', () => {
      render(<ScoreEntry {...defaultProps} team1Score={15} team2Score={12} />);
      
      expect(screen.getByDisplayValue('15')).toBeInTheDocument();
      expect(screen.getByDisplayValue('12')).toBeInTheDocument();
    });

    it('should render increment and decrement buttons', () => {
      render(<ScoreEntry {...defaultProps} />);
      
      const incrementButtons = screen.getAllByText('+');
      const decrementButtons = screen.getAllByText('-');
      
      expect(incrementButtons).toHaveLength(2); // One for each team
      expect(decrementButtons).toHaveLength(2); // One for each team
    });

    it('should show proper touch targets for mobile', () => {
      render(<ScoreEntry {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('min-h-[44px]'); // Minimum touch target size
      });
    });
  });

  describe('Score Input Validation', () => {
    it('should validate badminton scores correctly', () => {
      const onScoreChange = vi.fn();
      render(<ScoreEntry {...defaultProps} onScoreChange={onScoreChange} />);
      
      const team1Input = screen.getByDisplayValue('0');
      
      // Valid score
      fireEvent.change(team1Input, { target: { value: '21' } });
      expect(onScoreChange).toHaveBeenCalledWith(21, 0);
    });

    it('should reject invalid scores', async () => {
      const onScoreChange = vi.fn();
      render(<ScoreEntry {...defaultProps} onScoreChange={onScoreChange} />);
      
      const team1Input = screen.getByDisplayValue('0');
      
      // Negative score
      await userEvent.type(team1Input, '-5');
      expect(screen.getByText(/Invalid score/i)).toBeInTheDocument();
      expect(onScoreChange).not.toHaveBeenCalled();
    });

    it('should validate tennis scores correctly', () => {
      const onScoreChange = vi.fn();
      render(
        <ScoreEntry 
          {...defaultProps} 
          scoringRules={mockTennisRules}
          onScoreChange={onScoreChange} 
        />
      );
      
      const team1Input = screen.getByDisplayValue('0');
      
      // Valid tennis score
      fireEvent.change(team1Input, { target: { value: '6' } });
      expect(onScoreChange).toHaveBeenCalledWith(6, 0);
    });

    it('should enforce maximum points rule', async () => {
      const onScoreChange = vi.fn();
      render(<ScoreEntry {...defaultProps} onScoreChange={onScoreChange} />);
      
      const team1Input = screen.getByDisplayValue('0');
      
      // Score exceeding max points
      await userEvent.clear(team1Input);
      await userEvent.type(team1Input, '35');
      
      expect(screen.getByText(/exceeds maximum/i)).toBeInTheDocument();
      expect(onScoreChange).not.toHaveBeenCalledWith(35, 0);
    });

    it('should validate must-win-by-two rule', async () => {
      const onScoreChange = vi.fn();
      render(
        <ScoreEntry 
          {...defaultProps} 
          team1Score={20}
          team2Score={20}
          onScoreChange={onScoreChange} 
        />
      );
      
      const team1Input = screen.getByDisplayValue('20');
      
      // Score that doesn't satisfy win-by-two
      await userEvent.clear(team1Input);
      await userEvent.type(team1Input, '21');
      
      // Should show warning about deuce
      expect(screen.getByText(/deuce/i)).toBeInTheDocument();
    });
  });

  describe('Increment/Decrement Buttons', () => {
    it('should increment team1 score when + button clicked', async () => {
      const onScoreChange = vi.fn();
      render(<ScoreEntry {...defaultProps} onScoreChange={onScoreChange} />);
      
      const incrementButtons = screen.getAllByText('+');
      await userEvent.click(incrementButtons[0]); // Team 1 increment
      
      expect(onScoreChange).toHaveBeenCalledWith(1, 0);
    });

    it('should increment team2 score when + button clicked', async () => {
      const onScoreChange = vi.fn();
      render(<ScoreEntry {...defaultProps} onScoreChange={onScoreChange} />);
      
      const incrementButtons = screen.getAllByText('+');
      await userEvent.click(incrementButtons[1]); // Team 2 increment
      
      expect(onScoreChange).toHaveBeenCalledWith(0, 1);
    });

    it('should decrement team1 score when - button clicked', async () => {
      const onScoreChange = vi.fn();
      render(<ScoreEntry {...defaultProps} team1Score={5} onScoreChange={onScoreChange} />);
      
      const decrementButtons = screen.getAllByText('-');
      await userEvent.click(decrementButtons[0]); // Team 1 decrement
      
      expect(onScoreChange).toHaveBeenCalledWith(4, 0);
    });

    it('should not decrement below zero', async () => {
      const onScoreChange = vi.fn();
      render(<ScoreEntry {...defaultProps} team1Score={0} onScoreChange={onScoreChange} />);
      
      const decrementButtons = screen.getAllByText('-');
      await userEvent.click(decrementButtons[0]); // Team 1 decrement
      
      expect(onScoreChange).not.toHaveBeenCalled();
    });

    it('should have proper touch targets for mobile', () => {
      render(<ScoreEntry {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44); // 44px minimum
      });
    });
  });

  describe('Keyboard Input', () => {
    it('should handle keyboard input correctly', async () => {
      const onScoreChange = vi.fn();
      render(<ScoreEntry {...defaultProps} onScoreChange={onScoreChange} />);
      
      const team1Input = screen.getByDisplayValue('0');
      
      await userEvent.clear(team1Input);
      await userEvent.type(team1Input, '15');
      
      expect(onScoreChange).toHaveBeenCalledWith(15, 0);
    });

    it('should handle Enter key to confirm score', async () => {
      const onScoreChange = vi.fn();
      render(<ScoreEntry {...defaultProps} onScoreChange={onScoreChange} />);
      
      const team1Input = screen.getByDisplayValue('0');
      
      await userEvent.clear(team1Input);
      await userEvent.type(team1Input, '10{enter}');
      
      expect(onScoreChange).toHaveBeenCalledWith(10, 0);
    });

    it('should handle Tab navigation between inputs', async () => {
      render(<ScoreEntry {...defaultProps} />);
      
      const team1Input = screen.getByDisplayValue('0');
      const inputs = screen.getAllByRole('spinbutton');
      const team2Input = inputs[1];
      
      team1Input.focus();
      await userEvent.tab();
      
      expect(team2Input).toHaveFocus();
    });
  });

  describe('Disabled State', () => {
    it('should disable all inputs when disabled prop is true', () => {
      render(<ScoreEntry {...defaultProps} disabled={true} />);
      
      const inputs = screen.getAllByRole('spinbutton');
      const buttons = screen.getAllByRole('button');
      
      inputs.forEach(input => {
        expect(input).toBeDisabled();
      });
      
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should show disabled styling', () => {
      render(<ScoreEntry {...defaultProps} disabled={true} />);
      
      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach(input => {
        expect(input).toHaveClass('opacity-50');
      });
    });

    it('should not call onScoreChange when disabled', async () => {
      const onScoreChange = vi.fn();
      render(<ScoreEntry {...defaultProps} disabled={true} onScoreChange={onScoreChange} />);
      
      const incrementButtons = screen.getAllByText('+');
      await userEvent.click(incrementButtons[0]);
      
      expect(onScoreChange).not.toHaveBeenCalled();
    });
  });

  describe('Error Display', () => {
    it('should show error for invalid score input', async () => {
      render(<ScoreEntry {...defaultProps} />);
      
      const team1Input = screen.getByDisplayValue('0');
      
      await userEvent.clear(team1Input);
      await userEvent.type(team1Input, 'abc');
      
      expect(screen.getByText(/Invalid score/i)).toBeInTheDocument();
    });

    it('should clear error when valid score is entered', async () => {
      render(<ScoreEntry {...defaultProps} />);
      
      const team1Input = screen.getByDisplayValue('0');
      
      // Enter invalid score
      await userEvent.clear(team1Input);
      await userEvent.type(team1Input, 'abc');
      expect(screen.getByText(/Invalid score/i)).toBeInTheDocument();
      
      // Enter valid score
      await userEvent.clear(team1Input);
      await userEvent.type(team1Input, '15');
      
      await waitFor(() => {
        expect(screen.queryByText(/Invalid score/i)).not.toBeInTheDocument();
      });
    });

    it('should show sport-specific error messages', async () => {
      render(<ScoreEntry {...defaultProps} scoringRules={mockTennisRules} />);
      
      const team1Input = screen.getByDisplayValue('0');
      
      await userEvent.clear(team1Input);
      await userEvent.type(team1Input, '10'); // Invalid for tennis
      
      expect(screen.getByText(/tennis/i)).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should call onScoreChange immediately on input', async () => {
      const onScoreChange = vi.fn();
      render(<ScoreEntry {...defaultProps} onScoreChange={onScoreChange} />);
      
      const team1Input = screen.getByDisplayValue('0');
      
      await userEvent.clear(team1Input);
      await userEvent.type(team1Input, '1');
      
      expect(onScoreChange).toHaveBeenCalledWith(1, 0);
    });

    it('should debounce rapid input changes', async () => {
      const onScoreChange = vi.fn();
      render(<ScoreEntry {...defaultProps} onScoreChange={onScoreChange} />);
      
      const team1Input = screen.getByDisplayValue('0');
      
      // Rapid typing
      await userEvent.clear(team1Input);
      await userEvent.type(team1Input, '123', { delay: 10 });
      
      // Should debounce and only call once with final value
      await waitFor(() => {
        expect(onScoreChange).toHaveBeenLastCalledWith(123, 0);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ScoreEntry {...defaultProps} />);
      
      expect(screen.getByLabelText(/Team A score/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Team B score/i)).toBeInTheDocument();
    });

    it('should have proper ARIA descriptions for buttons', () => {
      render(<ScoreEntry {...defaultProps} />);
      
      const incrementButtons = screen.getAllByLabelText(/Increment.*score/i);
      const decrementButtons = screen.getAllByLabelText(/Decrement.*score/i);
      
      expect(incrementButtons).toHaveLength(2);
      expect(decrementButtons).toHaveLength(2);
    });

    it('should announce score changes to screen readers', async () => {
      render(<ScoreEntry {...defaultProps} />);
      
      const team1Input = screen.getByDisplayValue('0');
      
      await userEvent.clear(team1Input);
      await userEvent.type(team1Input, '15');
      
      expect(screen.getByRole('status')).toHaveTextContent(/Team A: 15/i);
    });

    it('should support keyboard navigation', async () => {
      render(<ScoreEntry {...defaultProps} />);
      
      const incrementButtons = screen.getAllByText('+');
      
      incrementButtons[0].focus();
      await userEvent.keyboard('{enter}');
      
      // Should increment score via keyboard
      expect(defaultProps.onScoreChange).toHaveBeenCalled();
    });
  });

  describe('Mobile Optimization', () => {
    it('should have large touch targets', () => {
      render(<ScoreEntry {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('min-h-[44px]', 'min-w-[44px]');
      });
    });

    it('should handle touch events properly', async () => {
      const onScoreChange = vi.fn();
      render(<ScoreEntry {...defaultProps} onScoreChange={onScoreChange} />);
      
      const incrementButton = screen.getAllByText('+')[0];
      
      fireEvent.touchStart(incrementButton);
      fireEvent.touchEnd(incrementButton);
      
      expect(onScoreChange).toHaveBeenCalledWith(1, 0);
    });

    it('should prevent double-tap zoom on buttons', () => {
      render(<ScoreEntry {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveStyle('touch-action: manipulation');
      });
    });
  });

  describe('Different Sports', () => {
    it('should adapt to tennis scoring rules', () => {
      render(<ScoreEntry {...defaultProps} scoringRules={mockTennisRules} />);
      
      const team1Input = screen.getByDisplayValue('0');
      
      fireEvent.change(team1Input, { target: { value: '6' } });
      
      expect(defaultProps.onScoreChange).toHaveBeenCalledWith(6, 0);
    });

    it('should show sport-specific validation messages', async () => {
      render(<ScoreEntry {...defaultProps} scoringRules={mockTennisRules} />);
      
      const team1Input = screen.getByDisplayValue('0');
      
      await userEvent.clear(team1Input);
      await userEvent.type(team1Input, '25'); // Too high for tennis
      
      expect(screen.getByText(/tennis.*maximum/i)).toBeInTheDocument();
    });

    it('should handle volleyball scoring correctly', () => {
      const volleyballRules: ScoringRules = {
        pointsToWin: 25,
        mustWinByTwo: true,
        maxPoints: 30,
        setsToWin: 3
      };
      
      render(<ScoreEntry {...defaultProps} scoringRules={volleyballRules} />);
      
      const team1Input = screen.getByDisplayValue('0');
      
      fireEvent.change(team1Input, { target: { value: '25' } });
      
      expect(defaultProps.onScoreChange).toHaveBeenCalledWith(25, 0);
    });
  });
});
