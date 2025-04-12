
import React from 'react';
import { Court, CourtStatus } from '@/types/entities';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface CourtTableProps {
  courts: Court[];
  onSelectCourt?: (court: Court) => void;
}

const CourtTable: React.FC<CourtTableProps> = ({ courts, onSelectCourt }) => {
  const getStatusColor = (status: CourtStatus) => {
    switch (status) {
      case CourtStatus.AVAILABLE:
        return 'bg-green-100 text-green-800';
      case CourtStatus.IN_USE:
        return 'bg-blue-100 text-blue-800';
      case CourtStatus.MAINTENANCE:
        return 'bg-yellow-100 text-yellow-800';
      case CourtStatus.RESERVED:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Current Match</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4">
                No courts available
              </TableCell>
            </TableRow>
          ) : (
            courts.map((court) => (
              <TableRow 
                key={court.id}
                className={onSelectCourt ? 'cursor-pointer hover:bg-gray-50' : ''}
                onClick={() => onSelectCourt && onSelectCourt(court)}
              >
                <TableCell>{court.court_number || court.number}</TableCell>
                <TableCell>{court.name}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(court.status as CourtStatus)}>
                    {court.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {court.currentMatch ? (
                    <span className="text-sm">
                      {court.currentMatch.team1?.name || 'Team 1'} vs {court.currentMatch.team2?.name || 'Team 2'}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">No match</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CourtTable;
