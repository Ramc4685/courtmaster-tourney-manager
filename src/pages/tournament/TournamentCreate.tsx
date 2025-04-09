
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
      navigate(`/tournament/${tournament.id}`);
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
      const tournament = await loadSampleData(format);
      toast({
        title: "Sample Data Loaded",
        description: "Sample tournament has been created successfully!",
      });
      navigate(`/tournament/${tournament.id}`);
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
    <div className="container mx-auto py-6">
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="mb-6 w-full max-w-md mx-auto">
          <TabsTrigger value="manual" className="flex-1 py-3">Manual Setup</TabsTrigger>
          <TabsTrigger value="templates" className="flex-1 py-3">Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual">
          <CreateTournamentForm onSubmit={handleCreateTournament} />
        </TabsContent>
        
        <TabsContent value="templates">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Tournament Templates</CardTitle>
              <CardDescription>
                Choose a pre-configured tournament template to get started quickly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Card className="cursor-pointer hover:border-court-green hover:shadow-md transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Single Elimination</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Classic bracket tournament with single elimination format.
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full border-court-green text-court-green hover:bg-court-green/10"
                      onClick={() => handleLoadSample(TournamentFormat.SINGLE_ELIMINATION)}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PackagePlus className="h-4 w-4 mr-2" />}
                      Load Template
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:border-court-green hover:shadow-md transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Double Elimination</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Two chances for each team with winners and losers brackets.
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full border-court-green text-court-green hover:bg-court-green/10"
                      onClick={() => handleLoadSample(TournamentFormat.DOUBLE_ELIMINATION)}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PackagePlus className="h-4 w-4 mr-2" />}
                      Load Template
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:border-court-green hover:shadow-md transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Round Robin</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Each team plays against every other team once.
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full border-court-green text-court-green hover:bg-court-green/10"
                      onClick={() => handleLoadSample(TournamentFormat.ROUND_ROBIN)}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PackagePlus className="h-4 w-4 mr-2" />}
                      Load Template
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TournamentCreate;
