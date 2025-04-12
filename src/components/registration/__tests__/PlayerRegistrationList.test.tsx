import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlayerRegistrationList } from '../PlayerRegistrationList';
import { createMockRegistration, mockToast } from '@/test/utils';
import { RegistrationStatus } from '@/types/tournament-enums';

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  toast: mockToast
}));

describe('PlayerRegistrationList', () => {
  const mockRegistrations = [
    createMockRegistration({
      id: 'reg1',
      status: RegistrationStatus.PENDING,
      metadata: { playerName: 'John Doe' }
    }),
    createMockRegistration({
      id: 'reg2',
      status: RegistrationStatus.APPROVED,
      metadata: { playerName: 'Jane Smith' }
    }),
    createMockRegistration({
      id: 'reg3',
      status: RegistrationStatus.WAITLIST,
      metadata: { playerName: 'Bob Wilson' }
    })
  ];

  const mockOnStatusUpdate = vi.fn();
  const mockOnBulkStatusUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration list with correct data', () => {
    render(
      <PlayerRegistrationList
        registrations={mockRegistrations}
        onStatusUpdate={mockOnStatusUpdate}
        onBulkStatusUpdate={mockOnBulkStatusUpdate}
      />
    );

    // Check if all registrations are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();

    // Check status badges
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('APPROVED')).toBeInTheDocument();
    expect(screen.getByText('WAITLIST')).toBeInTheDocument();
  });

  it('handles individual status updates', async () => {
    render(
      <PlayerRegistrationList
        registrations={mockRegistrations}
        onStatusUpdate={mockOnStatusUpdate}
        onBulkStatusUpdate={mockOnBulkStatusUpdate}
      />
    );

    // Open status dropdown for first registration
    const statusButtons = screen.getAllByRole('button', { name: /change status/i });
    fireEvent.click(statusButtons[0]);

    // Select new status
    fireEvent.click(screen.getByText('APPROVED'));

    await waitFor(() => {
      expect(mockOnStatusUpdate).toHaveBeenCalledWith('reg1', RegistrationStatus.APPROVED);
    });
  });

  it('handles bulk status updates', async () => {
    render(
      <PlayerRegistrationList
        registrations={mockRegistrations}
        onStatusUpdate={mockOnStatusUpdate}
        onBulkStatusUpdate={mockOnBulkStatusUpdate}
      />
    );

    // Select multiple registrations
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // Select second registration
    fireEvent.click(checkboxes[2]); // Select third registration

    // Open bulk action dropdown
    fireEvent.click(screen.getByText(/bulk actions/i));

    // Select bulk status update
    fireEvent.click(screen.getByText('Approve Selected'));

    // Confirm bulk update
    fireEvent.click(screen.getByText(/confirm/i));

    await waitFor(() => {
      expect(mockOnBulkStatusUpdate).toHaveBeenCalledWith(
        ['reg2', 'reg3'],
        RegistrationStatus.APPROVED
      );
    });
  });

  it('filters registrations by status', () => {
    render(
      <PlayerRegistrationList
        registrations={mockRegistrations}
        onStatusUpdate={mockOnStatusUpdate}
        onBulkStatusUpdate={mockOnBulkStatusUpdate}
      />
    );

    // Select status filter
    fireEvent.click(screen.getByLabelText(/filter by status/i));
    fireEvent.click(screen.getByText('PENDING'));

    // Check if only pending registrations are shown
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
  });

  it('searches registrations by name', () => {
    render(
      <PlayerRegistrationList
        registrations={mockRegistrations}
        onStatusUpdate={mockOnStatusUpdate}
        onBulkStatusUpdate={mockOnBulkStatusUpdate}
      />
    );

    // Enter search term
    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: 'Jane' }
    });

    // Check if only matching registrations are shown
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
  });

  it('sorts registrations by different fields', () => {
    render(
      <PlayerRegistrationList
        registrations={mockRegistrations}
        onStatusUpdate={mockOnStatusUpdate}
        onBulkStatusUpdate={mockOnBulkStatusUpdate}
      />
    );

    // Click name column header to sort
    fireEvent.click(screen.getByText(/name/i));

    // Check if registrations are sorted alphabetically
    const names = screen.getAllByRole('cell', { name: /[A-Za-z]+ [A-Za-z]+/ })
      .map(cell => cell.textContent);
    expect(names).toEqual(['Bob Wilson', 'Jane Smith', 'John Doe']);

    // Click again to reverse sort
    fireEvent.click(screen.getByText(/name/i));
    const reversedNames = screen.getAllByRole('cell', { name: /[A-Za-z]+ [A-Za-z]+/ })
      .map(cell => cell.textContent);
    expect(reversedNames).toEqual(['John Doe', 'Jane Smith', 'Bob Wilson']);
  });
}); 