
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, ClockIcon, InfoIcon, Users } from 'lucide-react';
import { Match } from '@/types/tournament';

interface MatchAuditInfoProps {
  match: Match;
}

const MatchAuditInfo: React.FC<MatchAuditInfoProps> = ({ match }) => {
  // Format date for display
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Unknown';
    try {
      return new Date(date).toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <InfoIcon className="h-5 w-5 mr-2 text-gray-500" />
            Match Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div>
            <div className="text-sm font-medium mb-1">Match Number:</div>
            <div className="text-gray-700">{match.matchNumber || 'Not assigned'}</div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Teams:</div>
            <div className="text-gray-700">{match.team1?.name} vs {match.team2?.name}</div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Status:</div>
            <div className="text-gray-700">{match.status}</div>
          </div>
          
          {match.courtNumber && (
            <div>
              <div className="text-sm font-medium mb-1">Court:</div>
              <div className="text-gray-700">Court {match.courtNumber}</div>
            </div>
          )}
          
          {match.category && (
            <div>
              <div className="text-sm font-medium mb-1">Category:</div>
              <div className="text-gray-700">{match.category.name}</div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-gray-500" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div>
            <div className="text-sm font-medium mb-1">Created:</div>
            <div className="text-gray-700">{formatDate(match.createdAt)}</div>
          </div>
          
          {match.scheduledTime && (
            <div>
              <div className="text-sm font-medium mb-1">Scheduled:</div>
              <div className="text-gray-700">{formatDate(match.scheduledTime)}</div>
            </div>
          )}
          
          {match.updatedAt && match.updatedAt !== match.createdAt && (
            <div>
              <div className="text-sm font-medium mb-1">Last Updated:</div>
              <div className="text-gray-700">{formatDate(match.updatedAt)}</div>
            </div>
          )}
          
          {match.endTime && (
            <div>
              <div className="text-sm font-medium mb-1">Completed:</div>
              <div className="text-gray-700">{formatDate(match.endTime)}</div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {match.scorerName && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-gray-500" />
              Scoring
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div>
              <div className="text-sm font-medium mb-1">Score Entered By:</div>
              <div className="text-gray-700">{match.scorerName}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MatchAuditInfo;
