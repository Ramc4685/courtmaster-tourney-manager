import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  UserCheck,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Calendar,
  RefreshCw,
  Megaphone
} from 'lucide-react';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { CheckInModal } from '../../components/frontdesk/CheckInModal';
import { CourtAssignmentModal } from '../../components/frontdesk/CourtAssignmentModal';
import { AnnouncementManager } from '../../components/announcement/AnnouncementManager';
import { tournamentRoutes } from '@/utils/tournamentRoutes';

export const FrontDeskDashboardPage: React.FC = () => {
  const { id: tournamentId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, refresh, lastUpdated } = useDashboardStats(tournamentId);

  // Modal states
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [courtAssignmentModalOpen, setCourtAssignmentModalOpen] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);

  const totalPlayerRegistrations = data.stats?.totalPlayerRegistrations || 0;
  const checkedInPlayers = data.stats?.checkedInPlayers || 0;
  const playerCheckInPercent = totalPlayerRegistrations
    ? Math.round((checkedInPlayers / totalPlayerRegistrations) * 100)
    : 0;

  const totalTeamRegistrations = data.stats?.totalTeamRegistrations || 0;
  const checkedInTeams = data.stats?.checkedInTeams || 0;
  const teamCheckInPercent = totalTeamRegistrations
    ? Math.round((checkedInTeams / totalTeamRegistrations) * 100)
    : 0;

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatActivityDescription = (activity: any) => {
    switch (activity.type) {
      case 'check-in':
        return 'Player checked in';
      case 'match-start':
        return activity.description;
      case 'match-complete':
        return activity.description;
      case 'court-assignment':
        return 'Court assigned';
      case 'announcement':
        return activity.description;
      default:
        return activity.description;
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'check-in':
        setCheckInModalOpen(true);
        break;
      case 'schedule':
        if (tournamentId) {
          navigate(tournamentRoutes.schedule(tournamentId));
        }
        break;
      case 'announcement':
        setAnnouncementModalOpen(true);
        break;
      case 'court':
        setCourtAssignmentModalOpen(true);
        break;
    }
  };

  if (!tournamentId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Tournament ID is required</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Front Desk Dashboard</h1>
          <p className="text-gray-600">
            Tournament management overview
            {lastUpdated && (
              <span className="ml-2 text-sm">
                • Last updated: {formatTime(lastUpdated)}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Player Check-ins</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading && !data.stats ? (
              <div className="flex items-center justify-center h-16">
                <Spinner className="h-6 w-6" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {checkedInPlayers}/{totalPlayerRegistrations}
                </div>
                <p className="text-xs text-muted-foreground">
                  {playerCheckInPercent}% checked in
                </p>
                {checkedInPlayers > 0 && (
                  <Badge variant="secondary" className="mt-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Check-ins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading && !data.stats ? (
              <div className="flex items-center justify-center h-16">
                <Spinner className="h-6 w-6" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {checkedInTeams}/{totalTeamRegistrations}
                </div>
                <p className="text-xs text-muted-foreground">
                  {teamCheckInPercent}% checked in
                </p>
                {checkedInTeams > 0 && (
                  <Badge variant="secondary" className="mt-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Matches</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading && !data.stats ? (
              <div className="flex items-center justify-center h-16">
                <Spinner className="h-6 w-6" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{data.stats?.activeMatches || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {data.stats?.scheduledMatches || 0} upcoming
                </p>
                {(data.stats?.activeMatches || 0) > 0 && (
                  <Badge variant="default" className="mt-2">
                    <Clock className="h-3 w-3 mr-1" />
                    In Progress
                  </Badge>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Courts</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading && !data.stats ? (
              <div className="flex items-center justify-center h-16">
                <Spinner className="h-6 w-6" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{data.stats?.availableCourts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  of {data.stats?.totalCourts || 0} total courts
                </p>
                {(data.stats?.availableCourts || 0) > 0 ? (
                  <Badge variant="secondary" className="mt-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Available
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="mt-2">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    All Busy
                  </Badge>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common front desk tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => handleQuickAction('check-in')}
            >
              <Users className="h-6 w-6 mb-2" />
              <span>Check-in Player</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => handleQuickAction('schedule')}
            >
              <Calendar className="h-6 w-6 mb-2" />
              <span>View Schedule</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => handleQuickAction('announcement')}
            >
              <Megaphone className="h-6 w-6 mb-2" />
              <span>Send Announcement</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => handleQuickAction('court')}
            >
              <MapPin className="h-6 w-6 mb-2" />
              <span>Assign Court</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest tournament actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && data.recentActivity.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <Spinner className="h-6 w-6" />
            </div>
          ) : data.recentActivity.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No recent activity
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentActivity.map((activity, index) => (
                <div key={activity.id || index} className="flex items-center space-x-4">
                  <div className="text-sm text-muted-foreground w-20">
                    {formatTime(activity.timestamp)}
                  </div>
                  <div
                    className={`h-2 w-2 rounded-full ${
                      activity.type === 'match-start' || activity.type === 'match-complete'
                        ? 'bg-green-500'
                        : activity.type === 'announcement'
                        ? 'bg-orange-500'
                        : 'bg-blue-500'
                    }`}
                  ></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {formatActivityDescription(activity)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.type === 'check-in' && 'Player registration updated'}
                      {activity.type === 'court-assignment' && 'Court scheduling updated'}
                      {activity.type === 'announcement' && 'Tournament announcement'}
                      {(activity.type === 'match-start' || activity.type === 'match-complete') &&
                        `Court ${activity.details?.court || 'TBD'}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CheckInModal
        isOpen={checkInModalOpen}
        onClose={() => setCheckInModalOpen(false)}
        tournamentId={tournamentId}
      />

      <CourtAssignmentModal
        isOpen={courtAssignmentModalOpen}
        onClose={() => setCourtAssignmentModalOpen(false)}
        tournamentId={tournamentId}
      />

      <AnnouncementManager
        isOpen={announcementModalOpen}
        onClose={() => setAnnouncementModalOpen(false)}
        tournamentId={tournamentId}
      />
    </div>
  );
};
