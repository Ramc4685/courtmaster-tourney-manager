
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QRScannerProps {
  onScan: (data: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan }) => {
  const [manualInput, setManualInput] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  return (
    <div className="border rounded-md p-4">
      <div className="bg-gray-100 rounded-md aspect-video flex items-center justify-center mb-4">
        <p className="text-gray-500 text-sm">
          Camera not available in this environment.
          <br />
          Please use manual entry below.
        </p>
      </div>
      
      <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Enter QR code data manually"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
        />
        <Button type="submit" size="sm">Submit</Button>
      </form>
    </div>
  );
};

export default QRScanner;
