
import React, { useState } from "react";
import { QrReader } from "react-qr-reader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { QrCode, UserCheck } from "lucide-react";

interface QRCheckInProps {
  onScan: (data: string) => Promise<void>;
}

const QRCheckIn: React.FC<QRCheckInProps> = ({ onScan }) => {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(true);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const handleScan = async (data: string | null) => {
    if (data && data !== lastScanned) {
      setLastScanned(data);
      try {
        await onScan(data);
        setScanning(false);
        toast({
          title: "Check-in Successful",
          description: "Player has been checked in.",
          icon: <UserCheck className="h-4 w-4 text-green-500" />
        });
        setTimeout(() => setScanning(true), 2000);
      } catch (error) {
        toast({
          title: "Check-in Failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Check-in
          </CardTitle>
          <Badge variant={scanning ? "default" : "secondary"}>
            {scanning ? "Scanning" : "Processing"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border-2 border-dashed">
          <QrReader
            constraints={{ facingMode: "environment" }}
            onResult={(result) => result && handleScan(result.getText())}
            className="w-full aspect-square"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCheckIn;
