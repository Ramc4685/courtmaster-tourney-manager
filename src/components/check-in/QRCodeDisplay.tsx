
import React from 'react';
import QRCode from 'react-qr-code';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RegistrationStatus } from '@/types/tournament-enums';

export interface QRCodeDisplayProps {
  registrationId: string;
  name: string;
  type: 'player' | 'team';
  status: RegistrationStatus;
}

export function QRCodeDisplay({ registrationId, name, type, status }: QRCodeDisplayProps) {
  const getStatusColor = (status: RegistrationStatus) => {
    switch (status) {
      case RegistrationStatus.APPROVED:
        return 'bg-green-100 text-green-800 border-green-300';
      case RegistrationStatus.CHECKED_IN:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case RegistrationStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case RegistrationStatus.WAITLIST:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case RegistrationStatus.REJECTED:
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Generate QR data as a JSON string to be scanned
  const qrData = JSON.stringify({
    id: registrationId,
    name,
    type,
    status
  });

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 flex flex-col items-center space-y-4">
        <div className="w-64 h-64 flex items-center justify-center p-2 bg-white">
          <QRCode value={qrData} size={240} />
        </div>
        
        <div className="text-center mt-4">
          <h3 className="font-bold text-lg">{name}</h3>
          <p className="text-sm text-gray-500 capitalize">{type}</p>
          <Badge className={`mt-2 ${getStatusColor(status)}`}>
            {status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// Mock function for tests
export function generateQRCodeForRegistration(registrationData: any): QRCodeDisplayProps {
  return {
    registrationId: registrationData.id,
    name: registrationData.metadata?.playerName || registrationData.metadata?.teamName || 'Unnamed',
    type: registrationData.metadata?.teamName ? 'team' : 'player',
    status: registrationData.status
  };
}
