import React, { useState, useCallback } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { QrCode, Camera, CameraOff } from "lucide-react";

interface QRScannerProps {
  onScan: (code: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan }) => {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);

  const handleScan = useCallback((result: IDetectedBarcode[]) => {
    if (result && result.length > 0) {
      try {
        // Validate QR code format
        const data = JSON.parse(result[0].rawValue);
        if (!data.id || !data.type) {
          throw new Error("Invalid QR code format");
        }
        onScan(result[0].rawValue);
      } catch (error) {
        toast({
          title: "Invalid QR Code",
          description: "Please scan a valid registration QR code",
          variant: "destructive",
        });
      }
    }
  }, [onScan, toast]);

  const handleError = useCallback((error: unknown) => {
    console.error("QR Scanner error:", error);
    if (error instanceof Error && error.message.includes("Permission")) {
      setHasPermission(false);
      toast({
        title: "Camera Access Required",
        description: "Please allow camera access to scan QR codes",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Scanner Error",
        description: "Failed to initialize the QR scanner",
        variant: "destructive",
      });
    }
  }, [toast]);

  const toggleScanning = () => {
    if (!hasPermission && !isScanning) {
      // Request permission again
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => {
          setHasPermission(true);
          setIsScanning(true);
        })
        .catch(() => {
          toast({
            title: "Camera Access Denied",
            description: "Please enable camera access in your browser settings",
            variant: "destructive",
          });
        });
    } else {
      setIsScanning(!isScanning);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          <span className="font-medium">QR Scanner</span>
        </div>
        <Badge variant={isScanning ? "default" : "secondary"}>
          {isScanning ? "Scanning" : "Ready"}
        </Badge>
      </div>

      {isScanning ? (
        <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-dashed">
          <Scanner
            onScan={handleScan}
            onError={handleError}
            paused={!isScanning}
            constraints={{
              facingMode: "environment",
              aspectRatio: 1,
            }}
          />
        </div>
      ) : (
        <div className="aspect-video rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
          <div className="text-center text-muted-foreground">
            <CameraOff className="h-8 w-8 mx-auto mb-2" />
            <p>Camera is off</p>
          </div>
        </div>
      )}

      <Button
        onClick={toggleScanning}
        className="w-full"
        variant={isScanning ? "destructive" : "default"}
      >
        {isScanning ? (
          <>
            <CameraOff className="mr-2 h-4 w-4" />
            Stop Scanning
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" />
            Start Scanning
          </>
        )}
      </Button>
    </div>
  );
};

export default QRScanner; 