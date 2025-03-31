
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useStandaloneMatchStore } from "@/stores/standaloneMatchStore";
import { Team } from "@/types/tournament";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { CalendarIcon, PlusCircleIcon, User, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

type FormValues = z.infer<typeof formSchema>;

const StandaloneMatchForm: React.FC = () => {
  const { createMatch } = useStandaloneMatchStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [team1Players, setTeam1Players] = useState<string[]>(['']);
  const [team2Players, setTeam2Players] = useState<string[]>(['']);
  
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

  // Generate team name based on player names
  const generateTeamName = (players: string[]): string => {
    const validPlayers = players.filter(name => name.trim() !== '');
    
    if (validPlayers.length === 0) {
      return "";
    }
    
    if (validPlayers.length === 1) {
      // Single player - use their name
      return validPlayers[0].trim();
    } else {
      // Multiple players - use first names or initials
      const parts = validPlayers.map(name => {
        const nameParts = name.trim().split(' ');
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

  // Effect to update team names when players change
  useEffect(() => {
    const validPlayers = team1Players.filter(name => name.trim() !== '');
    if (validPlayers.length > 0 && !form.getValues('team1Name')) {
      const generatedName = generateTeamName(team1Players);
      form.setValue('team1Name', generatedName);
    }
  }, [team1Players, form]);

  useEffect(() => {
    const validPlayers = team2Players.filter(name => name.trim() !== '');
    if (validPlayers.length > 0 && !form.getValues('team2Name')) {
      const generatedName = generateTeamName(team2Players);
      form.setValue('team2Name', generatedName);
    }
  }, [team2Players, form]);

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
      
      // Only auto-update team name if it hasn't been manually modified
      if (!form.getValues('team1Name')) {
        const generatedName = generateTeamName(newPlayers);
        form.setValue('team1Name', generatedName);
      }
    } else {
      const newPlayers = [...team2Players];
      newPlayers[index] = value;
      setTeam2Players(newPlayers);
      form.setValue("team2Players", newPlayers.filter(p => p.trim() !== ''));
      
      // Only auto-update team name if it hasn't been manually modified
      if (!form.getValues('team2Name')) {
        const generatedName = generateTeamName(newPlayers);
        form.setValue('team2Name', generatedName);
      }
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
      
      // Create the match
      const match = await createMatch(team1, team2, data.scheduledDate);
      
      // Update additional fields if provided
      if (match) {
        let updatedMatch = { ...match };
        
        if (data.courtName) {
          updatedMatch.courtName = data.courtName;
        }
        
        if (data.tournamentName) {
          updatedMatch.tournamentName = data.tournamentName;
        }
        
        if (data.categoryName) {
          updatedMatch.categoryName = data.categoryName;
        }
        
        // If match has been updated with additional fields, save it
        if (updatedMatch !== match) {
          await useStandaloneMatchStore.getState().updateMatch(updatedMatch);
        }
        
        toast({
          title: "Match created",
          description: "Your match has been created successfully",
        });
        
        // Navigate to scoring page for the new match
        navigate(`/scoring?matchId=${match.id}&type=standalone`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create match",
        variant: "destructive",
      });
      console.error("Error creating match:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Create Quick Match</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team 1 Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Team 1</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Players</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddPlayer("team1")}
                  >
                    <PlusCircleIcon className="h-4 w-4 mr-1" />
                    Add Player
                  </Button>
                </div>
                
                {team1Players.map((player, index) => (
                  <div key={`team1-player-${index}`} className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <Input
                      value={player}
                      onChange={(e) => handlePlayerChange("team1", index, e.target.value)}
                      placeholder={`Player ${index + 1} name`}
                      className="flex-1"
                    />
                    {team1Players.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePlayer("team1", index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <FormField
                control={form.control}
                name="team1Name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter team name" />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Auto-generated from player names. You can edit it.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Team 2 Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Team 2</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Players</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddPlayer("team2")}
                  >
                    <PlusCircleIcon className="h-4 w-4 mr-1" />
                    Add Player
                  </Button>
                </div>
                
                {team2Players.map((player, index) => (
                  <div key={`team2-player-${index}`} className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <Input
                      value={player}
                      onChange={(e) => handlePlayerChange("team2", index, e.target.value)}
                      placeholder={`Player ${index + 1} name`}
                      className="flex-1"
                    />
                    {team2Players.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePlayer("team2", index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <FormField
                control={form.control}
                name="team2Name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter team name" />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Auto-generated from player names. You can edit it.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Match Date/Time (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courtName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Court Name (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter court name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="tournamentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tournament Name (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter tournament name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Division/Category (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter division or category" />
                  </FormControl>
                  <FormDescription>
                    Ex: Men's Singles, Mixed Doubles, Open Division, etc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="isPublic"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Make match publicly viewable</FormLabel>
                  <FormDescription>
                    Anyone with the link will be able to view this match's scores
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          <div className="flex justify-end">
            <Button type="submit" className="bg-court-green hover:bg-court-green/90">
              Create Match
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default StandaloneMatchForm;
