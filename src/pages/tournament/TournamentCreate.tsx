
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TournamentFormValues } from '@/components/admin/tournament/types';
import { TournamentFormat } from '@/types/tournament-enums';
import { Tournament } from '@/types/tournament';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTournament } from '@/contexts/tournament/useTournament';
import CreateTournamentForm from '@/components/admin/TournamentCreationForm';
import { Button } from '@/components/ui/button';
import { PackagePlus, Loader2 } from 'lucide-react';

// Define props to match what's expected by the parent component
interface TournamentCreateComponentProps {
  onTournamentCreated: (tournament: Tournament) => void;
}

const TournamentCreate: React.FC<TournamentCreateComponentProps> = ({ onTournamentCreated }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { createTournament, loadSampleData } = useTournament();

  const handleCreateTournament = async (data: TournamentFormValues) => {
    setIsLoading(true);
    try {
      const tournament = await createTournament(data);
      toast({
        title: "Tournament Created",
        description: `${data.name} has been created successfully!`,
      });
      
      onTournamentCreated(tournament);
    } catch (error) {
      console.error("Error creating tournament:", error);
      toast({
        title: "Error",
        description: "Failed to create tournament. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = async (format: TournamentFormat) => {
    setIsLoading(true);
    try {
      await loadSampleData(format);
      toast({
        title: "Sample Data Loaded",
        description: "Sample tournament has been created successfully!",
      });
      navigate("/tournaments");
    } catch (error) {
      console.error("Error loading sample data:", error);
      toast({
        title: "Error",
        description: "Failed to load sample data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Tournament</CardTitle>
          <CardDescription>
            Set up your tournament details, format, and settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual">
            <TabsList className="mb-4">
              <TabsTrigger value="manual">Manual Setup</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>
            <TabsContent value="manual">
              <CreateTournamentForm onSubmit={handleCreateTournament} />
            </TabsContent>
            <TabsContent value="templates">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tournament Templates</h3>
                <p className="text-muted-foreground">
                  Choose a pre-configured tournament template to get started quickly.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <Card className="cursor-pointer hover:border-primary transition-all">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Single Elimination</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        Classic bracket tournament with single elimination format.
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleLoadSample(TournamentFormat.SINGLE_ELIMINATION)}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PackagePlus className="h-4 w-4 mr-2" />}
                        Load Template
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary transition-all">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Double Elimination</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        Two chances for each team with winners and losers brackets.
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleLoadSample(TournamentFormat.DOUBLE_ELIMINATION)}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PackagePlus className="h-4 w-4 mr-2" />}
                        Load Template
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary transition-all">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Round Robin</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        Each team plays against every other team once.
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleLoadSample(TournamentFormat.ROUND_ROBIN)}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PackagePlus className="h-4 w-4 mr-2" />}
                        Load Template
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentCreate;
