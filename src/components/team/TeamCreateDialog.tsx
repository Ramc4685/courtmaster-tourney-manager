
import React, { useState, useEffect } from "react";
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
import { FormDescription } from "@/components/ui/form";
import { Team, Player } from "@/types/tournament";

interface TeamCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (team: Omit<Team, "id">) => void;
}

const TeamCreateDialog: React.FC<TeamCreateDialogProps> = ({
  open,
  onOpenChange,
  onCreate
}) => {
  const [teamName, setTeamName] = useState("");
  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [initialRanking, setInitialRanking] = useState<number | undefined>(undefined);
  const [isTeamNameManuallyEdited, setIsTeamNameManuallyEdited] = useState(false);
  
  // Generate team name based on player names
  const generateTeamName = (): string => {
    if (player1Name && player2Name) {
      return `${player1Name.split(' ')[0]} & ${player2Name.split(' ')[0]}`;
    } else if (player1Name) {
      return player1Name;
    }
    return "";
  };
  
  // Update team name when player names change
  useEffect(() => {
    if (!isTeamNameManuallyEdited) {
      const generatedName = generateTeamName();
      if (generatedName) {
        setTeamName(generatedName);
      }
    }
  }, [player1Name, player2Name, isTeamNameManuallyEdited]);
  
  // Reset manual edit flag when dialog opens/closes
  useEffect(() => {
    if (open) {
      setIsTeamNameManuallyEdited(false);
    }
  }, [open]);

  const handleTeamNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTeamName(e.target.value);
    setIsTeamNameManuallyEdited(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create players
    const players: Player[] = [
      { id: Math.random().toString(36).substring(2, 9), name: player1Name }
    ];
    
    if (player2Name) {
      players.push({ id: Math.random().toString(36).substring(2, 9), name: player2Name });
    }
    
    // Create team without ID (will be added by parent component)
    const newTeam: Omit<Team, "id"> = {
      name: teamName,
      players: players,
      initialRanking: initialRanking
    };
    
    onCreate(newTeam);
    
    // Reset form
    setTeamName("");
    setPlayer1Name("");
    setPlayer2Name("");
    setInitialRanking(undefined);
    setIsTeamNameManuallyEdited(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="player1" className="text-right">
                Player 1
              </Label>
              <Input
                id="player1"
                value={player1Name}
                onChange={(e) => setPlayer1Name(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="player2" className="text-right">
                Player 2
              </Label>
              <Input
                id="player2"
                value={player2Name}
                onChange={(e) => setPlayer2Name(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teamName" className="text-right">
                Team Name
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={handleTeamNameChange}
                  className="w-full"
                  required
                />
                <FormDescription className="text-xs">
                  Auto-generated from player names. You can edit it.
                </FormDescription>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ranking" className="text-right">
                Initial Ranking
              </Label>
              <Input
                id="ranking"
                type="number"
                value={initialRanking || ""}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : undefined;
                  setInitialRanking(val);
                }}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Create Team</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamCreateDialog;
