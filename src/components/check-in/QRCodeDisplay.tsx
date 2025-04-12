
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RegistrationStatus, TournamentRegistration } from '@/types/registration';

// We'll use a simple QR code representation for now
// In a real app, you would use a library like qrcode.react

interface QRCodeDisplayProps {
  registrationId: string;
  name: string;
  type: 'player' | 'team';
  status: RegistrationStatus;
  registration?: TournamentRegistration; // Add this for backward compatibility with tests
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  registrationId,
  name,
  type,
  status,
  registration
}) => {
  // If registration is provided, use its values (for backward compatibility with tests)
  const id = registration?.id || registrationId;
  const displayName = registration?.metadata?.playerName || registration?.metadata?.teamName || name;
  const displayStatus = registration?.status || status;

  // Generate QR code data
  const qrData = JSON.stringify({
    id: id,
    type,
    timestamp: Date.now(),
  });

  // Determine badge color based on status
  const getBadgeColor = () => {
    if (displayStatus === RegistrationStatus.APPROVED) return 'bg-green-100 text-green-800';
    if (displayStatus === RegistrationStatus.CHECKED_IN) return 'bg-blue-100 text-blue-800';
    if (displayStatus === RegistrationStatus.WAITLISTED) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md">{displayName}</CardTitle>
          <Badge className={getBadgeColor()}>
            {displayStatus === RegistrationStatus.CHECKED_IN ? 'Checked In' : displayStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="w-24 h-24 bg-gray-100 border border-gray-300 flex items-center justify-center text-xs text-gray-500 overflow-hidden">
            {/* This is a placeholder for a real QR code */}
            QR Code<br/>ID: {id.substring(0, 8)}...
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium">Registration ID</p>
            <p className="text-xs text-gray-500">{id}</p>
            <p className="text-sm font-medium mt-2">Type</p>
            <p className="text-xs text-gray-500 capitalize">{type}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
