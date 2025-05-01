import React, { useState, useEffect, useCallback } from "react";
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
import { AlertCircle, CheckCircle2, QrCode, UserCheck, Loader2, ListChecks } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { PlayerRegistration, RegistrationStatus, TeamRegistration } from "@/types/registration";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const CheckInPage = () => {
  const { id: tournamentId } = useParams<{ id: string }>();
  const { selectedTournament: tournament, isLoading: tournamentLoading } = useTournament();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    playerRegistrations,
    teamRegistrations,
    updatePlayerStatus,
    updateTeamStatus,
    isLoading: registrationLoading,
    fetchRegistrations, // Ensure fetchRegistrations is available
  } = useRegistration();

  const [selectedTab, setSelectedTab] = useState("scan"); // Default to scanner tab
  const [scanError, setScanError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [manualCheckinId, setManualCheckinId] = useState("");
  const [manualCheckinType, setManualCheckinType] = useState<"player" | "team">("player");

  // Fetch registrations when tournamentId changes
  useEffect(() => {
    if (tournamentId) {
      fetchRegistrations(tournamentId);
    }
  }, [tournamentId, fetchRegistrations]);

  const handleScan = useCallback(async (data: string) => {
    setScanError(null);
    setSuccessMessage(null);
    console.log("[CheckInPage] Scanned data:", data);

    let scannedData: { id: string; type: "player" | "team"; timestamp: number };
    try {
      scannedData = JSON.parse(data);
      if (!scannedData.id || !scannedData.type || !scannedData.timestamp) {
        throw new Error("Missing required fields in QR code data");
      }
    } catch (error) {
      console.error("[CheckInPage] Invalid QR code format:", error);
      setScanError("Invalid QR code format. Please scan a valid registration QR code.");
      toast({ title: "Scan Error", description: "Invalid QR code format.", variant: "destructive" });
      return;
    }

    const { id, type, timestamp } = scannedData;

    // Validate QR code timestamp (e.g., within last 5 minutes for security)
    const now = Date.now();
    const validityPeriod = 5 * 60 * 1000; // 5 minutes in milliseconds
    if (now - timestamp > validityPeriod) {
      console.warn(`[CheckInPage] Expired QR code scanned (timestamp: ${timestamp}, now: ${now})`);
      setScanError("QR code has expired. Please generate or display a fresh one.");
      toast({ title: "Scan Error", description: "QR code has expired.", variant: "destructive" });
      return;
    }

    let registration: PlayerRegistration | TeamRegistration | undefined;
    let updateFunction: (id: string, status: RegistrationStatus) => Promise<void>;
    let registrationName: string;

    if (type === "player") {
      registration = playerRegistrations.find((r) => r.id === id);
      updateFunction = updatePlayerStatus;
      registrationName = registration ? `${(registration as PlayerRegistration).playerName}` : "Player";
    } else if (type === "team") {
      registration = teamRegistrations.find((r) => r.id === id);
      updateFunction = updateTeamStatus;
      registrationName = registration ? `${(registration as TeamRegistration).teamName}` : "Team";
    } else {
      setScanError(`Invalid registration type in QR code: ${type}`);
      toast({ title: "Scan Error", description: "Invalid registration type.", variant: "destructive" });
      return;
    }

    if (!registration) {
      setScanError(`${type === "player" ? "Player" : "Team"} registration not found for ID: ${id}`);
      toast({ title: "Scan Error", description: "Registration not found.", variant: "destructive" });
      return;
    }

    if (registration.status === RegistrationStatus.CHECKED_IN) {
      setSuccessMessage(`${registrationName} is already checked in.`);
      toast({ title: "Already Checked In", description: `${registrationName} was already checked in.` });
      return;
    }

    if (registration.status !== RegistrationStatus.APPROVED) {
      setScanError(`${registrationName}'s registration status is ${registration.status}, not APPROVED. Cannot check in.`);
      toast({ title: "Check-in Failed", description: `Registration not approved (Status: ${registration.status}).`, variant: "destructive" });
      return;
    }

    try {
      await updateFunction(id, RegistrationStatus.CHECKED_IN);
      const successMsg = `Successfully checked in ${type}: ${registrationName}`;
      setSuccessMessage(successMsg);
      toast({ title: "Check-in Successful", description: successMsg });
      // Optionally refetch registrations to update lists immediately
      // await fetchRegistrations(tournamentId);
    } catch (error) {
      console.error(`[CheckInPage] Error updating ${type} status:`, error);
      const errorText = error instanceof Error ? error.message : "Unknown error";
      setScanError(`Failed to check in ${registrationName}. Error: ${errorText}`);
      toast({ title: "Check-in Failed", description: `Could not update status. ${errorText}`, variant: "destructive" });
    }
  }, [playerRegistrations, teamRegistrations, updatePlayerStatus, updateTeamStatus, toast, tournamentId]); // Added tournamentId dependency

  const handleManualCheckin = () => {
      if (!manualCheckinId) {
          toast({ title: "Manual Check-in", description: "Please enter a Registration ID.", variant: "destructive" });
          return;
      }
      // Simulate scanning the manually entered ID
      const manualPayload = JSON.stringify({
          id: manualCheckinId,
          type: manualCheckinType,
          timestamp: Date.now() // Use current time for manual check-in
      });
      handleScan(manualPayload);
      setManualCheckinId(""); // Clear input after attempt
  }

  // --- Render Checks --- 
  if (tournamentLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /><span> Loading Tournament...</span></div>;
  }

  if (!tournament) {
     return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>Tournament data not found.</AlertDescription></Alert>;
  }
  
  // Check permissions after tournament data is loaded
  if (tournament.organizer_id !== user?.id) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>You do not have permission to manage check-in for this tournament.</AlertDescription>
      </Alert>
    );
  }

  // Filter registrations based on current state
  const approvedPlayers = playerRegistrations.filter(reg => reg.tournamentId === tournamentId && reg.status === RegistrationStatus.APPROVED);
  const checkedInPlayers = playerRegistrations.filter(reg => reg.tournamentId === tournamentId && reg.status === RegistrationStatus.CHECKED_IN);
  const approvedTeams = teamRegistrations.filter(reg => reg.tournamentId === tournamentId && reg.status === RegistrationStatus.APPROVED);
  const checkedInTeams = teamRegistrations.filter(reg => reg.tournamentId === tournamentId && reg.status === RegistrationStatus.CHECKED_IN);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Check-in Management</h1>
        <Badge variant="secondary" className="text-base whitespace-nowrap">
          {tournament.name}
        </Badge>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} defaultValue="scan">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scan"> <QrCode className="h-4 w-4 mr-2"/> Scan QR Code</TabsTrigger>
          <TabsTrigger value="manual"> <ListChecks className="h-4 w-4 mr-2"/> Manual Check-in</TabsTrigger>
          <TabsTrigger value="status"> <UserCheck className="h-4 w-4 mr-2"/> Check-in Status</TabsTrigger>
        </TabsList>

        {/* Scan Tab */} 
        <TabsContent value="scan">
          <Card>
            <CardHeader>
              <CardTitle>QR Code Scanner</CardTitle>
            </CardHeader>
            <CardContent>
              <QRScanner onScan={handleScan} />
              {scanError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Scan Error</AlertTitle>
                  <AlertDescription>{scanError}</AlertDescription>
                </Alert>
              )}
              {successMessage && (
                <Alert variant="success" className="mt-4">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Check-in Tab */} 
        <TabsContent value="manual">
           <Card>
            <CardHeader>
              <CardTitle>Manual Check-in by ID</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Label htmlFor="regId" className="whitespace-nowrap">Registration ID:</Label>
                    <Input 
                        id="regId"
                        value={manualCheckinId}
                        onChange={(e) => setManualCheckinId(e.target.value)}
                        placeholder="Enter Player or Team Registration ID"
                    />
                </div>
                 <div className="flex items-center space-x-4">
                    <Label className="whitespace-nowrap">Type:</Label>
                     <Button 
                        variant={manualCheckinType === 'player' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setManualCheckinType('player')}
                    >
                        Player
                    </Button>
                    <Button 
                        variant={manualCheckinType === 'team' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setManualCheckinType('team')}
                    >
                        Team
                    </Button>
                </div>
                <Button onClick={handleManualCheckin} disabled={registrationLoading}>
                    {registrationLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : null}
                    Check In Manually
                </Button>
                 {scanError && (
                    <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Check-in Error</AlertTitle>
                    <AlertDescription>{scanError}</AlertDescription>
                    </Alert>
                )}
                {successMessage && (
                    <Alert variant="success" className="mt-4">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Tab */} 
        <TabsContent value="status">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Players Column */} 
            <Card>
              <CardHeader>
                <CardTitle>Players ({checkedInPlayers.length} / {approvedPlayers.length + checkedInPlayers.length} Checked In)</CardTitle>
              </CardHeader>
              <CardContent>
                 {registrationLoading && !playerRegistrations.length ? (
                     <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                 ) : (
                    <ScrollArea className="h-[400px] space-y-2 pr-3">
                        {[...checkedInPlayers, ...approvedPlayers]
                            .sort((a, b) => a.playerName.localeCompare(b.playerName))
                            .map((reg) => (
                                <QRCodeDisplay
                                    key={reg.id}
                                    registrationId={reg.id}
                                    name={reg.playerName}
                                    type="player"
                                    status={reg.status}
                                    checkInTime={reg.status === RegistrationStatus.CHECKED_IN ? reg.updatedAt : null} // Assuming updatedAt reflects check-in time
                                />
                        ))}
                        {approvedPlayers.length === 0 && checkedInPlayers.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No approved player registrations found.</p>}
                    </ScrollArea>
                 )}
              </CardContent>
            </Card>

            {/* Teams Column */} 
            <Card>
              <CardHeader>
                 <CardTitle>Teams ({checkedInTeams.length} / {approvedTeams.length + checkedInTeams.length} Checked In)</CardTitle>
              </CardHeader>
              <CardContent>
                 {registrationLoading && !teamRegistrations.length ? (
                     <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                 ) : (
                    <ScrollArea className="h-[400px] space-y-2 pr-3">
                        {[...checkedInTeams, ...approvedTeams]
                            .sort((a, b) => a.teamName.localeCompare(b.teamName))
                            .map((reg) => (
                                <QRCodeDisplay
                                    key={reg.id}
                                    registrationId={reg.id}
                                    name={reg.teamName}
                                    type="team"
                                    status={reg.status}
                                    checkInTime={reg.status === RegistrationStatus.CHECKED_IN ? reg.updatedAt : null} // Assuming updatedAt reflects check-in time
                                />
                        ))}
                        {approvedTeams.length === 0 && checkedInTeams.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No approved team registrations found (or team logic pending).</p>}
                    </ScrollArea>
                 )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CheckInPage;

