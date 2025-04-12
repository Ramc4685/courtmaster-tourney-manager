import React, { useState } from "react";
import { useRegistration } from "@/contexts/registration/useRegistration";
import QRScanner from "@/components/check-in/QRScanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import RegistrationStatusList from "@/components/registration/RegistrationStatusList";
import { RegistrationStatus, PlayerRegistrationWithStatus, TeamRegistrationWithStatus } from "@/types/registration";

const CheckInPage: React.FC = () => {
  const { updatePlayerStatus, updateTeamStatus, playerRegistrations, teamRegistrations } = useRegistration();
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"players" | "teams">("players");

  const handleScan = async (data: string) => {
    try {
      // Reset states
      setError(null);
      setSuccess(null);
      setLastScannedId(null);

      // Parse the QR code data
      const { id, type } = JSON.parse(data);
      
      if (!id || !type) {
        throw new Error("Invalid QR code format");
      }

      // Find and process registration based on type
      if (type === "player") {
        const playerReg = playerRegistrations.find(r => r.id === id);
        if (!playerReg) throw new Error("Player registration not found");
        if (playerReg.status !== "APPROVED") throw new Error("Player registration is not approved");
        
        await updatePlayerStatus(id, "CHECKED_IN" as RegistrationStatus);
        setSuccess(`Successfully checked in ${playerReg.firstName} ${playerReg.lastName}`);
      } else {
        const teamReg = teamRegistrations.find(r => r.id === id);
        if (!teamReg) throw new Error("Team registration not found");
        if (teamReg.status !== "APPROVED") throw new Error("Team registration is not approved");
        
        await updateTeamStatus(id, "CHECKED_IN" as RegistrationStatus);
        setSuccess(`Successfully checked in team ${teamReg.teamName}`);
      }

      setLastScannedId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process check-in");
    }
  };

  const handleUpdateStatus = async (id: string, status: RegistrationStatus, type: "player" | "team") => {
    if (type === "player") {
      await updatePlayerStatus(id, status);
    } else {
      await updateTeamStatus(id, status);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Check-In</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>QR Code Scanner</CardTitle>
          </CardHeader>
          <CardContent>
            <QRScanner onScan={handleScan} />
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mt-4 border-green-500">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="players" onValueChange={(value) => setSelectedTab(value as "players" | "teams")}>
              <TabsList>
                <TabsTrigger value="players">Players</TabsTrigger>
                <TabsTrigger value="teams">Teams</TabsTrigger>
              </TabsList>
              
              <TabsContent value="players">
                <RegistrationStatusList
                  playerRegistrations={playerRegistrations.filter(r => r.status === "CHECKED_IN")}
                  teamRegistrations={[]}
                  onUpdateStatus={handleUpdateStatus}
                  onImportPlayers={async () => {}}
                  onImportTeams={async () => {}}
                />
              </TabsContent>
              
              <TabsContent value="teams">
                <RegistrationStatusList
                  playerRegistrations={[]}
                  teamRegistrations={teamRegistrations.filter(r => r.status === "CHECKED_IN")}
                  onUpdateStatus={handleUpdateStatus}
                  onImportPlayers={async () => {}}
                  onImportTeams={async () => {}}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckInPage; 