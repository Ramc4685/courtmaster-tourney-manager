
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Database, PlusCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { useTournament } from "@/contexts/TournamentContext";
import { useToast } from "@/hooks/use-toast";

const Home = () => {
  const { tournaments, loadSampleData, currentTournament, setCurrentTournament } = useTournament();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLoadSampleData = () => {
    loadSampleData();
    toast({
      title: "Sample data loaded",
      description: "A sample tournament with teams and matches has been created.",
    });
  };

  const handleSelectTournament = (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (tournament) {
      setCurrentTournament(tournament);
      navigate(`/tournaments/${tournamentId}`);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center mb-12 text-center">
          <Trophy className="h-16 w-16 text-court-green mb-4" />
          <h1 className="text-4xl font-bold mb-2">CourtMaster Tournament Management</h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Create, manage, and score your badminton tournaments with ease
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
            <div className="space-y-4">
              <Link to="/tournaments/create">
                <Button className="w-full bg-court-green hover:bg-court-green/90">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Create New Tournament
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleLoadSampleData}
              >
                <Database className="mr-2 h-5 w-5" />
                Load Sample Tournament
              </Button>
              <Link to="/tournaments">
                <Button variant="outline" className="w-full">
                  <Trophy className="mr-2 h-5 w-5" />
                  View All Tournaments
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-2xl font-bold mb-4">Your Tournaments</h2>
            {tournaments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No tournaments yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Create a new tournament or load a sample tournament to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tournaments.slice(0, 5).map((tournament) => (
                  <div 
                    key={tournament.id} 
                    className="p-4 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleSelectTournament(tournament.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-lg">{tournament.name}</h3>
                        <p className="text-sm text-gray-500">
                          {tournament.teams.length} Teams • {tournament.matches.length} Matches
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Link to={`/tournaments/${tournament.id}`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                        <Link to={`/scoring/${tournament.id}`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm">Scoring</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                
                {tournaments.length > 5 && (
                  <Link to="/tournaments" className="block text-center text-sm text-court-green hover:underline mt-4">
                    View all tournaments
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {currentTournament && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Current Tournament</h2>
              <Link to={`/tournaments/${currentTournament.id}`}>
                <Button variant="outline" size="sm">View Details</Button>
              </Link>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{currentTournament.name}</h3>
                <p className="text-gray-600">{currentTournament.description || "No description"}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Teams</p>
                  <p className="text-2xl font-bold">{currentTournament.teams.length}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Matches</p>
                  <p className="text-2xl font-bold">{currentTournament.matches.length}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Courts</p>
                  <p className="text-2xl font-bold">{currentTournament.courts.length}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">In Progress</p>
                  <p className="text-2xl font-bold">
                    {currentTournament.matches.filter(m => m.status === "IN_PROGRESS").length}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2 pt-2">
                <Link to={`/tournaments/${currentTournament.id}`}>
                  <Button variant="outline">Manage Tournament</Button>
                </Link>
                <Link to={`/scoring/${currentTournament.id}`}>
                  <Button className="bg-court-green hover:bg-court-green/90">Go to Scoring</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Home;
