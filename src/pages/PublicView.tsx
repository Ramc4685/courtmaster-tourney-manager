
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { RefreshCw, Award, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import MatchCard from "@/components/shared/MatchCard";
import CourtCard from "@/components/shared/CourtCard";
import { Match, Division } from "@/types/tournament";
import { format } from "date-fns";
import { tournamentService } from "@/services/tournament/TournamentService";

const PublicView = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [tournament, setTournament] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Fetch tournament data
  useEffect(() => {
    const loadTournament = async () => {
      if (!tournamentId) return;
      
      const tournaments = await tournamentService.getTournaments();
      const foundTournament = tournaments.find(t => t.id === tournamentId);
      
      if (foundTournament) {
        setTournament(foundTournament);
        setLastRefreshed(new Date());
      }
    };
    
    loadTournament();
  }, [tournamentId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    
    if (tournamentId) {
      const tournaments = await tournamentService.getTournaments();
      const refreshedTournament = tournaments.find(t => t.id === tournamentId);
      
      if (refreshedTournament) {
        setTournament(refreshedTournament);
      }
    }
    
    setLastRefreshed(new Date());
    setTimeout(() => setRefreshing(false), 500);
  };

  if (!tournament) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <p>Loading tournament data...</p>
        </div>
      </Layout>
    );
  }

  const inProgressMatches = tournament.matches.filter(
    (match) => match.status === "IN_PROGRESS"
  );
  
  const completedMatches = tournament.matches.filter(
    (match) => match.status === "COMPLETED"
  );

  const upcomingMatches = tournament.matches.filter(
    (match) => match.status === "SCHEDULED"
  ).sort((a, b) => {
    // Sort by scheduled time if available
    if (a.scheduledTime && b.scheduledTime) {
      return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
    } else if (a.scheduledTime) {
      return -1;
    } else if (b.scheduledTime) {
      return 1;
    }
    return 0;
  });

  const groupByDivision = (matches: Match[]) => {
    return matches.reduce((groups, match) => {
      const division = match.division;
      if (!groups[division]) {
        groups[division] = [];
      }
      groups[division].push(match);
      return groups;
    }, {} as Record<Division, Match[]>);
  };

  const getDivisionLabel = (division: string) => {
    switch (division) {
      case "GROUP_DIV3":
        return "Division 3 - Group Stage";
      case "DIVISION_1":
        return "Division 1";
      case "DIVISION_2":
        return "Division 2";
      case "DIVISION_3":
        return "Division 3";
      case "QUALIFIER_DIV1":
        return "Division 1 - Qualifiers";
      case "QUALIFIER_DIV2":
        return "Division 2 - Qualifiers";
      case "INITIAL":
        return "Initial Round";
      default:
        return division;
    }
  };

  const renderMatchesByDivision = (matches: Match[]) => {
    const grouped = groupByDivision(matches);
    
    return Object.entries(grouped).map(([division, divMatches]) => (
      <div key={division} className="mb-6">
        <h3 className="font-semibold text-lg mb-3 flex items-center">
          <Award className="h-5 w-5 text-court-blue mr-2" />
          {getDivisionLabel(division)}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {divMatches.map((match) => (
            <div key={match.id} className="border rounded-lg p-4">
              <MatchCard match={match} detailed />
            </div>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{tournament.name}</h1>
            <p className="text-gray-500">
              {format(new Date(tournament.startDate), "MMMM d, yyyy")}
              {tournament.endDate && (
                <> - {format(new Date(tournament.endDate), "MMMM d, yyyy")}</>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs defaultValue="inprogress" className="mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="inprogress">In Progress</TabsTrigger>
            <TabsTrigger value="courts">Courts</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="inprogress">
            {inProgressMatches.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No matches currently in progress</p>
              </div>
            ) : (
              renderMatchesByDivision(inProgressMatches)
            )}
          </TabsContent>

          <TabsContent value="courts">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournament.courts.map((court) => (
                <CourtCard key={court.id} court={court} detailed />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upcoming">
            {upcomingMatches.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No upcoming matches scheduled</p>
              </div>
            ) : (
              renderMatchesByDivision(upcomingMatches)
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedMatches.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No completed matches yet</p>
              </div>
            ) : (
              renderMatchesByDivision(completedMatches)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PublicView;
