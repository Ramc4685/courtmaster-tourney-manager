import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlayerRegistrationWithStatus,
  TeamRegistrationWithStatus,
} from "@/types/registration";

interface RegistrationStatusListProps {
  playerRegistrations: PlayerRegistrationWithStatus[];
  teamRegistrations: TeamRegistrationWithStatus[];
  onImportPlayers: (file: File) => Promise<void>;
  onImportTeams: (file: File) => Promise<void>;
}

const RegistrationStatusList: React.FC<RegistrationStatusListProps> = ({
  playerRegistrations,
  teamRegistrations,
  onImportPlayers,
  onImportTeams,
}) => {
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "players" | "teams"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (type === "players") {
        await onImportPlayers(file);
      } else {
        await onImportTeams(file);
      }
      event.target.value = "";
    } catch (error) {
      console.error(`Failed to import ${type}:`, error);
    }
  };

  return (
    <Tabs defaultValue="players" className="w-full">
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        <div className="flex gap-2">
          <div className="relative">
            <Input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              id="import-players"
              onChange={(e) => handleFileUpload(e, "players")}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("import-players")?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Players
            </Button>
          </div>

          <div className="relative">
            <Input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              id="import-teams"
              onChange={(e) => handleFileUpload(e, "teams")}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("import-teams")?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Teams
            </Button>
          </div>
        </div>
      </div>

      <TabsContent value="players">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {playerRegistrations.map((registration) => (
              <TableRow key={registration.id}>
                <TableCell>
                  {registration.firstName} {registration.lastName}
                </TableCell>
                <TableCell>{registration.email}</TableCell>
                <TableCell>{registration.phone || "-"}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      registration.status === "APPROVED"
                        ? "success"
                        : registration.status === "REJECTED"
                        ? "destructive"
                        : "default"
                    }
                  >
                    {registration.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>

      <TabsContent value="teams">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Captain</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamRegistrations.map((registration) => (
              <TableRow key={registration.id}>
                <TableCell>{registration.teamName}</TableCell>
                <TableCell>{registration.members.length}</TableCell>
                <TableCell>
                  {registration.members.find((m) => m.isTeamCaptain)?.firstName}{" "}
                  {registration.members.find((m) => m.isTeamCaptain)?.lastName}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      registration.status === "APPROVED"
                        ? "success"
                        : registration.status === "REJECTED"
                        ? "destructive"
                        : "default"
                    }
                  >
                    {registration.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  );
};

export default RegistrationStatusList; 