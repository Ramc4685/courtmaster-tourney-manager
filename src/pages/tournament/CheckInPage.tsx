import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useTournament } from "@/contexts/tournament/useTournament";
import { useRegistration } from "@/contexts/registration/useRegistration";
import { useAuth } from "@/contexts/auth/AuthContext";
import QRScanner from "@/components/check-in/QRScanner";
import { QRCodeDisplay } from "@/components/check-in/QRCodeDisplay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, QrCode, UserCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

export const CheckInPage = () => {
  const { id: tournamentId } = useParams();
  const { selectedTournament: tournament, isLoading: tournamentLoading } = useTournament();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    playerRegistrations,
    teamRegistrations,
    updatePlayerStatus,
    updateTeamStatus,
    isLoading,
  } = useRegistration();

  const [selectedTab, setSelectedTab] = useState("players");
  const [scanError, setScanError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (tournamentLoading || !tournament) {
    return <div>Loading tournament...</div>;
  }

  if (tournament.created_by !== user?.id) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You do not have permission to access this page.
        </AlertDescription>
      </Alert>
    );
  }

  const handleScan = async (data: string) => {
    try {
      const scannedData = JSON.parse(data);
      const { id, type, timestamp } = scannedData;

      // Validate QR code timestamp (within last 24 hours)
      const now = Date.now();
      const validityPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (now - timestamp > validityPeriod) {
        setScanError("QR code has expired. Please generate a new one.");
        return;
      }

      if (type === "player") {
        const registration = playerRegistrations.find((r) => r.id === id);
        if (!registration) {
          setScanError("Player registration not found");
          return;
        }
        if (registration.status !== "APPROVED") {
          setScanError("Player registration is not approved");
          return;
        }
        await updatePlayerStatus(id, "CHECKED_IN");
        setSuccessMessage(`Successfully checked in player: ${registration.firstName} ${registration.lastName}`);
      } else if (type === "team") {
        const registration = teamRegistrations.find((r) => r.id === id);
        if (!registration) {
          setScanError("Team registration not found");
          return;
        }
        if (registration.status !== "APPROVED") {
          setScanError("Team registration is not approved");
          return;
        }
        await updateTeamStatus(id, "CHECKED_IN");
        setSuccessMessage(`Successfully checked in team: ${registration.teamName}`);
      }

      toast({
        title: "Check-in Successful",
        description: successMessage,
      });
    } catch (error) {
      setScanError("Invalid QR code format");
      toast({
        title: "Check-in Failed",
        description: "Failed to process QR code",
        variant: "destructive",
      });
    }
  };

  const filteredPlayerRegistrations = playerRegistrations.filter(
    (reg) => reg.tournamentId === tournamentId && reg.status === "APPROVED"
  );

  const filteredTeamRegistrations = teamRegistrations.filter(
    (reg) => reg.tournamentId === tournamentId && reg.status === "APPROVED"
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Check-in Management</h1>
        <Badge variant="outline" className="text-lg">
          {tournament.name}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              <CardTitle>QR Code Scanner</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <QRScanner onScan={handleScan} />
            {scanError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{scanError}</AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert className="mt-4 bg-green-500/10 text-green-500 border-green-500/20">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              <CardTitle>Recent Check-ins</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="players">Players</TabsTrigger>
                <TabsTrigger value="teams">Teams</TabsTrigger>
              </TabsList>
              <TabsContent value="players">
                <ScrollArea className="h-[400px]">
                  {filteredPlayerRegistrations.map((registration) => (
                    <div key={registration.id} className="mb-4">
                      <QRCodeDisplay
                        registrationId={registration.id}
                        name={`${registration.firstName} ${registration.lastName}`}
                        type="player"
                        status={registration.status}
                      />
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="teams">
                <ScrollArea className="h-[400px]">
                  {filteredTeamRegistrations.map((registration) => (
                    <div key={registration.id} className="mb-4">
                      <QRCodeDisplay
                        registrationId={registration.id}
                        name={registration.teamName}
                        type="team"
                        status={registration.status}
                      />
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 