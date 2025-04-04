
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTournament } from "@/contexts/tournament/useTournament";
import { TournamentFormat, TournamentStatus } from "@/types/tournament";

const CreateTournament = () => {
  const navigate = useNavigate();
  const { createTournament } = useTournament();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<TournamentFormat>("SINGLE_ELIMINATION");

  const handleCreateTournament = () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Tournament name is required.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create the tournament
      const tournament = createTournament({
        name: name.trim(),
        description: description.trim(),
        format: format as TournamentFormat,
        teams: [],
        courts: [],
        categories: [],
        startDate: new Date(),
        status: "DRAFT" as TournamentStatus, // Add the required status property
      });

      // Show success message
      toast({
        title: "Tournament Created",
        description: `${name} has been created successfully.`,
      });

      // Navigate to the tournament detail page
      navigate(`/tournament/${tournament.id}`);
    } catch (error) {
      console.error("Error creating tournament:", error);
      toast({
        title: "Error",
        description: "Failed to create tournament.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Create Tournament"
        description="Set up a new tournament with your desired settings."
      />

      <div className="bg-white shadow-sm rounded-lg p-6 max-w-3xl mx-auto mt-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Tournament Name</Label>
            <Input
              id="name"
              placeholder="Enter tournament name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your tournament"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">Tournament Format</Label>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value as TournamentFormat)}
            >
              <SelectTrigger id="format">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SINGLE_ELIMINATION">Single Elimination</SelectItem>
                <SelectItem value="DOUBLE_ELIMINATION">Double Elimination</SelectItem>
                <SelectItem value="ROUND_ROBIN">Round Robin</SelectItem>
                <SelectItem value="GROUP_STAGE">Group Stage + Knockout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4">
            <Button onClick={handleCreateTournament} className="w-full">
              Create Tournament
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTournament;
