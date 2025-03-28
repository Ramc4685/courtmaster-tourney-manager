
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarIcon, PlusCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format as formatDate } from "date-fns"; // Fixed import with alias to avoid conflicts
import { useTournament } from "@/contexts/TournamentContext";
import { TournamentFormat, TournamentStatus } from "@/types/tournament";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/auth/AuthContext";
import PageHeader from "@/components/shared/PageHeader";

const TournamentCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createTournament } = useTournament();
  const { user } = useAuth(); // Get the current user from auth context

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<TournamentFormat>("GROUP_DIVISION");
  const [divisionProgression, setDivisionProgression] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [courtCount, setCourtCount] = useState(2);

  // Check if the user is authenticated when the component mounts
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to create a tournament",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [user, toast, navigate]);

  const handleCreateTournament = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to create a tournament",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Tournament name is required",
        variant: "destructive",
      });
      return;
    }

    if (!startDate) {
      toast({
        title: "Error",
        description: "Start date is required",
        variant: "destructive",
      });
      return;
    }

    // Create courts based on court count
    const courts = Array.from({ length: courtCount }, (_, index) => ({
      id: `court-${index + 1}`,
      name: `Court ${index + 1}`,
      number: index + 1,
      status: "AVAILABLE" as const,
    }));

    try {
      // Create the tournament with a specific ID format
      const tournamentId = `tournament-${Date.now()}`;
      const newTournament = {
        id: tournamentId,
        name,
        description,
        format,
        status: "DRAFT" as TournamentStatus,  // Fixed: explicitly cast to TournamentStatus
        teams: [],
        courts,
        startDate,
        endDate,
        divisionProgression,
        currentStage: "INITIAL_ROUND" as const,
        matches: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Save the tournament
      const createdTournament = createTournament(newTournament);
      
      toast({
        title: "Success",
        description: "Tournament created successfully",
      });
      
      // Navigate to the specific tournament detail page
      navigate(`/tournaments/${tournamentId}`);
    } catch (error) {
      console.error("Error creating tournament:", error);
      toast({
        title: "Error",
        description: "Failed to create tournament. Please try again.",
        variant: "destructive",
      });
    }
  };

  // If not authenticated, don't render the form
  if (!user) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto text-center py-12">
          <h2 className="text-xl font-semibold">Authentication Required</h2>
          <p className="mt-2">Please log in to create a tournament.</p>
          <Button className="mt-4" onClick={() => navigate('/login')}>
            Log In
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <PageHeader 
          title="Create New Tournament" 
          description="Set up your badminton tournament details"
          icon={<PlusCircle className="h-6 w-6 text-court-green" />}
        />
        <Card>
          <CardHeader>
            <CardTitle>Tournament Details</CardTitle>
            <CardDescription>
              Configure your tournament settings and format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                placeholder="Enter tournament description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Tournament Format</Label>
              <Select
                value={format}
                onValueChange={(value: TournamentFormat) => setFormat(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE_ELIMINATION">Single Elimination</SelectItem>
                  <SelectItem value="DOUBLE_ELIMINATION">Double Elimination</SelectItem>
                  <SelectItem value="ROUND_ROBIN">Round Robin</SelectItem>
                  <SelectItem value="GROUP_DIVISION">Group & Division Format</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {format === "GROUP_DIVISION" && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="division-progression"
                  checked={divisionProgression}
                  onCheckedChange={setDivisionProgression}
                />
                <Label htmlFor="division-progression">
                  Enable Division Progression (win/loss moves teams between divisions)
                </Label>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? formatDate(startDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? formatDate(endDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="courts">Number of Courts</Label>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCourtCount(Math.max(1, courtCount - 1))}
                  disabled={courtCount <= 1}
                >
                  -
                </Button>
                <span className="w-8 text-center">{courtCount}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCourtCount(courtCount + 1)}
                >
                  +
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => navigate("/tournaments")}>
              Cancel
            </Button>
            <Button onClick={handleCreateTournament}>
              Create Tournament
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default TournamentCreate;
