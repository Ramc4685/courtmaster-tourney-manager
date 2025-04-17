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
  const [number, setNumber] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Validate form
    if (!name || !number) {
      setError('Name and court number are required.');
      return;
    }

    const newCourt: Omit<Court, "id"> = {
      tournamentId,
      name,
      number,
      status: CourtStatus.AVAILABLE,
      createdAt: new Date(),
      updatedAt: new Date(),
      court_number: number,
      tournament_id: tournamentId
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
            <Label htmlFor="number">Court Number</Label>
            <Input
              type="number"
              id="number"
              value={number !== undefined ? number.toString() : ''}
              onChange={(e) => setNumber(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              placeholder="1"
              required
            />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Create Court</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
