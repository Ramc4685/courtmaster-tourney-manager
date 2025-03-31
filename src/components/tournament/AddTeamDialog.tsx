
import React, { useState, useEffect } from "react";
import { X, PlusCircle, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDescription } from "@/components/ui/form";
import { useTournament } from "@/contexts/TournamentContext";
import { Team, Player } from "@/types/tournament";
import { useToast } from "@/hooks/use-toast";

interface AddTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
}

const AddTeamDialog: React.FC<AddTeamDialogProps> = ({ open, onOpenChange, tournamentId }) => {
  const { addTeam } = useTournament();
  const { toast } = useToast();
  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState<Player[]>([{ id: "player-1", name: "" }]);
  const [isTeamNameManuallyEdited, setIsTeamNameManuallyEdited] = useState(false);

  // Generate team name based on player names
  const generateTeamName = (playerList: Player[]): string => {
    const validPlayers = playerList.filter(p => p.name.trim() !== '');
    
    if (validPlayers.length === 0) {
      return "";
    }
    
    if (validPlayers.length === 1) {
      // Single player - use their name
      return validPlayers[0].name.trim();
    } else {
      // Multiple players - use first names or initials
      const parts = validPlayers.map(player => {
        const nameParts = player.name.trim().split(' ');
        return nameParts[0]; // Take first name
      });
      
      if (parts.length === 2) {
        // For two players, use format "First1 & First2"
        return `${parts[0]} & ${parts[1]}`;
      } else {
        // For more than two, use format "First1, First2 & First3"
        const lastPart = parts.pop();
        return `${parts.join(', ')} & ${lastPart}`;
      }
    }
  };
  
  // Update team name when player names change
  useEffect(() => {
    if (!isTeamNameManuallyEdited) {
      const validPlayers = players.filter(p => p.name.trim() !== '');
      if (validPlayers.length > 0) {
        const generatedName = generateTeamName(players);
        if (generatedName) {
          setTeamName(generatedName);
        }
      }
    }
  }, [players, isTeamNameManuallyEdited]);
  
  // Reset manual edit flag when dialog opens
  useEffect(() => {
    if (open) {
      setIsTeamNameManuallyEdited(false);
      setTeamName("");
      setPlayers([{ id: "player-1", name: "" }]);
    }
  }, [open]);

  const handleAddPlayer = () => {
    setPlayers([
      ...players,
      { id: `player-${players.length + 1}`, name: "" }
    ]);
  };

  const handleRemovePlayer = (index: number) => {
    if (players.length <= 1) return;
    setPlayers(players.filter((_, i) => i !== index));
  };

  const handlePlayerChange = (index: number, field: keyof Player, value: string) => {
    const updatedPlayers = [...players];
    updatedPlayers[index] = { ...updatedPlayers[index], [field]: value };
    setPlayers(updatedPlayers);
  };

  const handleTeamNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTeamName(e.target.value);
    setIsTeamNameManuallyEdited(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate team name
    if (!teamName.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive",
      });
      return;
    }
    
    // Validate player names
    const isValid = players.every(player => player.name.trim() !== "");
    if (!isValid) {
      toast({
        title: "Error",
        description: "All players must have names",
        variant: "destructive",
      });
      return;
    }
    
    // Create the team
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: teamName,
      players: players.map(player => ({
        ...player,
        id: player.id.includes("temp-") ? `player-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` : player.id
      }))
    };
    
    // Add the team to the tournament
    addTeam(newTeam);
    
    // Reset form and close dialog
    setTeamName("");
    setPlayers([{ id: "player-1", name: "" }]);
    setIsTeamNameManuallyEdited(false);
    
    toast({
      title: "Success",
      description: "Team added successfully",
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Team</DialogTitle>
          <DialogDescription>
            Enter team details and add players
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Players</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPlayer}
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Add Player
              </Button>
            </div>
            
            {players.map((player, index) => (
              <div key={player.id} className="flex items-start space-x-2">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <Input
                      value={player.name}
                      onChange={(e) => handlePlayerChange(index, "name", e.target.value)}
                      placeholder="Player name"
                    />
                  </div>
                  <Input
                    value={player.email || ""}
                    onChange={(e) => handlePlayerChange(index, "email", e.target.value)}
                    placeholder="Email (optional)"
                    className="mt-1"
                  />
                </div>
                {players.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePlayer(index)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={handleTeamNameChange}
              placeholder="Enter team name"
            />
            <FormDescription className="text-xs">
              Auto-generated from player names. You can edit it.
            </FormDescription>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-court-green hover:bg-court-green/90">
              Add Team
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTeamDialog;
