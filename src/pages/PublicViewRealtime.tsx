
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { RefreshCw, Award, Clock, Calendar, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import MatchCard from "@/components/shared/MatchCard";
import CourtCard from "@/components/shared/CourtCard";
import { Match, Division } from "@/types/tournament";
import { format } from "date-fns";
import { useRealtimeTournamentUpdates } from "@/hooks/useRealtimeTournamentUpdates";

const PublicViewRealtime = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  console.log(`[DEBUG] PublicViewRealtime: Initializing with tournamentId=${tournamentId || 'undefined'}`);
  
  const { currentTournament, inProgressMatches, isSubscribed } = useRealtimeTournamentUpdates(tournamentId);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    console.log(`[DEBUG] PublicViewRealtime: Manual refresh requested`);
    setRefreshing(true);
    setLastRefreshed(new Date());
    setTimeout(() => setRefreshing(false), 500);
  };

  // Update last refreshed time when we get new data
  useEffect(() => {
    if (currentTournament) {
      console.log(`[DEBUG] PublicViewRealtime: Data refreshed at ${new Date().toISOString()}`);
      console.log(`[DEBUG] PublicViewRealtime: Current tournament: ${currentTournament.name}, matches: ${currentTournament.matches.length}`);
      console.log(`[DEBUG] PublicViewRealtime: In-progress matches: ${inProgressMatches.length}`);
      setLastRefreshed(new Date());
    }
  }, [currentTournament, inProgressMatches]);

  if (!currentTournament) {
    console.log(`[DEBUG] PublicViewRealtime: No tournament selected`);
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <p>No tournament selected. Please select a tournament first.</p>
        </div>
      </Layout>
    );
  }

  console.log(`[DEBUG] PublicViewRealtime: Rendering tournament ${currentTournament.id}. Subscription status: ${isSubscribed ? 'Active' : 'Inactive'}`);
  
  const completedMatches = currentTournament.matches.filter(
    (match) => match.status === "COMPLETED"
  );
  console.log(`[DEBUG] PublicViewRealtime: Completed matches: ${completedMatches.length}`);

  const upcomingMatches = currentTournament.matches.filter(
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
  console.log(`[DEBUG] PublicViewRealtime: Upcoming matches: ${upcomingMatches.length}`);

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
    console.log(`[DEBUG] PublicViewRealtime: Grouped matches by division:`, 
                Object.entries(grouped).map(([div, matches]) => `${div}: ${matches.length}`));
    
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
            <h1 className="text-2xl md:text-3xl font-bold">{currentTournament.name}</h1>
            <p className="text-gray-500">
              Live Tournament Updates
              {isSubscribed && (
                <Badge variant="outline" className="ml-2 bg-green-50">
                  <Radio className="h-3 w-3 text-green-500 mr-1" /> Live
                </Badge>
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
              {currentTournament.courts.map((court) => (
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

export default PublicViewRealtime;
