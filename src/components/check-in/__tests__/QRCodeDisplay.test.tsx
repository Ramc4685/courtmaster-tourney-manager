
import React from 'react';
import { render, screen } from '@testing-library/react';
import { QRCodeDisplay } from '../QRCodeDisplay';
import { RegistrationStatus } from '@/types/tournament-enums';

describe('QRCodeDisplay', () => {
  it('renders correctly with registration data', () => {
    const mockRegistration = {
      id: 'test-id',
      tournament_id: 'tournament-id',
      player_id: 'player-id',
      division_id: 'division-id',
      status: RegistrationStatus.APPROVED,
      created_at: '2023-01-01T12:00:00Z',
      updated_at: '2023-01-01T12:00:00Z',
      metadata: {
        playerName: 'John Doe',
        checkInTime: '2023-01-01T14:00:00Z'
      }
    };

    render(
      <QRCodeDisplay
        registrationId="test-id"
        name="John Doe"
        type="Player"
        status={RegistrationStatus.APPROVED}
        registration={mockRegistration}
      />
    );

    expect(screen.getByTestId('qr-code-image')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Player')).toBeInTheDocument();
    expect(screen.getByText('APPROVED')).toBeInTheDocument();
  });
});
