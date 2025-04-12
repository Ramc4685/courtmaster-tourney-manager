import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateTournamentForm } from '../CreateTournamentForm';
import { TournamentFormat, Division } from '@/types/tournament-enums';
import { mockNavigate, mockToast } from '@/test/utils';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  toast: mockToast
}));

describe('CreateTournamentForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<CreateTournamentForm onSubmit={mockOnSubmit} />);

    // Basic tournament info
    expect(screen.getByLabelText(/tournament name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/format/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();

    // Registration settings
    expect(screen.getByLabelText(/enable registration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/require player profile/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    render(<CreateTournamentForm onSubmit={mockOnSubmit} />);

    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/tournament name/i), {
      target: { value: 'Test Tournament' }
    });
    fireEvent.change(screen.getByLabelText(/location/i), {
      target: { value: 'Test Location' }
    });
    fireEvent.change(screen.getByLabelText(/format/i), {
      target: { value: TournamentFormat.SINGLE_ELIMINATION }
    });

    // Add a division
    fireEvent.click(screen.getByText(/add division/i));
    fireEvent.change(screen.getByLabelText(/division name/i), {
      target: { value: 'Advanced' }
    });
    fireEvent.change(screen.getByLabelText(/division type/i), {
      target: { value: Division.ADVANCED }
    });

    // Submit form
    fireEvent.click(screen.getByText(/create tournament/i));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Tournament',
        location: 'Test Location',
        format: TournamentFormat.SINGLE_ELIMINATION,
        divisions: expect.arrayContaining([
          expect.objectContaining({
            name: 'Advanced',
            type: Division.ADVANCED
          })
        ])
      }));
    });
  });

  it('shows validation errors for required fields', async () => {
    render(<CreateTournamentForm onSubmit={mockOnSubmit} />);

    // Submit without filling required fields
    fireEvent.click(screen.getByText(/create tournament/i));

    await waitFor(() => {
      expect(screen.getByText(/tournament name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/location is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates date ranges', async () => {
    render(<CreateTournamentForm onSubmit={mockOnSubmit} />);

    // Set end date before start date
    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: '2024-04-02' }
    });
    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: '2024-04-01' }
    });

    fireEvent.click(screen.getByText(/create tournament/i));

    await waitFor(() => {
      expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('handles division and category management', async () => {
    render(<CreateTournamentForm onSubmit={mockOnSubmit} />);

    // Add division
    fireEvent.click(screen.getByText(/add division/i));
    expect(screen.getByLabelText(/division name/i)).toBeInTheDocument();

    // Add category to division
    fireEvent.click(screen.getByText(/add category/i));
    expect(screen.getByLabelText(/category name/i)).toBeInTheDocument();

    // Remove category
    fireEvent.click(screen.getByText(/remove category/i));
    await waitFor(() => {
      expect(screen.queryByLabelText(/category name/i)).not.toBeInTheDocument();
    });

    // Remove division
    fireEvent.click(screen.getByText(/remove division/i));
    await waitFor(() => {
      expect(screen.queryByLabelText(/division name/i)).not.toBeInTheDocument();
    });
  });
}); 