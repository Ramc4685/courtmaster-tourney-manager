import React from "react";
import QRCodeReact from "react-qr-code";
import { Card } from "@/components/ui/card";

interface QRCodeProps {
  registrationId: string;
  type: "player" | "team";
  name: string;
}

const QRCode: React.FC<QRCodeProps> = ({ registrationId, type, name }) => {
  const qrData = JSON.stringify({
    id: registrationId,
    type,
  });

  return (
    <Card className="p-4 flex flex-col items-center space-y-4">
      <div className="bg-white p-4 rounded-lg">
        <QRCodeReact value={qrData} size={200} />
      </div>
      <div className="text-center">
        <p className="font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">
          {type === "player" ? "Player" : "Team"} Registration
        </p>
      </div>
    </Card>
  );
};

export default QRCode; 