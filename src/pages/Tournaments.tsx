import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTournament } from '@/contexts/tournament/useTournament';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/shared/PageHeader';

const Tournaments = () => {
  const { tournaments, loadSampleData, deleteTournament, setCurrentTournament } = useTournament();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Load tournaments on mount if empty
  useEffect(() => {
    if (tournaments.length === 0) {
      console.log('No tournaments found, you can load sample data');
    } else {
      console.log(`Found ${tournaments.length} tournaments`);
    }
  }, [tournaments]);
  
  // Handle loading sample data
  const handleLoadSample = async () => {
    try {
      setIsLoading(true);
      await loadSampleData(); // No format parameter needed
      toast({
        title: "Sample data loaded",
        description: "Sample tournament has been created successfully",
      });
    } catch (error) {
      console.error("Failed to load sample data", error);
      toast({
        title: "Error loading sample data",
        description: "There was a problem creating the sample tournament",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  // Handle deletion of a tournament
  const handleDeleteTournament = async (id: string) => {
    try {
      await deleteTournament(id);
      toast({
        title: "Tournament deleted",
        description: "The tournament has been removed successfully",
      });
    } catch (error) {
      console.error("Failed to delete tournament", error);
      toast({
        title: "Error deleting tournament",
        description: "There was a problem removing the tournament",
        variant: "destructive",
      });
    }
  }

  // Handle tournament selection
  const handleSelectTournament = async (tournament: any) => {
    await setCurrentTournament(tournament);
    navigate(`/tournament/${tournament.id}`);
  }
  
  return (
    <div className="container py-6 space-y-6">
      <PageHeader
        title="Tournaments"
        description="Manage your badminton tournaments"
        action={
          <Link to="/tournament/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Tournament
            </Button>
          </Link>
        }
      />
      
      {tournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-gray-50">
          <h3 className="text-xl font-semibold mb-4">No tournaments yet</h3>
          <p className="text-muted-foreground mb-6">
            You haven't created any tournaments yet. Create a new one or load a sample tournament to get started.
          </p>
          
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => handleLoadSample()} disabled={isLoading}>
              Load Sample Tournament
            </Button>
            <Link to="/tournament/create">
              <Button variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Tournament
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{tournament.name}</CardTitle>
                    <CardDescription className="line-clamp-1">
                      {tournament.description || "No description"}
                    </CardDescription>
                  </div>
                  <Badge variant={tournament.status === 'DRAFT' ? 'outline' : 'default'}>
                    {tournament.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pb-2">
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <CalendarIcon className="mr-1 h-4 w-4" />
                  {tournament.startDate ? format(new Date(tournament.startDate), 'PPP') : 'No date set'}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{tournament.format || 'Standard'}</Badge>
                  <Badge variant="outline">{tournament.teams?.length || 0} teams</Badge>
                  <Badge variant="outline">{tournament.matches?.length || 0} matches</Badge>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => handleSelectTournament(tournament)}>
                  View Details
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteTournament(tournament.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </CardFooter>
            </Card>
          ))}
          
          <Card className="border-dashed flex flex-col items-center justify-center p-6 bg-muted/50">
            <Link to="/tournament/create" className="flex flex-col items-center text-center">
              <PlusCircle className="h-10 w-10 mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-1">Create new tournament</h3>
              <p className="text-sm text-muted-foreground">Add a new tournament to your collection</p>
            </Link>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Tournaments;
