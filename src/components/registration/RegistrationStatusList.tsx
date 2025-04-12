import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlayerRegistrationWithStatus,
  TeamRegistrationWithStatus,
  RegistrationStatus,
} from "@/types/registration";
import { Upload, MoreVertical, Filter, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";

interface RegistrationStatusListProps {
  playerRegistrations: PlayerRegistrationWithStatus[];
  teamRegistrations: TeamRegistrationWithStatus[];
  onImportPlayers: (file: File) => Promise<void>;
  onImportTeams: (file: File) => Promise<void>;
  onUpdateStatus: (id: string, status: RegistrationStatus, type: "player" | "team") => Promise<void>;
  onBulkUpdateStatus?: (ids: string[], status: RegistrationStatus, type: "player" | "team") => Promise<void>;
}

const RegistrationStatusList: React.FC<RegistrationStatusListProps> = ({
  playerRegistrations,
  teamRegistrations,
  onImportPlayers,
  onImportTeams,
  onUpdateStatus,
  onBulkUpdateStatus,
}) => {
  const [selectedTab, setSelectedTab] = useState<"players" | "teams">("players");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | "ALL">("ALL");
  const [sortField, setSortField] = useState<"name" | "date" | "status" | "priority">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<RegistrationStatus | null>(null);

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

  const handleSort = (field: "name" | "date" | "status" | "priority") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!selectedStatus || !onBulkUpdateStatus || selectedIds.length === 0) return;
    await onBulkUpdateStatus(selectedIds, selectedStatus, selectedTab === "players" ? "player" : "team");
    setSelectedIds([]);
    setShowStatusDialog(false);
  };

  const getStatusColor = (status: RegistrationStatus) => {
    switch (status) {
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

  const filteredRegistrations = (selectedTab === "players" ? playerRegistrations : teamRegistrations)
    .filter((reg) => {
      const name = selectedTab === "players"
        ? `${(reg as PlayerRegistrationWithStatus).firstName} ${(reg as PlayerRegistrationWithStatus).lastName}`
        : (reg as TeamRegistrationWithStatus).teamName;
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || reg.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortField === "name") {
        const nameA = selectedTab === "players"
          ? `${(a as PlayerRegistrationWithStatus).firstName} ${(a as PlayerRegistrationWithStatus).lastName}`
          : (a as TeamRegistrationWithStatus).teamName;
        const nameB = selectedTab === "players"
          ? `${(b as PlayerRegistrationWithStatus).firstName} ${(b as PlayerRegistrationWithStatus).lastName}`
          : (b as TeamRegistrationWithStatus).teamName;
        return sortDirection === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      } else if (sortField === "date") {
        return sortDirection === "asc"
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : b.createdAt.getTime() - a.createdAt.getTime();
      } else if (sortField === "priority") {
        const priorityA = a.metadata.priority || 0;
        const priorityB = b.metadata.priority || 0;
        return sortDirection === "asc"
          ? priorityA - priorityB
          : priorityB - priorityA;
      } else {
        return sortDirection === "asc"
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }
    });

  return (
    <div className="space-y-4">
      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as "players" | "teams")}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RegistrationStatus | "ALL")}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="WAITLIST">Waitlist</SelectItem>
                <SelectItem value="CHECKED_IN">Checked In</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => handleFileUpload(e, selectedTab)}
                className="hidden"
                id={`${selectedTab}-upload`}
              />
              <label htmlFor={`${selectedTab}-upload`}>
                <Button variant="outline" size="icon" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </div>

        <TabsContent value="players">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredRegistrations.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredRegistrations.map(reg => reg.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("name")} className="flex items-center gap-1">
                    Name <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("date")} className="flex items-center gap-1">
                    Date <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("status")} className="flex items-center gap-1">
                    Status <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("priority")}
                    className="flex items-center gap-1"
                  >
                    Priority
                    {sortField === "priority" && (
                      <ArrowUpDown className={`h-4 w-4 ${sortDirection === "desc" ? "transform rotate-180" : ""}`} />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.map((registration) => {
                const player = registration as PlayerRegistrationWithStatus;
                return (
                  <TableRow key={player.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(player.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, player.id]);
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== player.id));
                          }
                        }}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      {player.firstName} {player.lastName}
                    </TableCell>
                    <TableCell>{player.email}</TableCell>
                    <TableCell>{player.phone || "-"}</TableCell>
                    <TableCell>{format(player.createdAt, "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(player.status)}>
                        {player.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onUpdateStatus(player.id, "APPROVED", "player")}>
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateStatus(player.id, "REJECTED", "player")}>
                            Reject
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateStatus(player.id, "WAITLIST", "player")}>
                            Move to Waitlist
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateStatus(player.id, "CHECKED_IN", "player")}>
                            Check In
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="teams">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredRegistrations.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredRegistrations.map(reg => reg.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("name")} className="flex items-center gap-1">
                    Team Name <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Captain</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("date")} className="flex items-center gap-1">
                    Date <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("status")} className="flex items-center gap-1">
                    Status <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("priority")}
                    className="flex items-center gap-1"
                  >
                    Priority
                    {sortField === "priority" && (
                      <ArrowUpDown className={`h-4 w-4 ${sortDirection === "desc" ? "transform rotate-180" : ""}`} />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.map((registration) => {
                const team = registration as TeamRegistrationWithStatus;
                return (
                  <TableRow key={team.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(team.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, team.id]);
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== team.id));
                          }
                        }}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>{team.teamName}</TableCell>
                    <TableCell>{team.captainName}</TableCell>
                    <TableCell>{team.members.length} members</TableCell>
                    <TableCell>{format(team.createdAt, "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(team.status)}>
                        {team.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onUpdateStatus(team.id, "APPROVED", "team")}>
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateStatus(team.id, "REJECTED", "team")}>
                            Reject
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateStatus(team.id, "WAITLIST", "team")}>
                            Move to Waitlist
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateStatus(team.id, "CHECKED_IN", "team")}>
                            Check In
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4">
          <span>{selectedIds.length} selected</span>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedIds([]);
            }}
          >
            Clear
          </Button>
          <Button
            onClick={() => {
              setShowStatusDialog(true);
            }}
          >
            Update Status
          </Button>
        </div>
      )}

      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>
              Update the status for {selectedIds.length} selected {selectedTab}
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedStatus || ""} onValueChange={(value) => setSelectedStatus(value as RegistrationStatus)}>
            <SelectTrigger>
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="APPROVED">Approve</SelectItem>
              <SelectItem value="REJECTED">Reject</SelectItem>
              <SelectItem value="WAITLIST">Move to Waitlist</SelectItem>
              <SelectItem value="CHECKED_IN">Check In</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkStatusUpdate}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegistrationStatusList; 