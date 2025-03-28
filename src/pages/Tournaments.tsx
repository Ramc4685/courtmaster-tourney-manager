
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Trophy, Calendar, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/shared/PageHeader";
import { useTournament } from "@/contexts/TournamentContext";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const Tournaments = () => {
  const { tournaments, setCurrentTournament } = useTournament();
  const { toast } = useToast();

  // Ensure dates are properly parsed
  useEffect(() => {
    // This is only for logging purposes to help debug
    console.log("Current tournaments in context:", tournaments);
  }, [tournaments]);

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

  const handleSelectTournament = (tournament: any) => {
    setCurrentTournament(tournament);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Tournaments"
          description="Create and manage your badminton tournaments"
          action={
            <Link to="/tournaments/create">
              <Button className="bg-court-green hover:bg-court-green/90">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Tournament
              </Button>
            </Link>
          }
        />

        {tournaments.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No tournaments yet</h3>
            <p className="mt-1 text-gray-500">Get started by creating a new tournament.</p>
            <div className="mt-6">
              <Link to="/tournaments/create">
                <Button className="bg-court-green hover:bg-court-green/90">
                  Create Tournament
                </Button>
              </Link>
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
                  <Link 
                    to={`/tournaments/${tournament.id}`}
                    onClick={() => handleSelectTournament(tournament)}
                  >
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </Link>
                  <div className="flex space-x-2">
                    <Link 
                      to={`/scoring/${tournament.id}`}
                      onClick={() => handleSelectTournament(tournament)}
                    >
                      <Button variant="outline" size="sm">
                        Scoring
                      </Button>
                    </Link>
                    <Link 
                      to={`/public/${tournament.id}`}
                      onClick={() => handleSelectTournament(tournament)}
                    >
                      <Button variant="outline" size="sm">
                        Public View
                      </Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Tournaments;
