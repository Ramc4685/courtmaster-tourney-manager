import React, { useState, useEffect, useMemo } from 'react';
import { Tournament, Team } from '@/types/tournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Download,
  Upload,
  QrCode,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Timer
} from 'lucide-react';
import { TeamRegistration } from './TeamRegistration';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

interface RegistrationDashboardProps {
  tournament: Tournament;
  onUpdate: (tournament: Tournament) => Promise<void>;
}

type TeamStatus = 'registered' | 'checked-in' | 'no-show' | 'waitlist';

interface RegistrationStats {
  total: number;
  checkedIn: number;
  registered: number;
  waitlist: number;
  noShow: number;
  checkInRate: number;
  registrationTrend: number[];
  peakRegistrationHour: number;
  averagePlayersPerTeam: number;
  divisionDistribution: Record<string, number>;
}

export const RegistrationDashboard: React.FC<RegistrationDashboardProps> = ({
  tournament,
  onUpdate
}) => {
  const { isMobile } = useMobileOptimization();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'all'>('today');
  const { toast } = useToast();

  // Enhanced teams with status
  const enhancedTeams = useMemo(() => {
    return tournament.teams.map(team => ({
      ...team,
      status: (team as any).status || 'registered' as TeamStatus,
      checkedInAt: (team as any).checkedInAt,
      registrationTime: team.createdAt || new Date(),
    }));
  }, [tournament.teams]);

  // Calculate comprehensive statistics
  const stats: RegistrationStats = useMemo(() => {
    const total = enhancedTeams.length;
    const checkedIn = enhancedTeams.filter(t => t.status === 'checked-in').length;
    const registered = enhancedTeams.filter(t => t.status === 'registered').length;
    const waitlist = enhancedTeams.filter(t => t.status === 'waitlist').length;
    const noShow = enhancedTeams.filter(t => t.status === 'no-show').length;
    const checkInRate = total > 0 ? (checkedIn / total) * 100 : 0;

    // Registration trend (last 7 days)
    const registrationTrend = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return enhancedTeams.filter(team => {
        const regDate = new Date(team.registrationTime);
        return regDate.toDateString() === date.toDateString();
      }).length;
    }).reverse();

    // Peak registration hour
    const hourCounts = Array.from({ length: 24 }, () => 0);
    enhancedTeams.forEach(team => {
      const hour = new Date(team.registrationTime).getHours();
      hourCounts[hour]++;
    });
    const peakRegistrationHour = hourCounts.indexOf(Math.max(...hourCounts));

    // Average players per team
    const totalPlayers = enhancedTeams.reduce((sum, team) => sum + team.players.length, 0);
    const averagePlayersPerTeam = total > 0 ? totalPlayers / total : 0;

    // Division distribution
    const divisionDistribution: Record<string, number> = {};
    enhancedTeams.forEach(team => {
      const division = team.division || 'Unknown';
      divisionDistribution[division] = (divisionDistribution[division] || 0) + 1;
    });

    return {
      total,
      checkedIn,
      registered,
      waitlist,
      noShow,
      checkInRate,
      registrationTrend,
      peakRegistrationHour,
      averagePlayersPerTeam,
      divisionDistribution
    };
  }, [enhancedTeams]);

  // Quick actions
  const handleQuickAction = async (action: string) => {
    switch (action) {
      case 'send-reminders':
        // Mock sending reminders
        toast({
          title: "Reminders Sent",
          description: `Check-in reminders sent to ${stats.registered} registered teams.`,
        });
        break;
      case 'export-checkin-list':
        // Mock export
        toast({
          title: "Export Complete",
          description: "Check-in list downloaded successfully.",
        });
        break;
      case 'generate-qr':
        // Mock QR generation
        toast({
          title: "QR Codes Generated",
          description: "Team QR codes ready for check-in.",
        });
        break;
      case 'backup-data':
        // Mock backup
        toast({
          title: "Data Backed Up",
          description: "Registration data safely backed up.",
        });
        break;
      default:
        break;
    }
  };

  // Format time for display
  const formatTime = (hour: number) => {
    return hour === 0 ? '12 AM' : hour <= 12 ? `${hour} AM` : `${hour - 12} PM`;
  };

  return (
    <div className={cn("space-y-6", isMobile && "space-y-4")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <Activity className="h-7 w-7 text-primary" />
            <span>Registration Dashboard</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage tournament registration in real-time
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('backup-data')}
          >
            <Download className="h-4 w-4 mr-2" />
            Backup
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('generate-qr')}
          >
            <QrCode className="h-4 w-4 mr-2" />
            QR Codes
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4 lg:grid-cols-6"
      )}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Teams</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Checked In</p>
                <p className="text-2xl font-bold">{stats.checkedIn}</p>
                <p className="text-xs text-green-600">
                  {stats.checkInRate.toFixed(1)}% rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.registered}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Timer className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Waitlist</p>
                <p className="text-2xl font-bold">{stats.waitlist}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">No Show</p>
                <p className="text-2xl font-bold">{stats.noShow}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Target className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Players</p>
                <p className="text-2xl font-bold">{stats.averagePlayersPerTeam.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Check-in Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {stats.checkedIn}/{stats.total} teams
                </span>
              </div>
              <Progress value={stats.checkInRate} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span className="font-medium">{stats.checkInRate.toFixed(1)}%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Registration Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-1">
                {stats.registrationTrend.map((count, index) => {
                  const maxCount = Math.max(...stats.registrationTrend, 0);
                  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div
                      key={index}
                      className="flex-1 bg-muted rounded-sm relative"
                      style={{ height: '40px' }}
                    >
                      <div
                        className="bg-primary rounded-sm absolute bottom-0 left-0 right-0"
                        style={{
                          height: `${Math.max(5, pct)}%`
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-muted-foreground text-center">
                Last 7 days registration activity
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "grid gap-3",
            isMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"
          )}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('send-reminders')}
              className="h-auto p-3 flex flex-col items-center space-y-1"
            >
              <Mail className="h-5 w-5" />
              <span className="text-xs">Send Reminders</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('export-checkin-list')}
              className="h-auto p-3 flex flex-col items-center space-y-1"
            >
              <Download className="h-5 w-5" />
              <span className="text-xs">Export List</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('generate-qr')}
              className="h-auto p-3 flex flex-col items-center space-y-1"
            >
              <QrCode className="h-5 w-5" />
              <span className="text-xs">QR Codes</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('backup-data')}
              className="h-auto p-3 flex flex-col items-center space-y-1"
            >
              <Upload className="h-5 w-5" />
              <span className="text-xs">Backup Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Insights and Alerts */}
      {stats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>Division Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.divisionDistribution).map(([division, count]) => {
                  const percentage = (count / stats.total) * 100;
                  return (
                    <div key={division} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{division}</span>
                        <span className="text-sm text-muted-foreground">
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-1" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Peak Registration Time</p>
                    <p className="text-muted-foreground">
                      Most registrations occur at {formatTime(stats.peakRegistrationHour)}
                    </p>
                  </div>
                </div>

                {stats.checkInRate < 50 && stats.total > 10 && (
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Low Check-in Rate</p>
                      <p className="text-muted-foreground">
                        Consider sending reminders to registered teams
                      </p>
                    </div>
                  </div>
                )}

                {stats.waitlist > 0 && (
                  <div className="flex items-start space-x-2">
                    <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Waitlist Teams</p>
                      <p className="text-muted-foreground">
                        {stats.waitlist} teams waiting for spots to open
                      </p>
                    </div>
                  </div>
                )}

                {stats.noShow > stats.total * 0.2 && stats.total > 5 && (
                  <div className="flex items-start space-x-2">
                    <UserX className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">High No-Show Rate</p>
                      <p className="text-muted-foreground">
                        Consider implementing confirmation system
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Dashboard</TabsTrigger>
          <TabsTrigger value="teams">Team Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Tournament Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tournament Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Date:</span>
                    <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Venue:</span>
                    <span>{tournament.location}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Capacity:</span>
                    <span>Unlimited</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Status:</span>
                    <Badge variant="secondary">Registration Open</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <TeamRegistration tournament={tournament} onUpdate={onUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  );
};