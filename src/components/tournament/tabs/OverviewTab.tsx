import React from 'react';
import { Tournament } from '@/types/tournament';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, LayoutGrid, PlaySquare, Shuffle, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import TournamentSettings from '@/components/tournament/TournamentSettings';

export interface OverviewTabProps {
  tournament: Tournament;
  onUpdateTournament: (tournament: Tournament) => void;
  onGenerateMultiStageTournament: () => void;
  onAdvanceToNextStage: () => void;
  onScheduleDialogOpen: () => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ 
  tournament,
  onUpdateTournament,
  onGenerateMultiStageTournament,
  onAdvanceToNextStage,
  onScheduleDialogOpen
}) => {
  const formatDate = (date: Date) => {
    if (!date) return 'Not set';
    return format(new Date(date), 'MMM d, yyyy');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-200 text-gray-800';
      case 'PUBLISHED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'SINGLE_ELIMINATION': return 'Single Elimination';
      case 'DOUBLE_ELIMINATION': return 'Double Elimination';
      case 'ROUND_ROBIN': return 'Round Robin';
      case 'SWISS': return 'Swiss System';
      case 'GROUP_KNOCKOUT': return 'Group + Knockout';
      case 'MULTI_STAGE': return 'Multi-Stage';
      default: return format;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              <div className="flex items-center">
                <Trophy className="h-4 w-4 mr-2 text-muted-foreground" />
                Tournament Format
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getFormatLabel(tournament.format)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {tournament.currentStage && `Current Stage: ${tournament.currentStage.replace(/_/g, ' ')}`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                Teams
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tournament.teams.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {tournament.maxTeams ? `Maximum: ${tournament.maxTeams}` : 'No team limit set'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                Tournament Dates
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-md font-bold">{formatDate(tournament.startDate)}</div>
            {tournament.endDate && (
              <div className="text-sm">to {formatDate(tournament.endDate)}</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tournament Status</CardTitle>
            <CardDescription>Current state and progress of the tournament</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <Badge className={getStatusColor(tournament.status)}>
                {tournament.status}
              </Badge>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Total Matches:</span>
                <span className="font-medium">{tournament.matches.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Completed Matches:</span>
                <span className="font-medium">
                  {tournament.matches.filter(m => m.status === 'COMPLETED').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>In Progress:</span>
                <span className="font-medium">
                  {tournament.matches.filter(m => m.status === 'IN_PROGRESS').length}
                </span>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex flex-col space-y-2">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={onScheduleDialogOpen}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Schedule Matches
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={onGenerateMultiStageTournament}
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Generate Tournament
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={onAdvanceToNextStage}
              >
                <PlaySquare className="h-4 w-4 mr-2" />
                Advance to Next Stage
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <TournamentSettings 
          tournament={tournament} 
          onUpdateTournament={onUpdateTournament} 
        />
      </div>
    </div>
  );
};

export default OverviewTab;
