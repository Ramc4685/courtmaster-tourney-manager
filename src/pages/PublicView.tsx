
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { RefreshCw, Award, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import MatchCard from "@/components/shared/MatchCard";
import CourtCard from "@/components/shared/CourtCard";
import LiveVideoLink from "@/components/shared/LiveVideoLink";
import { Match, Division } from "@/types/tournament";
import { format } from "date-fns";
import { tournamentService } from "@/services/tournament/TournamentService";
import { useTournament } from "@/contexts/tournament/useTournament";

const PublicView = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [tournament, setTournament] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const { currentTournament, tournaments } = useTournament(); // Use the context to get tournaments

  // Fetch tournament data
  useEffect(() => {
    const loadTournament = async () => {
      if (!tournamentId) return;
      
      try {
        // Try to get tournaments from the context first
        if (tournaments && tournaments.length > 0) {
          const foundTournament = tournaments.find(t => t.id === tournamentId);
          if (foundTournament) {
            console.log("Found tournament in context:", foundTournament.name);
            setTournament(foundTournament);
            setLastRefreshed(new Date());
            return;
          }
        }
        
        // Check if current tournament matches the requested ID
        if (currentTournament && currentTournament.id === tournamentId) {
          console.log("Using current tournament:", currentTournament.name);
          setTournament(currentTournament);
          setLastRefreshed(new Date());
          return;
        }
        
        // Fallback to service if not found in context
        const serviceTournaments = await tournamentService.getTournaments();
        const foundTournament = serviceTournaments.find(t => t.id === tournamentId);
        
        if (foundTournament) {
          console.log("Found tournament in service:", foundTournament.name);
          setTournament(foundTournament);
          setLastRefreshed(new Date());
        } else {
          console.error("Tournament not found with ID:", tournamentId);
        }
      } catch (error) {
        console.error("Error loading tournament:", error);
      }
    };
    
    loadTournament();
  }, [tournamentId, tournaments, currentTournament]);

  const handleRefresh = async () => {
    setRefreshing(true);
    
    if (tournamentId) {
      try {
        // Try to get tournaments from the context first
        if (tournaments && tournaments.length > 0) {
          const refreshedTournament = tournaments.find(t => t.id === tournamentId);
          if (refreshedTournament) {
            setTournament(refreshedTournament);
          }
        } else if (currentTournament && currentTournament.id === tournamentId) {
          setTournament(currentTournament);
        } else {
          // Fallback to service
          const serviceTournaments = await tournamentService.getTournaments();
          const refreshedTournament = serviceTournaments.find(t => t.id === tournamentId);
          
          if (refreshedTournament) {
            setTournament(refreshedTournament);
          }
        }
      } catch (error) {
        console.error("Error refreshing tournament:", error);
      }
    }
    
    setLastRefreshed(new Date());
    setTimeout(() => setRefreshing(false), 500);
  };

  if (!tournament) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-4">
          <div className="text-center py-10">
            <p className="text-gray-500">Loading tournament data...</p>
            <Button variant="outline" className="mt-4" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Loading
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const inProgressMatches = tournament.matches?.filter(
    (match) => match.status === "IN_PROGRESS"
  ) || [];
  
  const completedMatches = tournament.matches?.filter(
    (match) => match.status === "COMPLETED"
  ) || [];

  const upcomingMatches = tournament.matches?.filter(
    (match) => match.status === "SCHEDULED"
  )?.sort((a, b) => {
    // Sort by scheduled time if available
    if (a.scheduledTime && b.scheduledTime) {
      return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
    } else if (a.scheduledTime) {
      return -1;
    } else if (b.scheduledTime) {
      return 1;
    }
    return 0;
  }) || [];

  const groupByDivision = (matches: Match[]) => {
    return matches.reduce((groups, match) => {
      const division = match.division || 'NO_DIVISION';
      if (!groups[division]) {
        groups[division] = [];
      }
      groups[division].push(match);
      return groups;
    }, {} as Record<string, Match[]>);
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
      case "NO_DIVISION":
        return "Uncategorized Matches";
      default:
        return division;
    }
  };

  const renderMatchesByDivision = (matches: Match[]) => {
    if (!matches || matches.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No matches to display</p>
        </div>
      );
    }
    
    const grouped = groupByDivision(matches);
    
    return Object.entries(grouped).map(([division, divMatches]) => (
      <div key={division} className="mb-6">
        <h3 className="font-semibold text-lg mb-3 flex items-center">
          <Award className="h-5 w-5 text-blue-500 mr-2" />
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
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{tournament.name}</h1>
            <p className="text-gray-500">
              {tournament.startDate && format(new Date(tournament.startDate), "MMMM d, yyyy")}
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

        {/* Add Live Video Link */}
        {tournamentId && (
          <div className="mb-6">
            <LiveVideoLink tournamentId={tournamentId} />
          </div>
        )}

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
            {!tournament.courts || tournament.courts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No courts available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournament.courts.map((court) => (
                  <CourtCard key={court.id} court={court} detailed />
                ))}
              </div>
            )}
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
