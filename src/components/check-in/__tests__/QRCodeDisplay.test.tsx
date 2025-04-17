
import React from 'react';
import { render, screen } from '@testing-library/react';
import { QRCodeDisplay } from '../QRCodeDisplay';
import { RegistrationStatus } from '@/types/tournament-enums';
import { TournamentRegistration } from '@/types/registration';

const mockRegistration: TournamentRegistration = {
  id: '123',
  status: RegistrationStatus.APPROVED,
  metadata: {
    checkInTime: '2025-03-21T10:30:00Z',
    playerName: 'John Doe',
    contactEmail: 'john@example.com',
  },
  divisionId: 'div-123',
  tournamentId: 'tourn-123',
  createdAt: new Date('2025-03-20'),
  updatedAt: new Date('2025-03-20')
};

describe('QRCodeDisplay', () => {
  it('renders the QR code', () => {
    render(
      <QRCodeDisplay
        registrationId="123"
        name="John Doe"
        type="Player"
        status={RegistrationStatus.APPROVED}
        registration={mockRegistration}
      />
    );
    
    const qrCodeImage = screen.getByTestId('qr-code-image');
    expect(qrCodeImage).toBeInTheDocument();
  });
  
  it('displays the registration details', () => {
    render(
      <QRCodeDisplay
        registrationId="123"
        name="John Doe"
        type="Player"
        status={RegistrationStatus.APPROVED}
        registration={mockRegistration}
      />
    );
    
    expect(screen.getByText(/Registration ID:/i)).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.getByText(/Type:/i)).toBeInTheDocument();
    expect(screen.getByText('Player')).toBeInTheDocument();
    expect(screen.getByText(/Status:/i)).toBeInTheDocument();
    expect(screen.getByText('APPROVED')).toBeInTheDocument();
  });
  
  it('applies correct styling for approved status', () => {
    render(
      <QRCodeDisplay
        registrationId="123"
        name="John Doe"
        type="Player"
        status={RegistrationStatus.APPROVED}
        registration={mockRegistration}
      />
    );
    
    const statusElement = screen.getByText('APPROVED');
    expect(statusElement).toHaveClass('text-green-600');
  });
  
  it('applies correct styling for pending status', () => {
    render(
      <QRCodeDisplay
        registrationId="123"
        name="John Doe"
        type="Player"
        status={RegistrationStatus.PENDING}
        registration={mockRegistration}
      />
    );
    
    const statusElement = screen.getByText('PENDING');
    expect(statusElement).toHaveClass('text-amber-600');
  });
  
  it('applies correct styling for rejected status', () => {
    render(
      <QRCodeDisplay
        registrationId="123"
        name="John Doe"
        type="Player"
        status={RegistrationStatus.REJECTED}
        registration={mockRegistration}
      />
    );
    
    const statusElement = screen.getByText('REJECTED');
    expect(statusElement).toHaveClass('text-red-600');
  });
  
  it('applies correct styling for waitlist status', () => {
    render(
      <QRCodeDisplay
        registrationId="123"
        name="John Doe"
        type="Player"
        status={RegistrationStatus.WAITLIST}
        registration={mockRegistration}
      />
    );
    
    const statusElement = screen.getByText('WAITLIST');
    expect(statusElement).toHaveClass('text-blue-600');
  });

  it('applies correct styling for checked-in status', () => {
    const checkedInRegistration: TournamentRegistration = {
      ...mockRegistration,
      status: RegistrationStatus.CHECKED_IN,
      metadata: {
        ...mockRegistration.metadata,
        checkInTime: '2025-03-21T10:30:00Z'
      }
    };
    
    render(
      <QRCodeDisplay
        registrationId="123"
        name="John Doe"
        type="Player"
        status={RegistrationStatus.CHECKED_IN}
        registration={checkedInRegistration}
      />
    );
    
    const statusElement = screen.getByText('CHECKED_IN');
    expect(statusElement).toHaveClass('text-purple-600');
  });
});
