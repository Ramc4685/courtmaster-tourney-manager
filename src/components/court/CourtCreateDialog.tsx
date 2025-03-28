
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Court, CourtStatus } from "@/types/tournament";

interface CourtCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (court: Omit<Court, "id">) => void;
}

const CourtCreateDialog: React.FC<CourtCreateDialogProps> = ({
  open,
  onOpenChange,
  onCreate
}) => {
  const [courtName, setCourtName] = useState("");
  const [courtNumber, setCourtNumber] = useState<number>(1);
  const [courtStatus, setCourtStatus] = useState<CourtStatus>("AVAILABLE");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create court without ID (will be added by parent component)
    const newCourt: Omit<Court, "id"> = {
      name: courtName,
      number: courtNumber,
      status: courtStatus
    };
    
    onCreate(newCourt);
    
    // Reset form
    setCourtName("");
    setCourtNumber(1);
    setCourtStatus("AVAILABLE");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Court</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="courtName" className="text-right">
                Court Name
              </Label>
              <Input
                id="courtName"
                value={courtName}
                onChange={(e) => setCourtName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="courtNumber" className="text-right">
                Court Number
              </Label>
              <Input
                id="courtNumber"
                type="number"
                min="1"
                value={courtNumber}
                onChange={(e) => setCourtNumber(parseInt(e.target.value))}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="courtStatus" className="text-right">
                Status
              </Label>
              <Select
                value={courtStatus}
                onValueChange={(value) => setCourtStatus(value as CourtStatus)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="IN_USE">In Use</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Create Court</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CourtCreateDialog;
