import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QRCodeDisplay } from '../QRCodeDisplay';
import { createMockRegistration, mockToast } from '@/test/utils';
import { RegistrationStatus } from '@/types/tournament-enums';

// Mock QRCode component
vi.mock('react-qr-code', () => ({
  default: vi.fn().mockImplementation(() => <div data-testid="mock-qr-code" />)
}));

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  toast: mockToast
}));

describe('QRCodeDisplay', () => {
  const mockRegistration = createMockRegistration({
    id: 'reg1',
    status: RegistrationStatus.APPROVED,
    metadata: {
      playerName: 'John Doe',
      category: 'Men\'s Singles',
      timestamp: new Date().toISOString()
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration details correctly', () => {
    render(<QRCodeDisplay registration={mockRegistration} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Men\'s Singles')).toBeInTheDocument();
    expect(screen.getByTestId('mock-qr-code')).toBeInTheDocument();
  });

  it('displays correct status badge', () => {
    render(<QRCodeDisplay registration={mockRegistration} />);

    const statusBadge = screen.getByText('APPROVED');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('bg-green-500'); // Assuming green for approved status
  });

  it('handles QR code download', () => {
    const mockDownload = vi.fn();
    global.URL.createObjectURL = vi.fn();
    global.URL.revokeObjectURL = vi.fn();
    
    const link = {
      click: mockDownload,
      download: '',
      href: ''
    };
    
    vi.spyOn(document, 'createElement').mockReturnValue(link as any);

    render(<QRCodeDisplay registration={mockRegistration} />);

    fireEvent.click(screen.getByText(/download qr code/i));

    expect(mockDownload).toHaveBeenCalled();
    expect(mockToast.success).toHaveBeenCalledWith(
      expect.stringContaining('QR code downloaded')
    );
  });

  it('shows error toast when download fails', () => {
    const mockError = new Error('Download failed');
    global.URL.createObjectURL = vi.fn(() => {
      throw mockError;
    });

    render(<QRCodeDisplay registration={mockRegistration} />);

    fireEvent.click(screen.getByText(/download qr code/i));

    expect(mockToast.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to download QR code')
    );
  });

  it('includes correct metadata in QR code', () => {
    const { container } = render(<QRCodeDisplay registration={mockRegistration} />);
    
    const qrCodeValue = container.querySelector('[data-testid="mock-qr-code"]')?.getAttribute('value');
    const decodedValue = JSON.parse(qrCodeValue || '{}');

    expect(decodedValue).toEqual(expect.objectContaining({
      id: mockRegistration.id,
      status: mockRegistration.status,
      metadata: mockRegistration.metadata
    }));
  });

  it('updates when registration changes', () => {
    const { rerender } = render(<QRCodeDisplay registration={mockRegistration} />);

    const updatedRegistration = {
      ...mockRegistration,
      status: RegistrationStatus.CHECKED_IN,
      metadata: {
        ...mockRegistration.metadata,
        checkInTime: new Date().toISOString()
      }
    };

    rerender(<QRCodeDisplay registration={updatedRegistration} />);

    expect(screen.getByText('CHECKED_IN')).toBeInTheDocument();
    expect(screen.getByText(updatedRegistration.metadata.checkInTime)).toBeInTheDocument();
  });
}); 