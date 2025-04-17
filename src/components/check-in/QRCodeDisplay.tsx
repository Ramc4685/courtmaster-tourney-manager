
import React from 'react';
import QRCode from 'react-qr-code';
import { RegistrationStatus } from '@/types/tournament-enums';
import { TournamentRegistration } from '@/types/registration';

interface QRCodeDisplayProps {
  registrationId: string;
  name: string;
  type: string;
  status: RegistrationStatus;
  registration: TournamentRegistration;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  registrationId,
  name,
  type,
  status,
  registration
}) => {
  const getStatusColor = () => {
    switch (status) {
      case RegistrationStatus.APPROVED:
        return 'text-green-600';
      case RegistrationStatus.PENDING:
        return 'text-amber-600';
      case RegistrationStatus.REJECTED:
        return 'text-red-600';
      case RegistrationStatus.WAITLIST:
        return 'text-blue-600';
      case RegistrationStatus.CHECKED_IN:
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col items-center">
        <div className="mb-4" data-testid="qr-code-image">
          <QRCode value={registrationId} size={180} />
        </div>
        <h2 className="text-xl font-bold">{name}</h2>
        <div className="mt-4 w-full">
          <div className="grid grid-cols-2 gap-y-2">
            <span className="font-semibold">Registration ID:</span>
            <span>{registrationId}</span>
            
            <span className="font-semibold">Type:</span>
            <span>{type}</span>
            
            <span className="font-semibold">Status:</span>
            <span className={getStatusColor()}>{status}</span>
            
            {registration.metadata.checkInTime && (
              <>
                <span className="font-semibold">Checked In:</span>
                <span>{new Date(registration.metadata.checkInTime).toLocaleString()}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
