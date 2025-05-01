import React from 'react';
import QRCode from 'react-qr-code';
import { RegistrationStatus } from '@/types/registration'; // Updated import path
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, AlertCircle, HelpCircle, User, Users } from 'lucide-react';

interface QRCodeDisplayProps {
  registrationId: string;
  name: string;
  type: 'player' | 'team';
  status: RegistrationStatus;
  checkInTime?: string | null; // Add check-in time prop
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  registrationId,
  name,
  type,
  status,
  checkInTime,
}) => {

  // Generate a more robust QR code payload
  const qrCodeValue = JSON.stringify({
    id: registrationId,
    type: type,
    timestamp: Date.now(), // Include timestamp for validation
  });

  const getStatusInfo = () => {
    switch (status) {
      case RegistrationStatus.APPROVED:
        return { color: 'border-blue-500 bg-blue-50 text-blue-700', icon: <HelpCircle className="h-4 w-4" />, text: 'Approved (Not Checked In)' };
      case RegistrationStatus.PENDING:
        return { color: 'border-yellow-500 bg-yellow-50 text-yellow-700', icon: <Clock className="h-4 w-4" />, text: 'Pending Approval' };
      case RegistrationStatus.REJECTED:
        return { color: 'border-red-500 bg-red-50 text-red-700', icon: <AlertCircle className="h-4 w-4" />, text: 'Rejected' };
      case RegistrationStatus.WAITLIST:
      case RegistrationStatus.WAITLISTED:
        return { color: 'border-gray-500 bg-gray-50 text-gray-700', icon: <Clock className="h-4 w-4" />, text: 'Waitlisted' };
      case RegistrationStatus.CHECKED_IN:
        return { color: 'border-green-500 bg-green-50 text-green-700', icon: <CheckCircle2 className="h-4 w-4" />, text: 'Checked In' };
      default:
        return { color: 'border-gray-300 bg-gray-50 text-gray-500', icon: <HelpCircle className="h-4 w-4" />, text: 'Unknown Status' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className={`overflow-hidden ${statusInfo.color}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-secondary/30">
        <CardTitle className="text-sm font-medium truncate">{name}</CardTitle>
        <Badge variant="outline" className="capitalize">
          {type === 'player' ? <User className="h-3 w-3 mr-1"/> : <Users className="h-3 w-3 mr-1"/>}
          {type}
        </Badge>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col md:flex-row items-center gap-4">
        <div className="p-2 border rounded-md bg-white">
          {/* Only show QR code if not checked in yet */} 
          {status === RegistrationStatus.APPROVED ? (
            <QRCode value={qrCodeValue} size={100} level="L" />
          ) : (
            <div className="w-[100px] h-[100px] flex items-center justify-center bg-gray-100 rounded-md">
              <span className="text-xs text-gray-500 text-center">Checked In</span>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1 text-sm">
          <p className="text-xs text-muted-foreground">ID: {registrationId}</p>
          <div className={`flex items-center gap-1.5 font-semibold ${statusInfo.color.replace('border-', 'text-').replace('bg-', 'text-')}`}>
             {statusInfo.icon}
             {statusInfo.text}
          </div>
          {checkInTime && (
            <p className="text-xs text-muted-foreground">
              Checked In: {new Date(checkInTime).toLocaleTimeString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeDisplay;

