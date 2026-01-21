import React, { useState, useEffect, useMemo } from 'react';
import { Tournament, Team } from '@/types/tournament';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Division } from '@/types/tournament-enums';
import {
  FileUp,
  FileDown,
  Plus,
  Trash2,
  Search,
  Filter,
  Users,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  AlertTriangle,
  QrCode,
  Download,
  Upload,
  MoreVertical,
  Edit3,
  Eye,
  Copy
} from 'lucide-react';
import ImportTeamsDialog from '../ImportTeamsDialog';
import ExportTeamsDialog from '../ExportTeamsDialog';
import { useTournament } from '@/contexts/tournament/useTournament';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TeamRegistrationProps {
  tournament: Tournament;
  onUpdate: (tournament: Tournament) => Promise<void>;
}

type TeamStatus = 'registered' | 'checked-in' | 'no-show' | 'waitlist';
type ViewMode = 'cards' | 'list' | 'checkin';

const getStatusConfig = (status: TeamStatus) => {
  switch (status) {
    case 'registered':
      return { icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Registered' };
    case 'checked-in':
      return { icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100', label: 'Checked In' };
    case 'no-show':
      return { icon: UserX, color: 'text-red-600', bg: 'bg-red-100', label: 'No Show' };
    case 'waitlist':
      return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Waitlist' };
    default:
      return { icon: Users, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Unknown' };
  }
};

export const TeamRegistration: React.FC<TeamRegistrationProps> = ({ tournament, onUpdate }) => {
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TeamStatus | 'all'>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());

  const { importTeams: contextImportTeams } = useTournament();
  const { toast } = useToast();

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Enhanced teams with status
  const enhancedTeams = useMemo(() => {
    return tournament.teams.map(team => ({
      ...team,
      status: (team as any).status || 'registered' as TeamStatus,
      checkedInAt: (team as any).checkedInAt,
      registrationTime: team.createdAt || new Date(),
    }));
  }, [tournament.teams]);

  // Filter teams based on search and filters
  const filteredTeams = useMemo(() => {
    return enhancedTeams.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.players.some(player => player.name?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || team.status === statusFilter;
      const matchesDivision = divisionFilter === 'all' || team.division === divisionFilter;
      return matchesSearch && matchesStatus && matchesDivision;
    });
  }, [enhancedTeams, searchQuery, statusFilter, divisionFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = enhancedTeams.length;
    const checkedIn = enhancedTeams.filter(t => t.status === 'checked-in').length;
    const registered = enhancedTeams.filter(t => t.status === 'registered').length;
    const waitlist = enhancedTeams.filter(t => t.status === 'waitlist').length;
    const noShow = enhancedTeams.filter(t => t.status === 'no-show').length;

    return { total, checkedIn, registered, waitlist, noShow };
  }, [enhancedTeams]);

  // Available divisions
  const divisions = useMemo(() => {
    return Object.values(Division).map(div => ({ value: div, label: div }));
  }, []);

  const handleAddTeam = async () => {
    if (!newTeamName.trim()) return;

    const newTeam: Team & { status: TeamStatus } = {
      id: `team-${Date.now()}`,
      name: newTeamName.trim(),
      players: [],
      division: selectedDivision as Division || Division.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'registered'
    };

    const updatedTournament = {
      ...tournament,
      teams: [...tournament.teams, newTeam],
      updatedAt: new Date().toISOString()
    };

    await onUpdate(updatedTournament);
    setNewTeamName('');
    setSelectedDivision('');
    setIsAddingTeam(false);

    toast({
      title: "Team Added",
      description: `${newTeam.name} has been registered successfully.`,
    });
  };

  const handleImportTeams = async (importedTeams: Team[]) => {
    if (contextImportTeams) {
      await contextImportTeams(importedTeams);
      return;
    }

    const enhancedImportedTeams = importedTeams.map(team => ({
      ...team,
      status: 'registered' as TeamStatus
    }));

    const updatedTournament = {
      ...tournament,
      teams: [...tournament.teams, ...enhancedImportedTeams],
      updatedAt: new Date().toISOString()
    };

    await onUpdate(updatedTournament);

    toast({
      title: "Teams Imported",
      description: `${importedTeams.length} teams have been imported successfully.`,
    });
  };

  const handleRemoveTeam = async (teamId: string) => {
    if (!window.confirm('Are you sure you want to remove this team?')) return;

    const updatedTournament = {
      ...tournament,
      teams: tournament.teams.filter(team => team.id !== teamId),
      updatedAt: new Date().toISOString()
    };

    await onUpdate(updatedTournament);

    toast({
      title: "Team Removed",
      description: "Team has been removed from the tournament.",
    });
  };

  const handleStatusChange = async (teamId: string, newStatus: TeamStatus) => {
    const updatedTeams = tournament.teams.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          status: newStatus,
          checkedInAt: newStatus === 'checked-in' ? new Date() : undefined,
          updatedAt: new Date()
        };
      }
      return team;
    });

    const updatedTournament = {
      ...tournament,
      teams: updatedTeams,
      updatedAt: new Date().toISOString()
    };

    await onUpdate(updatedTournament);

    const statusConfig = getStatusConfig(newStatus);
    toast({
      title: "Status Updated",
      description: `Team status changed to ${statusConfig.label}.`,
    });
  };

  const handleBulkStatusChange = async (newStatus: TeamStatus) => {
    if (selectedTeams.size === 0) return;

    const updatedTeams = tournament.teams.map(team => {
      if (selectedTeams.has(team.id)) {
        return {
          ...team,
          status: newStatus,
          checkedInAt: newStatus === 'checked-in' ? new Date() : undefined,
          updatedAt: new Date()
        };
      }
      return team;
    });

    const updatedTournament = {
      ...tournament,
      teams: updatedTeams,
      updatedAt: new Date().toISOString()
    };

    await onUpdate(updatedTournament);
    setSelectedTeams(new Set());

    toast({
      title: "Bulk Update Complete",
      description: `${selectedTeams.size} teams updated successfully.`,
    });
  };

  const handleSelectTeam = (teamId: string, isSelected: boolean) => {
    setSelectedTeams(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(teamId);
      } else {
        newSet.delete(teamId);
      }
      return newSet;
    });
  };

  const renderTeamCard = (team: typeof enhancedTeams[0]) => {
    const statusConfig = getStatusConfig(team.status);
    const StatusIcon = statusConfig.icon;
    const isSelected = selectedTeams.has(team.id);

    return (
      <Card key={team.id} className={cn(
        "transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary",
        viewMode === 'checkin' && "cursor-pointer"
      )}
      onClick={() => viewMode === 'checkin' && handleSelectTeam(team.id, !isSelected)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {viewMode === 'checkin' && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleSelectTeam(team.id, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
              )}
              <Avatar className="h-10 w-10">
                <AvatarFallback className={cn(statusConfig.bg, statusConfig.color)}>
                  {team.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{team.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {team.players.length} player{team.players.length !== 1 ? 's' : ''}
                  </Badge>
                  {team.division && (
                    <Badge variant="secondary" className="text-xs">
                      {team.division}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={cn("text-xs", statusConfig.color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleStatusChange(team.id, 'checked-in')}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Check In
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(team.id, 'registered')}>
                    <Users className="h-4 w-4 mr-2" />
                    Mark Registered
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(team.id, 'no-show')}>
                    <UserX className="h-4 w-4 mr-2" />
                    Mark No Show
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Team
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleRemoveTeam(team.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Team
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        {team.players.length > 0 && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Players:</p>
              <div className="space-y-1">
                {team.players.slice(0, 3).map((player, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {player.name?.substring(0, 2).toUpperCase() || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{player.name || `Player ${idx + 1}`}</span>
                  </div>
                ))}
                {team.players.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{team.players.length - 3} more players
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className={cn("space-y-6", isMobile && "space-y-4")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Users className="h-6 w-6 text-primary" />
            <span>Team Registration</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage team registrations and check-in process
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <FileUp className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportDialogOpen(true)}
            disabled={tournament.teams.length === 0}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-5"
      )}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Checked In</p>
                <p className="text-2xl font-bold">{stats.checkedIn}</p>
              </div>
            </div>
            <Progress value={(stats.checkedIn / stats.total) * 100} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Registered</p>
                <p className="text-2xl font-bold">{stats.registered}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium">Waitlist</p>
                <p className="text-2xl font-bold">{stats.waitlist}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserX className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">No Show</p>
                <p className="text-2xl font-bold">{stats.noShow}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className={cn(
            "flex flex-wrap items-center gap-4",
            isMobile && "flex-col space-y-3"
          )}>
            {/* Search */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teams or players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <Select value={statusFilter} onValueChange={(value: TeamStatus | 'all') => setStatusFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="checked-in">Checked In</SelectItem>
                  <SelectItem value="waitlist">Waitlist</SelectItem>
                  <SelectItem value="no-show">No Show</SelectItem>
                </SelectContent>
              </Select>

              <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  {divisions.map(div => (
                    <SelectItem key={div.value} value={div.value}>
                      {div.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View Mode */}
            <Tabs value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="cards">Cards</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
                <TabsTrigger value="checkin">Check-in</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Bulk Actions */}
          {selectedTeams.size > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedTeams.size} team{selectedTeams.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusChange('checked-in')}
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Check In All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusChange('no-show')}
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Mark No Show
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedTeams(new Set())}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teams Display */}
      <div>
        {filteredTeams.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {tournament.teams.length === 0 ? "No teams registered yet" : "No teams match your filters"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {tournament.teams.length === 0
                    ? "Start by adding teams manually or importing from a file."
                    : "Try adjusting your search query or filters."
                  }
                </p>
                {tournament.teams.length === 0 && (
                  <Button onClick={() => setIsAddingTeam(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Team
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={cn(
            "grid gap-4",
            viewMode === 'list' ? "grid-cols-1" :
            isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          )}>
            {filteredTeams.map(renderTeamCard)}
          </div>
        )}
      </div>

      {/* Add Team Form */}
      {isAddingTeam && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add New Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  placeholder="Enter team name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTeamName.trim()) {
                      handleAddTeam();
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="division">Division</Label>
                <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map(div => (
                      <SelectItem key={div.value} value={div.value}>
                        {div.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddTeam} disabled={!newTeamName.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Team
              </Button>
              <Button variant="outline" onClick={() => setIsAddingTeam(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Add Button */}
      {!isAddingTeam && (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6">
            <Button
              onClick={() => setIsAddingTeam(true)}
              variant="ghost"
              className="w-full h-16 text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-6 w-6 mr-2" />
              Add Team Manually
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <ImportTeamsDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportTeams={handleImportTeams}
        tournamentId={tournament.id}
      />

      <ExportTeamsDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        teams={tournament.teams}
        tournamentId={tournament.id}
        divisions={{}}
      />

      {/* Mobile Tips */}
      {isMobile && tournament.teams.length > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Check-in Tips:</p>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>Use "Check-in" mode for quick team check-ins</li>
                <li>Search by team or player name</li>
                <li>Filter by status and division</li>
                <li>Select multiple teams for bulk actions</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};