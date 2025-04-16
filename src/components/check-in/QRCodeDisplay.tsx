
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TournamentRegistration } from '@/types/registration';
import { RegistrationStatus } from '@/types/tournament-enums';

export interface QRCodeDisplayProps {
  registrationId: string;
  name: string;
  type: string;
  status: RegistrationStatus;
  registration: TournamentRegistration;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ 
  registrationId, 
  name, 
  type, 
  status, 
  registration 
}) => {
  // Generate a QR code data URL (simplified for this example)
  const generateQRCode = () => {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="white"/><text x="50" y="100" font-family="Arial" font-size="14" fill="black">${registrationId}</text></svg>`;
  };
  
  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">{name} Check-In QR Code</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="border rounded-md p-4 mb-4">
          <img 
            src={generateQRCode()} 
            alt="Check-in QR Code" 
            className="w-48 h-48"
            data-testid="qr-code-image" 
          />
        </div>
        
        <div className="w-full space-y-2">
          <div className="flex justify-between">
            <span className="font-semibold">Registration ID:</span>
            <span>{registrationId}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Type:</span>
            <span>{type}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Status:</span>
            <span className={`font-medium ${
              status === RegistrationStatus.APPROVED ? 'text-green-600' :
              status === RegistrationStatus.PENDING ? 'text-amber-600' :
              status === RegistrationStatus.REJECTED ? 'text-red-600' :
              status === RegistrationStatus.WAITLIST ? 'text-blue-600' :
              status === RegistrationStatus.CHECKED_IN ? 'text-purple-600' :
              ''
            }`}>
              {status}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeDisplay;
