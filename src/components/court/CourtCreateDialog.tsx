import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Court } from '@/types/entities';
import { CourtStatus } from '@/types/tournament-enums';

interface CourtCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (court: Omit<Court, "id">) => void;
  tournamentId: string;
}

export const CourtCreateDialog: React.FC<CourtCreateDialogProps> = ({ open, onClose, onCreate, tournamentId }) => {
  const [name, setName] = useState('');
  const [courtNumber, setCourtNumber] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Validate form
    if (!name || !courtNumber) {
      setError('Name and court number are required.');
      return;
    }

    const newCourt: Omit<Court, "id"> = {
      tournamentId,
      tournament_id: tournamentId,
      name,
      courtNumber,
      court_number: courtNumber,
      status: CourtStatus.AVAILABLE,
      createdAt: new Date(),
      created_at: new Date(),
      updatedAt: new Date(),
      updated_at: new Date()
    };

    onCreate(newCourt);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Court</DialogTitle>
          <DialogDescription>
            Create a new court to manage your tournament.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {error && <div className="text-red-500">{error}</div>}
          <div className="grid gap-2">
            <Label htmlFor="name">Court Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Court 1"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="courtNumber">Court Number</Label>
            <Input
              type="number"
              id="courtNumber"
              value={courtNumber !== undefined ? courtNumber.toString() : ''}
              onChange={(e) => setCourtNumber(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              placeholder="1"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit">Create Court</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
