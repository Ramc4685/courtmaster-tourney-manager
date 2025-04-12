
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Camera, Keyboard } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan }) => {
  const [manualInput, setManualInput] = useState('');
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');

  // For now, we're not implementing actual camera scanning as we need to add the react-qr-reader package
  // Instead, we'll provide a manual input option and a note about camera scanning

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput);
      setManualInput('');
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-center mb-4">
          <div className="flex space-x-2">
            <Button
              variant={mode === 'camera' ? 'default' : 'outline'}
              onClick={() => setMode('camera')}
              size="sm"
            >
              <Camera className="mr-2 h-4 w-4" />
              Camera
            </Button>
            <Button
              variant={mode === 'manual' ? 'default' : 'outline'}
              onClick={() => setMode('manual')}
              size="sm"
            >
              <Keyboard className="mr-2 h-4 w-4" />
              Manual Entry
            </Button>
          </div>
        </div>

        {mode === 'camera' ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="bg-gray-100 w-64 h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md">
              <div className="text-center px-4">
                <QrCode className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Camera QR scanning requires the react-qr-reader package.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Please use the manual entry option for now.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Enter QR code data manually"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Enter the QR code data manually if scanning is not available.
              </p>
            </div>
            <Button type="submit" className="w-full">
              Submit
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default QRScanner;
