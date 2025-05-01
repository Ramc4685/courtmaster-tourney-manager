
import React, { useState } from "react"; // Added useState
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { Plus, Users, Settings, Megaphone } from "lucide-react"; // Added Megaphone
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Added DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input"; // Added Input
import { Textarea } from "@/components/ui/textarea"; // Added Textarea
import { Label } from "@/components/ui/label"; // Added Label
import { Badge } from "@/components/ui/badge";
import { useTournament } from "@/contexts/tournament/useTournament";
import { ColumnDef } from "@tanstack/react-table";
import { Tournament } from "@/types/tournament";
import { notificationService } from "@/services/api"; // Added notificationService
import { useToast } from "@/components/ui/use-toast"; // Added useToast

const TournamentManagement: React.FC = () => {
  const navigate = useNavigate();
  const { tournaments, isLoading, error } = useTournament();
  const { toast } = useToast(); // Added toast

  // State for announcement dialog
  const [isAnnounceDialogOpen, setIsAnnounceDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceMessage, setAnnounceMessage] = useState("");
  const [isSending, setIsSending] = useState(false); // State for sending indicator

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

  // --- Handle Announcement Sending ---
  const handleSendAnnouncement = async () => {
    if (!selectedTournament || !announceTitle || !announceMessage) {
      toast({ variant: "destructive", title: "Error", description: "Title and message cannot be empty." });
      return;
    }

    setIsSending(true);
    try {
      await notificationService.sendTournamentAnnouncement(
        selectedTournament.id,
        announceTitle,
        announceMessage
      );
      toast({ title: "Success", description: `Announcement sent to participants of ${selectedTournament.name}.` });
      setIsAnnounceDialogOpen(false); // Close dialog on success
      // Reset fields
      setAnnounceTitle("");
      setAnnounceMessage("");
      setSelectedTournament(null);
    } catch (err) {
      console.error("[TournamentManagement] Failed to send announcement:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to send announcement.";
      toast({ variant: "destructive", title: "Error", description: errorMsg });
    } finally {
      setIsSending(false);
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
                  {/* Announcement Button */}
                  <Dialog open={isAnnounceDialogOpen && selectedTournament?.id === tournament.id} onOpenChange={(open) => {
                      if (!open) {
                          setIsAnnounceDialogOpen(false);
                          setSelectedTournament(null);
                          setAnnounceTitle("");
                          setAnnounceMessage("");
                      }
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSelectedTournament(tournament);
                            setIsAnnounceDialogOpen(true);
                        }}
                      >
                        <Megaphone className="h-4 w-4 mr-1" />
                        Announce
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Send Announcement</DialogTitle>
                        <DialogDescription>
                          Send a notification to all confirmed participants of "{selectedTournament?.name}".
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="announce-title" className="text-right">
                            Title
                          </Label>
                          <Input
                            id="announce-title"
                            value={announceTitle}
                            onChange={(e) => setAnnounceTitle(e.target.value)}
                            className="col-span-3"
                            disabled={isSending}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="announce-message" className="text-right">
                            Message
                          </Label>
                          <Textarea
                            id="announce-message"
                            value={announceMessage}
                            onChange={(e) => setAnnounceMessage(e.target.value)}
                            className="col-span-3"
                            rows={4}
                            disabled={isSending}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                           <Button type="button" variant="secondary" disabled={isSending}>Cancel</Button>
                        </DialogClose>
                        <Button type="button" onClick={handleSendAnnouncement} disabled={isSending}>
                          {isSending ? "Sending..." : "Send Announcement"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
