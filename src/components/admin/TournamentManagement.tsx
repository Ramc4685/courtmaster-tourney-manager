
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { Plus, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTournament } from "@/contexts/tournament/useTournament";
import { ColumnDef } from "@tanstack/react-table";
import { Tournament } from "@/types/tournament";

const TournamentManagement: React.FC = () => {
  const navigate = useNavigate();
  const { tournaments, isLoading, error } = useTournament();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-500";
      case "PUBLISHED":
        return "bg-blue-500";
      case "IN_PROGRESS":
        return "bg-green-500";
      case "COMPLETED":
        return "bg-purple-500";
      case "CANCELLED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const columns: ColumnDef<Tournament>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "format",
      header: "Format",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const tournament = row.original;
        return (
          <Badge className={getStatusColor(tournament.status)}>
            {tournament.status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => {
        const tournament = row.original;
        return format(tournament.startDate, "MMM d, yyyy");
      },
    },
    {
      accessorKey: "teams.length",
      header: "Teams",
    },
    {
      accessorKey: "matches.length",
      header: "Matches",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const tournament = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link to={`/admin/tournaments/${tournament.id}/registrations`}>
                Registrations
              </Link>
            </Button>
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tournaments</h1>
        <Button onClick={() => navigate("/tournaments/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Tournament
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Format</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Teams</TableHead>
            <TableHead>Matches</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tournaments.map((tournament) => (
            <TableRow
              key={tournament.id}
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => navigate(`/tournaments/${tournament.id}`)}
            >
              <TableCell>{tournament.name}</TableCell>
              <TableCell>{tournament.format}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(tournament.status)}>
                  {tournament.status}
                </Badge>
              </TableCell>
              <TableCell>
                {format(tournament.startDate, "MMM d, yyyy")}
              </TableCell>
              <TableCell>{tournament.teams.length}</TableCell>
              <TableCell>{tournament.matches.length}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link to={`/admin/tournaments/${tournament.id}/registrations`}>
                      <Users className="h-4 w-4 mr-1" />
                      Registrations
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link to={`/admin/tournaments/${tournament.id}/settings`}>
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TournamentManagement;
