import React from "react";
import QRCode from "react-qr-code";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, QrCode } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface QRCodeDisplayProps {
  registrationId: string;
  name: string;
  type: "player" | "team";
  status: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  registrationId,
  name,
  type,
  status,
}) => {
  const { toast } = useToast();
  const qrValue = JSON.stringify({
    id: registrationId,
    type,
    timestamp: Date.now(),
    name,
  });

  const downloadQRCode = () => {
    const svg = document.getElementById(`qr-code-${registrationId}`)?.querySelector("svg");
    if (svg) {
      try {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          const pngFile = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.download = `${type}-${name.replace(/\s+/g, "-")}-qr.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
          
          toast({
            title: "QR Code Downloaded",
            description: "The QR code has been saved to your device",
          });
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
      } catch (error) {
        toast({
          title: "Download Failed",
          description: "Failed to download the QR code",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return "bg-green-500/10 text-green-500";
      case "REJECTED":
        return "bg-red-500/10 text-red-500";
      case "WAITLIST":
        return "bg-yellow-500/10 text-yellow-500";
      case "CHECKED_IN":
        return "bg-blue-500/10 text-blue-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            <CardTitle>Check-in QR Code</CardTitle>
          </div>
          <Badge className={getStatusColor(status)}>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div
          id={`qr-code-${registrationId}`}
          className="bg-white p-4 rounded-lg"
          style={{ maxWidth: "200px" }}
        >
          <QRCode
            value={qrValue}
            size={200}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            viewBox={`0 0 256 256`}
          />
        </div>
        <div className="mt-4 text-center">
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">
            {type === "player" ? "Player" : "Team"} Registration
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={downloadQRCode}
        >
          <Download className="mr-2 h-4 w-4" />
          Download QR Code
        </Button>
      </CardContent>
    </Card>
  );
}; 