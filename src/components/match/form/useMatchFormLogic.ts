
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useStandaloneMatchStore } from "@/stores/standaloneMatchStore";
import { Team, StandaloneMatch } from "@/types/tournament";
import { generateTeamName } from "@/utils/teamNameUtils";
import { FormValues } from "../StandaloneMatchForm";

export const useMatchFormLogic = () => {
  const standaloneMatchStore = useStandaloneMatchStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [team1Players, setTeam1Players] = useState<string[]>(['']);
  const [team2Players, setTeam2Players] = useState<string[]>(['']);
  const [team1NameEdited, setTeam1NameEdited] = useState(false);
  const [team2NameEdited, setTeam2NameEdited] = useState(false);
  const [showTeam1Alert, setShowTeam1Alert] = useState(false);
  const [showTeam2Alert, setShowTeam2Alert] = useState(false);
  
  const formSchema = z.object({
    team1Name: z.string().min(1, { message: "Team 1 name is required" }),
    team1Players: z.array(z.string()),
    team2Name: z.string().min(1, { message: "Team 2 name is required" }),
    team2Players: z.array(z.string()),
    scheduledDate: z.date().optional(),
    courtName: z.string().optional(),
    tournamentName: z.string().optional(),
    categoryName: z.string().optional(),
    isPublic: z.boolean().default(false)
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      team1Name: "",
      team1Players: [""],
      team2Name: "",
      team2Players: [""],
      isPublic: false
    }
  });

  // Update team names when player names change
  useEffect(() => {
    if (!team1NameEdited && team1Players.some(p => p.trim() !== '')) {
      const nonEmptyPlayers = team1Players.filter(p => p.trim() !== '');
      const generatedName = generateTeamName(nonEmptyPlayers);
      
      // If we got a creative team name (not derived from player names)
      // or if any player name is too short, show an alert
      const hasShortNames = nonEmptyPlayers.some(name => name.trim().length < 3);
      setShowTeam1Alert(nonEmptyPlayers.length > 0 && hasShortNames);
      
      if (generatedName) {
        form.setValue('team1Name', generatedName);
      }
    }
  }, [team1Players, form, team1NameEdited]);

  useEffect(() => {
    if (!team2NameEdited && team2Players.some(p => p.trim() !== '')) {
      const nonEmptyPlayers = team2Players.filter(p => p.trim() !== '');
      const generatedName = generateTeamName(nonEmptyPlayers);
      
      // If we got a creative team name (not derived from player names)
      // or if any player name is too short, show an alert
      const hasShortNames = nonEmptyPlayers.some(name => name.trim().length < 3);
      setShowTeam2Alert(nonEmptyPlayers.length > 0 && hasShortNames);
      
      if (generatedName) {
        form.setValue('team2Name', generatedName);
      }
    }
  }, [team2Players, form, team2NameEdited]);

  const handleAddPlayer = (team: "team1" | "team2") => {
    if (team === "team1") {
      setTeam1Players([...team1Players, '']);
    } else {
      setTeam2Players([...team2Players, '']);
    }
  };

  const handleRemovePlayer = (team: "team1" | "team2", index: number) => {
    if (team === "team1") {
      if (team1Players.length <= 1) return;
      const newPlayers = [...team1Players];
      newPlayers.splice(index, 1);
      setTeam1Players(newPlayers);
    } else {
      if (team2Players.length <= 1) return;
      const newPlayers = [...team2Players];
      newPlayers.splice(index, 1);
      setTeam2Players(newPlayers);
    }
  };

  const handlePlayerChange = (team: "team1" | "team2", index: number, value: string) => {
    if (team === "team1") {
      const newPlayers = [...team1Players];
      newPlayers[index] = value;
      setTeam1Players(newPlayers);
      form.setValue("team1Players", newPlayers.filter(p => p.trim() !== ''));
    } else {
      const newPlayers = [...team2Players];
      newPlayers[index] = value;
      setTeam2Players(newPlayers);
      form.setValue("team2Players", newPlayers.filter(p => p.trim() !== ''));
    }
  };

  const handleTeamNameChange = (team: "team1" | "team2", value: string) => {
    if (team === "team1") {
      form.setValue('team1Name', value);
      setTeam1NameEdited(true);
      setShowTeam1Alert(false);
    } else {
      form.setValue('team2Name', value);
      setTeam2NameEdited(true);
      setShowTeam2Alert(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      // Create teams from form data
      const filteredTeam1Players = team1Players.filter(p => p.trim() !== '');
      const filteredTeam2Players = team2Players.filter(p => p.trim() !== '');
      
      const team1: Team = {
        id: `team1-${Date.now()}`,
        name: data.team1Name,
        players: filteredTeam1Players.map((name, index) => ({
          id: `player-team1-${index}-${Date.now()}`,
          name
        }))
      };
      
      const team2: Team = {
        id: `team2-${Date.now()}`,
        name: data.team2Name,
        players: filteredTeam2Players.map((name, index) => ({
          id: `player-team2-${index}-${Date.now()}`,
          name
        }))
      };
      
      // Create the match with proper type annotation
      const matchData: Partial<StandaloneMatch> = {
        team1,
        team2,
        scheduledTime: data.scheduledDate
      };
      
      // Add additional fields if provided
      if (data.courtName) {
        matchData.courtName = data.courtName;
      }
      
      if (data.tournamentName) {
        matchData.tournamentName = data.tournamentName;
      }
      
      if (data.categoryName) {
        matchData.categoryName = data.categoryName;
      }
      
      // Create match with the prepared data
      const match = standaloneMatchStore.createMatch(matchData);
      
      toast({
        title: "Match created",
        description: "Your match has been created successfully",
      });
      
      // Navigate to scoring page for the new match
      navigate(`/scoring?matchId=${match.id}&type=standalone`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create match",
        variant: "destructive",
      });
      console.error("Error creating match:", error);
    }
  };

  return {
    form,
    team1Players,
    team2Players,
    showTeam1Alert,
    showTeam2Alert,
    handleAddPlayer,
    handleRemovePlayer,
    handlePlayerChange,
    handleTeamNameChange,
    onSubmit
  };
};
