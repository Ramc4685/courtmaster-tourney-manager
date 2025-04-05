
import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useParams } from "react-router-dom";
import { RefreshCw, Award, Clock, Calendar, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/layout/Layout";
import MatchCard from "@/components/shared/MatchCard";
import CourtCard from "@/components/shared/CourtCard";
import { Match, Division } from "@/types/tournament";
import { format } from "date-fns";
import { useRealtimeTournamentUpdates } from "@/hooks/useRealtimeTournamentUpdates";
import { throttle } from "@/utils/performanceUtils";

// Lazy loaded components
const LazyTournamentHeader = React.lazy(() => import("@/components/tournament/TournamentHeader"));

// Error boundary for lazy loaded components
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const errorHandler = () => setHasError(true);
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);
  
  if (hasError) {
    return <div className="p-4 text-red-500">Something went wrong. Please refresh the page.</div>;
  }
  
  return <>{children}</>;
};

// Optimized match card with memo
const MemoizedMatchCard = React.memo(MatchCard);

// Component to display matches grouped by division
const MatchesByDivision = React.memo(({ matches }: { matches: Match[] }) => {
  // Memoize the grouping operation to avoid unnecessary recalculations
  const groupedMatches = useMemo(() => {
    return matches.reduce((groups, match) => {
      const division = match.division;
      if (!groups[division]) {
        groups[division] = [];
      }
      groups[division].push(match);
      return groups;
    }, {} as Record<Division, Match[]>);
  }, [matches]);
  
  // Memoize the entries to avoid recreation on each render
  const divisionEntries = useMemo(() => {
    return Object.entries(groupedMatches);
  }, [groupedMatches]);

  const getDivisionLabel = useCallback((division: string) => {
    switch (division) {
      case "GROUP_DIV3": return "Division 3 - Group Stage";
      case "DIVISION_1": return "Division 1";
      case "DIVISION_2": return "Division 2";
      case "DIVISION_3": return "Division 3";
      case "QUALIFIER_DIV1": return "Division 1 - Qualifiers";
      case "QUALIFIER_DIV2": return "Division 2 - Qualifiers";
      case "INITIAL": return "Initial Round";
      default: return division;
    }
  }, []);

  const getStatusLabel = useCallback((status: string) => {
    switch (status) {
      case "SCHEDULED": return "Not Started";
      case "IN_PROGRESS": return "In Progress";
      case "COMPLETED": return "Completed";
      case "CANCELLED": return "Cancelled";
      default: return status;
    }
  }, []);

  if (divisionEntries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No matches found</p>
      </div>
    );
  }

  return (
    <>
      {divisionEntries.map(([division, divMatches]) => (
        <div key={division} className="mb-6">
          <h3 className="font-semibold text-lg mb-3 flex items-center">
            <Award className="h-5 w-5 text-court-blue mr-2" />
            {getDivisionLabel(division)}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {divMatches.map((match) => (
              <div key={match.id} className="border rounded-lg p-4">
                <MemoizedMatchCard match={match} />
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
      ))}
    </>
  );
});

// Optimized court list with virtualization
const CourtsList = React.memo(({ courts }: { courts: any[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courts.map((court) => (
        <CourtCard key={court.id} court={court} detailed />
      ))}
    </div>
  );
});

// Loading state component
const LoadingState = () => (
  <div className="space-y-4">
    <Skeleton className="h-12 w-3/4" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  </div>
);

const PublicViewRealtime = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  
  // Use our updated hook with proper return types
  const { currentTournament, inProgressMatches, isSubscribed } = useRealtimeTournamentUpdates(tournamentId);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("live");

  // Memoize filtered matches to avoid unnecessary filtering on each render
  const completedMatches = useMemo(() => 
    currentTournament?.matches.filter((match) => match.status === "COMPLETED") || [],
    [currentTournament?.matches]
  );

  const upcomingMatches = useMemo(() => 
    currentTournament?.matches
      .filter((match) => match.status === "SCHEDULED")
      .sort((a, b) => {
        if (a.scheduledTime && b.scheduledTime) {
          return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
        } else if (a.scheduledTime) {
          return -1;
        } else if (b.scheduledTime) {
          return 1;
        }
        return 0;
      }) || [],
    [currentTournament?.matches]
  );

  // Throttle the refresh function to prevent rapid successive calls
  const handleRefresh = useCallback(throttle(() => {
    setRefreshing(true);
    setLastRefreshed(new Date());
    setTimeout(() => setRefreshing(false), 500);
  }, 1000), []);

  // Update last refreshed time when we get new data
  useEffect(() => {
    if (currentTournament) {
      setLastRefreshed(new Date());
    }
  }, [currentTournament, inProgressMatches]);

  // Handle tab change with performance optimization
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    // Prefetch data for the selected tab if needed
  }, []);

  if (!currentTournament) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <p>No tournament selected. Please select a tournament first.</p>
        </div>
      </Layout>
    );
  }

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

        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="live">Live Matches</TabsTrigger>
            <TabsTrigger value="courts">Courts</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="live">
            <ErrorBoundary>
              <Suspense fallback={<LoadingState />}>
                {inProgressMatches.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No matches currently in progress</p>
                  </div>
                ) : (
                  <MatchesByDivision matches={inProgressMatches} />
                )}
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="courts">
            <ErrorBoundary>
              <Suspense fallback={<LoadingState />}>
                <CourtsList courts={currentTournament.courts} />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="upcoming">
            <ErrorBoundary>
              <Suspense fallback={<LoadingState />}>
                {upcomingMatches.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No upcoming matches scheduled</p>
                  </div>
                ) : (
                  <MatchesByDivision matches={upcomingMatches} />
                )}
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="completed">
            <ErrorBoundary>
              <Suspense fallback={<LoadingState />}>
                {completedMatches.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No completed matches yet</p>
                  </div>
                ) : (
                  <MatchesByDivision matches={completedMatches} />
                )}
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default React.memo(PublicViewRealtime);
