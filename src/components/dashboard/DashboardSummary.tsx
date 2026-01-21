import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tournament } from '@/types/tournament';

type MetricCardProps = {
  title: string;
  value?: number | string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  placeholder?: string;
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  loading,
  error,
  onRetry,
  placeholder = '—',
}) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-10 w-20" />
      ) : error ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          {onRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="text-3xl font-bold">{value ?? placeholder}</div>
      )}
    </CardContent>
  </Card>
);

interface DashboardSummaryProps {
  tournaments?: Tournament[];
  tournamentsLoading?: boolean;
  tournamentsError?: string | null;
  onRetryTournaments?: () => void;
  upcomingMatches?: number;
  upcomingMatchesLoading?: boolean;
  upcomingMatchesError?: string | null;
  onRetryUpcomingMatches?: () => void;
  registeredPlayers?: number;
  registeredPlayersLoading?: boolean;
  registeredPlayersError?: string | null;
  onRetryRegisteredPlayers?: () => void;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  tournaments = [],
  tournamentsLoading = false,
  tournamentsError = null,
  onRetryTournaments,
  upcomingMatches = 0,
  upcomingMatchesLoading = false,
  upcomingMatchesError = null,
  onRetryUpcomingMatches,
  registeredPlayers = 0,
  registeredPlayersLoading = false,
  registeredPlayersError = null,
  onRetryRegisteredPlayers,
}) => {
  const ongoingTournamentsCount = tournaments.filter(tournament => tournament.status === 'IN_PROGRESS').length;

  const renderRecentTournaments = () => {
    if (tournamentsLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`recent-tournament-skeleton-${index}`} className="space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      );
    }

    if (tournamentsError) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-destructive">{tournamentsError}</p>
          {onRetryTournaments ? (
            <Button variant="outline" size="sm" onClick={onRetryTournaments}>
              Retry
            </Button>
          ) : null}
        </div>
      );
    }

    if (!tournaments.length) {
      return <p className="text-muted-foreground">You haven't organized any tournaments yet</p>;
    }

    // Sort tournaments by most recent start date
    const sortedTournaments = [...tournaments].sort((a, b) =>
      new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime()
    );

    return (
      <div className="space-y-4">
        {sortedTournaments.slice(0, 5).map(tournament => (
          <div key={tournament.id} className="flex items-center justify-between border-b pb-2">
            <div>
              <h3 className="font-medium">{tournament.name}</h3>
              <p className="text-sm text-muted-foreground">
                {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'No date'}
              </p>
            </div>
            <div>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  tournament.status === 'IN_PROGRESS'
                    ? 'bg-green-100 text-green-800'
                    : tournament.status === 'COMPLETED'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {tournament.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400">Welcome back! Your tournament insights at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard
          title="Ongoing Tournaments"
          value={ongoingTournamentsCount}
          loading={tournamentsLoading}
          error={tournamentsError}
          onRetry={onRetryTournaments}
        />
        <MetricCard
          title="Upcoming Matches"
          value={upcomingMatches}
          loading={upcomingMatchesLoading}
          error={upcomingMatchesError}
          onRetry={onRetryUpcomingMatches}
        />
        <MetricCard
          title="Players Registered"
          value={registeredPlayers}
          loading={registeredPlayersLoading}
          error={registeredPlayersError}
          onRetry={onRetryRegisteredPlayers}
        />
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Recent Tournaments</CardTitle>
          </CardHeader>
          <CardContent>{renderRecentTournaments()}</CardContent>
        </Card>
      </div>
    </div>
  );
};
