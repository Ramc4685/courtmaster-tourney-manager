
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useTournament } from "@/contexts/TournamentContext";
import { Team, Player } from "@/types/tournament";
import { FileUp, AlertCircle } from "lucide-react";

interface ImportTeamsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
}

const ImportTeamsDialog: React.FC<ImportTeamsDialogProps> = ({
  open,
  onOpenChange,
  tournamentId,
}) => {
  const { toast } = useToast();
  const { importTeams } = useTournament();
  const [teamsText, setTeamsText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importFormat, setImportFormat] = useState<"simple" | "detailed">("simple");

  const parseTeams = (): Team[] => {
    if (!teamsText.trim()) {
      setError("Please enter team data");
      return [];
    }

    try {
      const lines = teamsText.split("\n").filter(line => line.trim());
      
      // Simple format: "Team Name, Player 1 Name, Player 2 Name"
      if (importFormat === "simple") {
        return lines.map((line, index) => {
          const [teamName, ...playerNames] = line.split(",").map(item => item.trim());
          
          if (!teamName) {
            throw new Error(`Line ${index + 1}: Team name is required`);
          }
          
          if (playerNames.length === 0) {
            throw new Error(`Line ${index + 1}: At least one player is required`);
          }
          
          const players: Player[] = playerNames.map((name, playerIndex) => ({
            id: `imported-player-${index}-${playerIndex}-${Date.now()}`,
            name,
          }));
          
          return {
            id: `imported-team-${index}-${Date.now()}`,
            name: teamName,
            players,
          };
        });
      } 
      // Detailed format: JSON
      else {
        try {
          const teams = JSON.parse(teamsText);
          if (!Array.isArray(teams)) {
            throw new Error("JSON must be an array of teams");
          }
          
          return teams.map((team, index) => {
            if (!team.name) {
              throw new Error(`Team at index ${index}: name is required`);
            }
            
            if (!team.players || !Array.isArray(team.players) || team.players.length === 0) {
              throw new Error(`Team "${team.name}": at least one player is required`);
            }
            
            const players = team.players.map((player: any, playerIndex: number) => {
              if (typeof player === "string") {
                return {
                  id: `imported-player-${index}-${playerIndex}-${Date.now()}`,
                  name: player,
                };
              } else if (typeof player === "object" && player.name) {
                return {
                  id: `imported-player-${index}-${playerIndex}-${Date.now()}`,
                  name: player.name,
                  email: player.email,
                  phone: player.phone,
                };
              } else {
                throw new Error(`Team "${team.name}": invalid player at index ${playerIndex}`);
              }
            });
            
            return {
              id: `imported-team-${index}-${Date.now()}`,
              name: team.name,
              players,
            };
          });
        } catch (e) {
          if (e instanceof SyntaxError) {
            throw new Error("Invalid JSON format");
          }
          throw e;
        }
      }
    } catch (e: any) {
      setError(e.message);
      return [];
    }
  };

  const handleImport = () => {
    setError(null);
    const teams = parseTeams();
    
    if (teams.length === 0) {
      return; // Error already set by parseTeams
    }
    
    try {
      importTeams(teams);
      
      toast({
        title: "Teams imported",
        description: `Successfully imported ${teams.length} teams with ${teams.reduce((acc, team) => acc + team.players.length, 0)} players`,
      });
      
      setTeamsText("");
      onOpenChange(false);
    } catch (e: any) {
      setError(e.message || "Failed to import teams");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Teams</DialogTitle>
          <DialogDescription>
            Bulk import multiple teams and players at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-4">
            <Button
              variant={importFormat === "simple" ? "default" : "outline"}
              onClick={() => setImportFormat("simple")}
              size="sm"
              className="flex-1"
            >
              Simple Format
            </Button>
            <Button
              variant={importFormat === "detailed" ? "default" : "outline"}
              onClick={() => setImportFormat("detailed")}
              size="sm"
              className="flex-1"
            >
              JSON Format
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="teams-import">
              {importFormat === "simple" 
                ? "Enter teams in format: Team Name, Player 1, Player 2" 
                : "Enter JSON array of teams"}
            </Label>
            <Textarea
              id="teams-import"
              placeholder={importFormat === "simple" 
                ? "Eagle Smashers, John Doe, Jane Smith\nPhoenix Risers, Mike Brown, Sarah Lee" 
                : '[\n  {\n    "name": "Eagle Smashers",\n    "players": [\n      {"name": "John Doe", "email": "john@example.com"},\n      {"name": "Jane Smith"}\n    ]\n  }\n]'}
              value={teamsText}
              onChange={(e) => setTeamsText(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <div className="text-sm text-gray-500">
            {importFormat === "simple" ? (
              <p>Each line represents one team. Format: Team Name, Player 1, Player 2, etc.</p>
            ) : (
              <p>Provide a JSON array with team objects containing name and players array.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleImport}>
            <FileUp className="mr-2 h-4 w-4" /> Import Teams
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportTeamsDialog;
