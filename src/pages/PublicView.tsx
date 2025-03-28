
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { RefreshCw, Award, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTournament } from "@/contexts/TournamentContext";
import Layout from "@/components/layout/Layout";
import MatchCard from "@/components/shared/MatchCard";
import CourtCard from "@/components/shared/CourtCard";
import { Match, Division } from "@/types/tournament";
import { format } from "date-fns";

const PublicView = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { currentTournament, tournaments } = useTournament();
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [displayTournament, setDisplayTournament] = useState<any>(null);

  useEffect(() => {
    // If tournamentId is provided, find that specific tournament
    if (tournamentId) {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (tournament) {
        setDisplayTournament(tournament);
        return;
      }
    }
    
    // Otherwise use the current tournament
    if (currentTournament) {
      setDisplayTournament(currentTournament);
    }
  }, [tournamentId, currentTournament, tournaments]);

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!displayTournament) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <p>No tournament selected. Please select a tournament first.</p>
        </div>
      </Layout>
    );
  }

  const inProgressMatches = displayTournament.matches.filter(
    (match) => match.status === "IN_PROGRESS"
  );

  const completedMatches = displayTournament.matches.filter(
    (match) => match.status === "COMPLETED"
  );

  const upcomingMatches = displayTournament.matches.filter(
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

  const handleRefresh = () => {
    setRefreshing(true);
    // In a real app, you would fetch the latest data here
    setTimeout(() => {
      setLastRefreshed(new Date());
      setRefreshing(false);
    }, 500);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "Not Started";
      case "IN_PROGRESS":
        return "In Progress";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
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
              <MatchCard key={match.id} match={match} />
              <div className="mt-2 flex justify-between">
                {match.scheduledTime && (
                  <div className="text-sm text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{format(new Date(match.scheduledTime), "MMM d, yyyy")}</span>
                    <Clock className="h-4 w-4 ml-3 mr-1" />
                    <span>{format(new Date(match.scheduledTime), "h:mm a")}</span>
                  </div>
                )}
                <Badge variant={match.status === "IN_PROGRESS" ? "secondary" : "outline"}>
                  {getStatusLabel(match.status)}
                </Badge>
              </div>
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
            <h1 className="text-2xl md:text-3xl font-bold">{displayTournament.name}</h1>
            <p className="text-gray-500">
              Live Tournament Updates
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

        <Tabs defaultValue="live" className="mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="live">Live Matches</TabsTrigger>
            <TabsTrigger value="courts">Courts</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="live">
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
              {displayTournament.courts.map((court) => (
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
