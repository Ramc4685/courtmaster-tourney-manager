
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Save, X } from "lucide-react";
import { Court, CourtStatus } from "@/types/tournament";

interface CourtTableProps {
  courts: Court[];
  onCourtUpdate: (court: Court) => void;
}

const CourtTable: React.FC<CourtTableProps> = ({ courts, onCourtUpdate }) => {
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  const [editedCourtName, setEditedCourtName] = useState("");
  const [editedCourtStatus, setEditedCourtStatus] = useState<CourtStatus>("AVAILABLE");

  const handleEditClick = (court: Court) => {
    setEditingCourtId(court.id);
    setEditedCourtName(court.name);
    setEditedCourtStatus(court.status);
  };

  const handleSaveClick = (court: Court) => {
    const updatedCourt = {
      ...court,
      name: editedCourtName,
      status: editedCourtStatus
    };
    onCourtUpdate(updatedCourt);
    setEditingCourtId(null);
  };

  const handleCancelClick = () => {
    setEditingCourtId(null);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Court Number</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Current Match</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No courts found. Add a court to get started.
              </TableCell>
            </TableRow>
          ) : (
            courts.map((court) => (
              <TableRow key={court.id}>
                <TableCell>{court.number}</TableCell>
                <TableCell>
                  {editingCourtId === court.id ? (
                    <Input
                      value={editedCourtName}
                      onChange={(e) => setEditedCourtName(e.target.value)}
                    />
                  ) : (
                    court.name
                  )}
                </TableCell>
                <TableCell>
                  {editingCourtId === court.id ? (
                    <Select
                      value={editedCourtStatus}
                      onValueChange={(value) => setEditedCourtStatus(value as CourtStatus)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">Available</SelectItem>
                        <SelectItem value="IN_USE">In Use</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    court.status
                  )}
                </TableCell>
                <TableCell>
                  {court.currentMatch ? (
                    `${court.currentMatch.team1.name} vs ${court.currentMatch.team2.name}`
                  ) : (
                    "None"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingCourtId === court.id ? (
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleSaveClick(court)}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCancelClick}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(court)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CourtTable;
