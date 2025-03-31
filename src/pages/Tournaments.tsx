import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, Trophy, Calendar, Users, Eye, Database, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import PageHeader from "@/components/shared/PageHeader";
import { useTournament } from "@/contexts/TournamentContext";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth/AuthContext";

const Tournaments = () => {
  const { tournaments, setCurrentTournament, loadSampleData, deleteTournament } = useTournament();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Ensure dates are properly parsed
  useEffect(() => {
    console.log("Current tournaments in context:", tournaments);
    console.log("Current authenticated user:", user);
  }, [tournaments, user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="outline">Draft</Badge>;
      case "PUBLISHED":
        return <Badge variant="secondary">Published</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-court-green">In Progress</Badge>;
      case "COMPLETED":
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return null;
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case "SINGLE_ELIMINATION":
        return "Single Elimination";
      case "DOUBLE_ELIMINATION":
        return "Double Elimination";
      case "ROUND_ROBIN":
        return "Round Robin";
      case "GROUP_DIVISION":
        return "Group & Division";
      default:
        return format;
    }
  };

  const handleViewTournament = (tournament: any, e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Selecting tournament:", tournament.id);
    setCurrentTournament(tournament);
    navigate(`/tournament/${tournament.id}`);
  };

  const handleLoadSampleData = () => {
    loadSampleData();
    toast({
      title: "Sample data loaded",
      description: "A sample tournament with teams and matches has been created.",
    });
  };

  const handleDeleteTournament = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTournament(id);
    toast({
      title: "Tournament deleted",
      description: "The tournament has been deleted successfully",
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Tournaments"
        description="Create and manage your badminton tournaments"
        icon={<Trophy className="h-6 w-6 text-court-green" />}
        action={
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleLoadSampleData}
              className="flex items-center"
            >
              <Database className="mr-2 h-4 w-4" />
              Load Sample Data
            </Button>
            
            {user && (
              <Link to="/tournament/create">
                <Button className="bg-court-green hover:bg-court-green/90">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Tournament
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {tournaments.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No tournaments yet</h3>
          <p className="mt-1 text-gray-500">Get started by creating a new tournament or loading sample data.</p>
          <div className="mt-6 flex justify-center space-x-2">
            <Button 
              variant="outline" 
              onClick={handleLoadSampleData}
            >
              <Database className="mr-2 h-4 w-4" />
              Load Sample Data
            </Button>
            
            {user ? (
              <Link to="/tournament/create">
                <Button className="bg-court-green hover:bg-court-green/90">
                  Create Tournament
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button>
                  Log in to Create Tournaments
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="overflow-hidden">
              <div className="bg-court-green h-2" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 truncate">
                    {tournament.name}
                  </h3>
                  {getStatusBadge(tournament.status)}
                </div>
                <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                  {tournament.description || "No description"}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      {format(new Date(tournament.startDate), "MMMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Trophy className="h-4 w-4 mr-2" />
                    <span>{getFormatLabel(tournament.format)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{tournament.teams.length} Teams</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 px-6 py-3 flex justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => handleViewTournament(tournament, e)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                <div className="flex space-x-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-500 border-red-200 hover:bg-red-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the tournament and all its data.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={(e) => handleDeleteTournament(tournament.id, e)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <Link 
                    to={`/scoring/${tournament.id}`}
                    onClick={() => setCurrentTournament(tournament)}
                  >
                    <Button variant="outline" size="sm">
                      Scoring
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tournaments;
