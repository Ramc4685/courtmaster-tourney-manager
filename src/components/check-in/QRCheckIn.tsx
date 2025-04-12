
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, Check } from 'lucide-react';
import QRScanner from './QRScanner';

interface QRCheckInProps {
  onScan: (data: string) => Promise<void>;
}

const QRCheckIn: React.FC<QRCheckInProps> = ({ onScan }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { toast } = useToast();

  const handleScan = async (data: string) => {
    setIsScanning(true);
    setError(null);
    setSuccess(null);
    
    try {
      await onScan(data);
      setSuccess('Successfully checked in!');
      toast({
        description: 'Successfully checked in!',
        variant: 'default'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process QR code';
      setError(errorMessage);
      toast({
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check-In Scanner</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <QRScanner onScan={handleScan} />
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
            <Check className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        <div className="text-sm text-gray-500">
          <p>Scan a participant's QR code to check them in.</p>
          <p>You can also manually enter the QR code data if scanning is not available.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCheckIn;
