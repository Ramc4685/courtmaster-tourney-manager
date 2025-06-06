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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamRegistrationWithStatus, TournamentRegistrationStatus } from "@/types/registration";
import { MoreVertical, Users, ArrowUpDown, Search } from "lucide-react";
import { format } from "date-fns";

interface TeamRegistrationListProps {
  registrations: TeamRegistrationWithStatus[];
  onUpdateStatus: (id: string, status: TournamentRegistrationStatus) => Promise<void>;
  onBulkUpdateStatus?: (ids: string[], status: TournamentRegistrationStatus) => Promise<void>;
}

export const TeamRegistrationList: React.FC<TeamRegistrationListProps> = ({
  registrations,
  onUpdateStatus,
  onBulkUpdateStatus,
}): JSX.Element => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TournamentRegistrationStatus | "ALL">("ALL");
  const [sortField, setSortField] = useState<"name" | "date">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const getStatusColor = (status: TournamentRegistrationStatus) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-500/10 text-green-500";
      case "REJECTED":
        return "bg-red-500/10 text-red-500";
      case "WAITLIST":
        return "bg-yellow-500/10 text-yellow-500";
      case "CHECKED_IN":
        return "bg-blue-500/10 text-blue-500";
      case "WITHDRAWN":
        return "bg-gray-500/10 text-gray-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const filteredRegistrations = registrations
    .filter((reg) => {
      const nameMatch = reg.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.captainName.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === "ALL" || reg.status === statusFilter;
      return nameMatch && statusMatch;
    })
    .sort((a, b) => {
      if (sortField === "name") {
        return sortDirection === "asc"
          ? a.teamName.localeCompare(b.teamName)
          : b.teamName.localeCompare(a.teamName);
      } else {
        return sortDirection === "asc"
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

  const toggleSort = (field: "name" | "date") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredRegistrations.map(r => r.id) : []);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds(prev =>
      checked ? [...prev, id] : prev.filter(i => i !== id)
    );
  };

  const handleBulkAction = async (status: TournamentRegistrationStatus) => {
    if (onBulkUpdateStatus && selectedIds.length > 0) {
      await onBulkUpdateStatus(selectedIds, status);
      setSelectedIds([]);
    }
  };

  const statusOptions = [
    { value: 'ALL', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'WAITLIST', label: 'Waitlist' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'CHECKED_IN', label: 'Checked In' },
    { value: 'WITHDRAWN', label: 'Withdrawn' },
  ];

  const bulkActions = [
    { value: 'APPROVED', label: 'Approve Selected' },
    { value: 'REJECTED', label: 'Reject Selected' },
    { value: 'WAITLIST', label: 'Move to Waitlist' },
    { value: 'CHECKED_IN', label: 'Check In' },
    { value: 'WITHDRAWN', label: 'Mark as Withdrawn' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by team or captain name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as TournamentRegistrationStatus | "ALL")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedIds.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Bulk Actions ({selectedIds.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Update Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {bulkActions.map((action) => (
                <DropdownMenuItem key={action.value} onClick={() => handleBulkAction(action.value as TournamentRegistrationStatus)}>
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.length === filteredRegistrations.length}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => toggleSort("name")}>
                Team Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Captain</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => toggleSort("date")}>
                Registration Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRegistrations.map((registration) => (
            <TableRow key={registration.id}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(registration.id)}
                  onCheckedChange={(checked) => handleSelectRow(registration.id, !!checked)}
                />
              </TableCell>
              <TableCell>{registration.teamName}</TableCell>
              <TableCell>{registration.captainName}</TableCell>
              <TableCell>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {registration.members.length} members
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Team Members</SheetTitle>
                      <SheetDescription>
                        Members of {registration.teamName}
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {registration.members.map((member, index) => (
                            <TableRow key={index}>
                              <TableCell>{member.name}</TableCell>
                              <TableCell>{member.email}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </SheetContent>
                </Sheet>
              </TableCell>
              <TableCell>{format(registration.createdAt, "MMM d, yyyy")}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(registration.status)}>
                  {registration.status}
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
                    <DropdownMenuItem onClick={() => onUpdateStatus(registration.id, "APPROVED")}>
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpdateStatus(registration.id, "REJECTED")}>
                      Reject
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpdateStatus(registration.id, "WAITLIST")}>
                      Move to Waitlist
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpdateStatus(registration.id, "CHECKED_IN")}>
                      Check In
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}; 