import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTournament } from "@/contexts/tournament/useTournament";
import { useRegistration } from "@/contexts/registration/useRegistration";
import { useAuth } from "@/contexts/auth/AuthContext";
import PlayerRegistrationForm from "@/components/registration/PlayerRegistrationForm";
import TeamRegistrationForm from "@/components/registration/TeamRegistrationForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tournament } from "@/types/tournament";
import { PlayerRegistration, TeamRegistration } from "@/types/registration";

const TournamentRegistrationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedTournament, selectTournament } = useTournament();
  const { registerPlayer, registerTeam, isLoading, error } = useRegistration();
  const { user } = useAuth();
  const [selectedDivision, setSelectedDivision] = useState<string>("");

  useEffect(() => {
    if (id) {
      selectTournament(id);
    }
  }, [id, selectTournament]);

  useEffect(() => {
    // Reset selected division when tournament changes
    setSelectedDivision("");
  }, [selectedTournament?.id]);

  if (!selectedTournament) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Tournament not found</AlertDescription>
      </Alert>
    );
  }

  if (!selectedTournament.registrationEnabled) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Registration is not enabled for this tournament</AlertDescription>
      </Alert>
    );
  }

  if (selectedTournament.requirePlayerProfile && !user) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please <Button variant="link" onClick={() => navigate("/login")}>log in</Button> and complete your profile to register for this tournament
        </AlertDescription>
      </Alert>
    );
  }

  const handlePlayerRegistration = async (data: PlayerRegistration) => {
    if (!id || !selectedDivision || !user?.id) return;
    await registerPlayer(id, data);
  };

  const handleTeamRegistration = async (data: TeamRegistration) => {
    if (!id || !selectedDivision || !user?.id) return;
    await registerTeam(id, data);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{selectedTournament.name}</h1>
        <p className="text-muted-foreground">Tournament Registration</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Division</CardTitle>
          <CardDescription>Choose the division you want to register for</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="division">Division</Label>
            <Select
              value={selectedDivision}
              onValueChange={setSelectedDivision}
            >
              <SelectTrigger id="division">
                <SelectValue placeholder="Select a division" />
              </SelectTrigger>
              <SelectContent>
                {selectedTournament.categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedDivision && user && (
        <Tabs defaultValue="player" className="space-y-4">
          <TabsList>
            <TabsTrigger value="player">Individual Registration</TabsTrigger>
            <TabsTrigger value="team">Team Registration</TabsTrigger>
          </TabsList>

          <TabsContent value="player">
            <PlayerRegistrationForm
              tournamentId={id!}
              divisionId={selectedDivision}
              playerId={user.id}
              onSubmit={handlePlayerRegistration}
              registrationDeadline={selectedTournament.registrationDeadline?.toLocaleDateString()}
            />
          </TabsContent>

          <TabsContent value="team">
            <TeamRegistrationForm
              tournamentId={id!}
              divisionId={selectedDivision}
              playerId={user.id}
              onSubmit={handleTeamRegistration}
              registrationDeadline={selectedTournament.registrationDeadline?.toLocaleDateString()}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default TournamentRegistrationPage; 