
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { tournamentService } from "@/services/tournament/TournamentService";
import { format } from "date-fns";
import { Calendar, Users, Trophy, ExternalLink } from "lucide-react";

const Public = () => {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const allTournaments = await tournamentService.getTournaments();
        // Only show published tournaments
        const publishedTournaments = allTournaments.filter(t => t.status === "PUBLISHED" || t.status === "IN_PROGRESS");
        setTournaments(publishedTournaments);
      } catch (error) {
        console.error("Error loading tournaments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTournaments();
  }, []);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Tournament Viewer</h1>
        <p className="mb-8">
          Select a tournament below to view details, matches, and results.
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Tournaments Available</h3>
            <p className="text-gray-500 mb-4">
              There are currently no published tournaments to display.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map(tournament => (
              <Card key={tournament.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle>{tournament.name}</CardTitle>
                  <CardDescription>
                    {tournament.status === "IN_PROGRESS" ? (
                      <span className="text-green-600 font-medium">In Progress</span>
                    ) : (
                      <span>Published</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    {tournament.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {tournament.description}
                      </p>
                    )}
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>
                        {format(new Date(tournament.startDate), "MMM d, yyyy")}
                        {tournament.endDate && (
                          <> - {format(new Date(tournament.endDate), "MMM d, yyyy")}</>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{tournament.teams?.length || 0} Teams</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="default" className="w-full" size="sm">
                    <Link to={`/public/${tournament.id}`}>
                      View Tournament <ExternalLink className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 p-5 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Direct Access</h2>
          <p className="text-gray-600 mb-3">
            If you have a tournament ID, you can also access it directly using the URL format:
          </p>
          <code className="block p-3 bg-gray-100 rounded text-sm">/public/[tournament-id]</code>
          <p className="mt-3 text-gray-600 text-sm">
            For real-time updates during matches, use:
          </p>
          <code className="block p-3 bg-gray-100 rounded text-sm">/public/realtime/[tournament-id]</code>
        </div>
      </div>
    </Layout>
  );
};

export default Public;
