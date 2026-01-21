
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Download,
  RefreshCw,
  TrendingUp,
  Users,
  Trophy,
  Clock,
  BarChart3,
  Calendar,
  Target
} from 'lucide-react';
import LineChart from './LineChart';
import BarChart from './BarChart';
import TournamentAnalyticsService, { ReportFormat } from '@/services/analytics/TournamentAnalyticsService';

interface TournamentAnalyticsProps {
  tournamentId: string;
  className?: string;
}

const TournamentAnalytics: React.FC<TournamentAnalyticsProps> = ({
  tournamentId,
  className = ""
}) => {
  const [exportFormat, setExportFormat] = useState<ReportFormat>(ReportFormat.PDF);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch tournament analytics
  const {
    data: analytics,
    isLoading,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['tournament-analytics', tournamentId],
    queryFn: () => TournamentAnalyticsService.getTournamentAnalytics(tournamentId),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Handle export functionality
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const reportData = await TournamentAnalyticsService.exportAnalyticsReport(
        tournamentId,
        exportFormat
      );

      // Create and download the file
      const blob = new Blob([reportData], {
        type: exportFormat === ReportFormat.JSON ? 'application/json' : 'text/plain'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tournament-analytics-${tournamentId}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting analytics:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Prepare chart data from analytics
  const getRegistrationChartData = () => {
    if (!analytics?.registrations.by_date) return [0];

    const dates = Object.keys(analytics.registrations.by_date).sort();
    let cumulative = 0;
    return dates.map(date => {
      cumulative += analytics.registrations.by_date[date];
      return cumulative;
    });
  };

  const getMatchCompletionChartData = () => {
    if (!analytics?.matches) return [0];

    const { total, completed, in_progress, scheduled } = analytics.matches;
    return [completed, in_progress, scheduled, total - completed - in_progress - scheduled];
  };

  const getCourtUtilizationData = () => {
    if (!analytics?.courts.by_court) return [0];

    return Object.values(analytics.courts.by_court);
  };

  const getScheduleEfficiencyData = () => {
    if (!analytics?.schedule) return [50];

    const { on_time_percentage, schedule_efficiency } = analytics.schedule;
    return [on_time_percentage, schedule_efficiency];
  };

  if (isLoading) {
    return (
      <div className={`space-y-8 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-4 text-lg">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-8 ${className}`}>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Error loading analytics</h3>
              <p className="text-muted-foreground mb-4">
                Unable to load tournament analytics data.
              </p>
              <Button onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tournament Analytics</h2>
          <p className="text-muted-foreground">
            {analytics.overview.name} • Last updated: {new Date(analytics.last_updated).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ReportFormat)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ReportFormat.PDF}>PDF</SelectItem>
              <SelectItem value={ReportFormat.CSV}>CSV</SelectItem>
              <SelectItem value={ReportFormat.JSON}>JSON</SelectItem>
              <SelectItem value={ReportFormat.EXCEL}>Excel</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>

          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.total_players}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.players.active_players} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.matches.total}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.matches.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((analytics.matches.completed / analytics.matches.total) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.completion_percentage}% tournament progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Match Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(analytics.matches.average_duration_minutes)} min
            </div>
            <p className="text-xs text-muted-foreground">
              Court utilization: {Math.round(analytics.courts.utilization_percentage)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Schedule & Efficiency Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Schedule Adherence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">On Time</span>
                <Badge variant="outline">
                  {Math.round(analytics.schedule.on_time_percentage)}%
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Started Late</span>
                <span className="text-sm font-medium">{analytics.schedule.matches_started_late}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg Delay</span>
                <span className="text-sm font-medium">
                  {Math.round(analytics.schedule.average_delay_minutes)} min
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Court Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Courts</span>
                <span className="text-sm font-medium">{analytics.courts.court_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Utilization</span>
                <Badge
                  variant={analytics.courts.utilization_percentage > 80 ? "default" : "secondary"}
                >
                  {Math.round(analytics.courts.utilization_percentage)}%
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Hours Used</span>
                <span className="text-sm font-medium">
                  {Math.round(analytics.courts.used_court_hours)} / {analytics.courts.total_court_hours}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Registration Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total</span>
                <span className="text-sm font-medium">{analytics.registrations.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Approval Rate</span>
                <Badge variant="outline">
                  {Math.round(analytics.registrations.conversion_rate * 100)}%
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg per Player</span>
                <span className="text-sm font-medium">
                  {analytics.players.average_matches_per_player.toFixed(1)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Registrations Over Time</CardTitle>
            <CardDescription>Cumulative registration count</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart
              data={getRegistrationChartData()}
              className="w-full h-64"
              lines={[{ label: "Registrations", color: "#0ea5e9" }]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Match Status Distribution</CardTitle>
            <CardDescription>Breakdown of match completion status</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={getMatchCompletionChartData()}
              className="w-full h-64"
              bars={[{ label: "Match Status", color: "#10b981" }]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Court Utilization by Court</CardTitle>
            <CardDescription>Hours used per court</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={getCourtUtilizationData()}
              className="w-full h-64"
              bars={[{ label: "Court Hours", color: "#8b5cf6" }]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule Efficiency</CardTitle>
            <CardDescription>On-time percentage and overall efficiency</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={getScheduleEfficiencyData()}
              className="w-full h-64"
              bars={[{ label: "Efficiency %", color: "#f59e0b" }]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Top Players */}
      {analytics.players.most_active_players.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Active Players</CardTitle>
            <CardDescription>Top players by matches played</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.players.most_active_players.slice(0, 5).map((player, index) => (
                <div key={player.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {player.matches_played} matches • {Math.round(player.win_rate * 100)}% win rate
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {player.matches_won}W / {player.matches_played - player.matches_won}L
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TournamentAnalytics;
