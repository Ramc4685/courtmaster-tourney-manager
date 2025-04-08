
import React from "react";
import { QrReader } from "react-qr-reader";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface QRCheckInProps {
  onScan: (data: string) => Promise<void>;
}

const QRCheckIn: React.FC<QRCheckInProps> = ({ onScan }) => {
  const { toast } = useToast();

  const handleScan = async (data: string | null) => {
    if (data) {
      try {
        await onScan(data);
        toast({
          title: "Check-in Successful",
          description: "Player has been checked in.",
        });
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
    <Card className="p-4">
      <QrReader
        constraints={{ facingMode: "environment" }}
        onResult={(result) => result && handleScan(result.getText())}
        className="w-full max-w-sm mx-auto"
      />
    </Card>
  );
};

export default QRCheckIn;
