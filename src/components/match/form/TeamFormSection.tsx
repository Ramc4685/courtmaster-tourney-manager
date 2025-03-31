
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormDescription } from "@/components/ui/form";
import { PlusCircleIcon, User, X, Wand2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateCreativeTeamName } from "@/utils/teamNameUtils";

interface TeamFormSectionProps {
  teamNumber: "team1" | "team2";
  teamName: string;
  players: string[];
  onTeamNameChange: (team: "team1" | "team2", value: string) => void;
  onPlayerChange: (team: "team1" | "team2", index: number, value: string) => void;
  onAddPlayer: (team: "team1" | "team2") => void;
  onRemovePlayer: (team: "team1" | "team2", index: number) => void;
  showAlert: boolean;
}

const TeamFormSection: React.FC<TeamFormSectionProps> = ({
  teamNumber,
  teamName,
  players,
  onTeamNameChange,
  onPlayerChange,
  onAddPlayer,
  onRemovePlayer,
  showAlert
}) => {
  const handleGenerateCreativeName = () => {
    const creativeName = generateCreativeTeamName();
    onTeamNameChange(teamNumber, creativeName);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Team {teamNumber === "team1" ? "1" : "2"}</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Players</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddPlayer(teamNumber)}
          >
            <PlusCircleIcon className="h-4 w-4 mr-1" />
            Add Player
          </Button>
        </div>
        
        {players.map((player, index) => (
          <div key={`${teamNumber}-player-${index}`} className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <Input
              value={player}
              onChange={(e) => onPlayerChange(teamNumber, index, e.target.value)}
              placeholder={`Player ${index + 1} name`}
              className="flex-1"
            />
            {players.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemovePlayer(teamNumber, index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      
      <div className="space-y-2">
        <Label>Team Name</Label>
        
        {showAlert && (
          <Alert variant="info" className="mb-2 py-2 text-sm">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Player names need at least 3 characters for automatic naming. A creative name was generated.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex space-x-2">
          <Input 
            value={teamName}
            onChange={(e) => onTeamNameChange(teamNumber, e.target.value)}
            placeholder="Enter team name" 
            className="flex-grow"
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={handleGenerateCreativeName}
            title="Generate creative team name"
          >
            <Wand2 className="h-4 w-4" />
          </Button>
        </div>
        <FormDescription className="text-xs">
          Auto-generated from player names. You can edit it.
        </FormDescription>
      </div>
    </div>
  );
};

export default TeamFormSection;
