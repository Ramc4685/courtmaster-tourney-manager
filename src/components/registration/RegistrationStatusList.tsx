
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, ChevronDown, FileDown, FileUp, Search } from "lucide-react";
import { PlayerRegistrationWithStatus, TeamRegistrationWithStatus } from "@/types/registration";
import { RegistrationStatus } from "@/types/tournament-enums";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RegistrationStatusListProps {
  playerRegistrations: PlayerRegistrationWithStatus[];
  teamRegistrations: TeamRegistrationWithStatus[];
  onUpdateStatus: (
    registrationId: string,
    status: RegistrationStatus,
    type: "player" | "team"
  ) => void;
  onBulkUpdateStatus?: (
    ids: string[],
    status: RegistrationStatus,
    type: "player" | "team"
  ) => void;
  onImportPlayers?: (file: File) => void;
  onImportTeams?: (file: File) => void;
  onExportPlayers?: () => void;
  onExportTeams?: () => void;
}

const RegistrationStatusList: React.FC<RegistrationStatusListProps> = ({
  playerRegistrations,
  teamRegistrations,
  onUpdateStatus,
  onBulkUpdateStatus,
  onImportPlayers,
  onImportTeams,
  onExportPlayers,
  onExportTeams,
}) => {
  const [tab, setTab] = useState("individual");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filter registrations based on search term and status
  const filteredPlayerRegistrations = playerRegistrations.filter(
    (registration) => {
      const matchesSearch =
        registration.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || registration.status === statusFilter;

      return matchesSearch && matchesStatus;
    }
  );

  const filteredTeamRegistrations = teamRegistrations.filter(
    (registration) => {
      const matchesSearch = registration.teamName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || registration.status === statusFilter;

      return matchesSearch && matchesStatus;
    }
  );

  const handleSelectAllPlayers = (checked: boolean) => {
    setSelectedPlayerIds(
      checked ? filteredPlayerRegistrations.map((r) => r.id) : []
    );
  };

  const handleSelectAllTeams = (checked: boolean) => {
    setSelectedTeamIds(checked ? filteredTeamRegistrations.map((r) => r.id) : []);
  };

  const handleBulkUpdatePlayerStatus = (status: RegistrationStatus) => {
    if (onBulkUpdateStatus && selectedPlayerIds.length > 0) {
      onBulkUpdateStatus(selectedPlayerIds, status, "player");
      setSelectedPlayerIds([]);
    }
  };

  const handleBulkUpdateTeamStatus = (status: RegistrationStatus) => {
    if (onBulkUpdateStatus && selectedTeamIds.length > 0) {
      onBulkUpdateStatus(selectedTeamIds, status, "team");
      setSelectedTeamIds([]);
    }
  };

  const handleImportPlayers = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImportPlayers) {
      onImportPlayers(file);
      // Reset the input
      event.target.value = "";
    }
  };

  const handleImportTeams = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImportTeams) {
      onImportTeams(file);
      // Reset the input
      event.target.value = "";
    }
  };

  const getStatusBadge = (status: RegistrationStatus) => {
    switch (status) {
      case RegistrationStatus.APPROVED:
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case RegistrationStatus.PENDING:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case RegistrationStatus.REJECTED:
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case RegistrationStatus.WAITLIST:
        return <Badge className="bg-blue-100 text-blue-800">Waitlisted</Badge>;
      case RegistrationStatus.CHECKED_IN:
        return <Badge className="bg-indigo-100 text-indigo-800">Checked In</Badge>;
      case RegistrationStatus.WITHDRAWN:
        return <Badge className="bg-gray-100 text-gray-800">Withdrawn</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const priorityLabel = (priority: number = 0) => {
    if (priority > 10) return <Badge className="bg-red-100 text-red-800">High</Badge>;
    if (priority > 5) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-blue-100 text-blue-800">Normal</Badge>;
  };

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="individual">Individual Players</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>
        </div>

        <div className="mb-4 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search registrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={RegistrationStatus.PENDING}>
                Pending
              </SelectItem>
              <SelectItem value={RegistrationStatus.APPROVED}>
                Approved
              </SelectItem>
              <SelectItem value={RegistrationStatus.REJECTED}>
                Rejected
              </SelectItem>
              <SelectItem value={RegistrationStatus.WAITLIST}>
                Waitlisted
              </SelectItem>
              <SelectItem value={RegistrationStatus.CHECKED_IN}>
                Checked In
              </SelectItem>
              <SelectItem value={RegistrationStatus.WITHDRAWN}>
                Withdrawn
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="individual">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Individual Player Registrations
                <Badge className="ml-2">
                  {filteredPlayerRegistrations.length}
                </Badge>
              </CardTitle>
              <div className="flex space-x-2">
                {onImportPlayers && (
                  <div>
                    <Button variant="outline" asChild>
                      <label>
                        <FileUp className="h-4 w-4 mr-2" />
                        Import
                        <input
                          type="file"
                          accept=".csv,.xlsx"
                          onChange={handleImportPlayers}
                          className="hidden"
                        />
                      </label>
                    </Button>
                  </div>
                )}
                {onExportPlayers && (
                  <Button variant="outline" onClick={onExportPlayers}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredPlayerRegistrations.length > 0 ? (
                <div>
                  {onBulkUpdateStatus && selectedPlayerIds.length > 0 && (
                    <div className="flex items-center mb-4 p-2 bg-muted rounded-md">
                      <span className="mr-2 text-sm">
                        {selectedPlayerIds.length} selected
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Bulk Action
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() =>
                              handleBulkUpdatePlayerStatus(RegistrationStatus.APPROVED)
                            }
                          >
                            Approve Selected
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleBulkUpdatePlayerStatus(RegistrationStatus.REJECTED)
                            }
                          >
                            Reject Selected
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleBulkUpdatePlayerStatus(RegistrationStatus.WAITLIST)
                            }
                          >
                            Move to Waitlist
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {onBulkUpdateStatus && (
                            <TableHead className="w-[40px]">
                              <input
                                type="checkbox"
                                checked={
                                  filteredPlayerRegistrations.length > 0 &&
                                  selectedPlayerIds.length ===
                                    filteredPlayerRegistrations.length
                                }
                                onChange={(e) =>
                                  handleSelectAllPlayers(e.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300"
                              />
                            </TableHead>
                          )}
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="hidden md:table-cell">
                            Division
                          </TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPlayerRegistrations.map((registration) => (
                          <TableRow key={registration.id}>
                            {onBulkUpdateStatus && (
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedPlayerIds.includes(
                                    registration.id
                                  )}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPlayerIds([
                                        ...selectedPlayerIds,
                                        registration.id,
                                      ]);
                                    } else {
                                      setSelectedPlayerIds(
                                        selectedPlayerIds.filter(
                                          (id) => id !== registration.id
                                        )
                                      );
                                    }
                                  }}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                              </TableCell>
                            )}
                            <TableCell>
                              {registration.firstName} {registration.lastName}
                            </TableCell>
                            <TableCell>{registration.email}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {registration.divisionId || registration.division_id}
                            </TableCell>
                            <TableCell>
                              {priorityLabel(registration.metadata?.priority)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(registration.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    Actions
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      onUpdateStatus(
                                        registration.id,
                                        RegistrationStatus.APPROVED,
                                        "player"
                                      )
                                    }
                                  >
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      onUpdateStatus(
                                        registration.id,
                                        RegistrationStatus.REJECTED,
                                        "player"
                                      )
                                    }
                                  >
                                    Reject
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      onUpdateStatus(
                                        registration.id,
                                        RegistrationStatus.WAITLIST,
                                        "player"
                                      )
                                    }
                                  >
                                    Move to Waitlist
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      onUpdateStatus(
                                        registration.id,
                                        RegistrationStatus.CHECKED_IN,
                                        "player"
                                      )
                                    }
                                  >
                                    Mark as Checked In
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">
                      No registrations found
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {searchTerm || statusFilter !== "all"
                        ? "No registrations match the current filters."
                        : "There are no player registrations for this tournament yet."}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Team Registrations
                <Badge className="ml-2">{filteredTeamRegistrations.length}</Badge>
              </CardTitle>
              <div className="flex space-x-2">
                {onImportTeams && (
                  <div>
                    <Button variant="outline" asChild>
                      <label>
                        <FileUp className="h-4 w-4 mr-2" />
                        Import
                        <input
                          type="file"
                          accept=".csv,.xlsx"
                          onChange={handleImportTeams}
                          className="hidden"
                        />
                      </label>
                    </Button>
                  </div>
                )}
                {onExportTeams && (
                  <Button variant="outline" onClick={onExportTeams}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredTeamRegistrations.length > 0 ? (
                <div>
                  {onBulkUpdateStatus && selectedTeamIds.length > 0 && (
                    <div className="flex items-center mb-4 p-2 bg-muted rounded-md">
                      <span className="mr-2 text-sm">
                        {selectedTeamIds.length} selected
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Bulk Action
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() =>
                              handleBulkUpdateTeamStatus(RegistrationStatus.APPROVED)
                            }
                          >
                            Approve Selected
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleBulkUpdateTeamStatus(RegistrationStatus.REJECTED)
                            }
                          >
                            Reject Selected
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleBulkUpdateTeamStatus(RegistrationStatus.WAITLIST)
                            }
                          >
                            Move to Waitlist
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {onBulkUpdateStatus && (
                            <TableHead className="w-[40px]">
                              <input
                                type="checkbox"
                                checked={
                                  filteredTeamRegistrations.length > 0 &&
                                  selectedTeamIds.length ===
                                    filteredTeamRegistrations.length
                                }
                                onChange={(e) =>
                                  handleSelectAllTeams(e.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300"
                              />
                            </TableHead>
                          )}
                          <TableHead>Team Name</TableHead>
                          <TableHead>Captain</TableHead>
                          <TableHead className="hidden md:table-cell">
                            Players
                          </TableHead>
                          <TableHead className="hidden md:table-cell">
                            Division
                          </TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTeamRegistrations.map((registration) => (
                          <TableRow key={registration.id}>
                            {onBulkUpdateStatus && (
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedTeamIds.includes(
                                    registration.id
                                  )}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTeamIds([
                                        ...selectedTeamIds,
                                        registration.id,
                                      ]);
                                    } else {
                                      setSelectedTeamIds(
                                        selectedTeamIds.filter(
                                          (id) => id !== registration.id
                                        )
                                      );
                                    }
                                  }}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                              </TableCell>
                            )}
                            <TableCell>{registration.teamName}</TableCell>
                            <TableCell>{registration.captainName}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {registration.playerCount}{" "}
                              {registration.playerCount === 1
                                ? "player"
                                : "players"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {registration.divisionId || registration.division_id}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(registration.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    Actions
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      onUpdateStatus(
                                        registration.id,
                                        RegistrationStatus.APPROVED,
                                        "team"
                                      )
                                    }
                                  >
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      onUpdateStatus(
                                        registration.id,
                                        RegistrationStatus.REJECTED,
                                        "team"
                                      )
                                    }
                                  >
                                    Reject
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      onUpdateStatus(
                                        registration.id,
                                        RegistrationStatus.WAITLIST,
                                        "team"
                                      )
                                    }
                                  >
                                    Move to Waitlist
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      onUpdateStatus(
                                        registration.id,
                                        RegistrationStatus.CHECKED_IN,
                                        "team"
                                      )
                                    }
                                  >
                                    Mark as Checked In
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">
                      No team registrations found
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {searchTerm || statusFilter !== "all"
                        ? "No team registrations match the current filters."
                        : "There are no team registrations for this tournament yet."}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RegistrationStatusList;
