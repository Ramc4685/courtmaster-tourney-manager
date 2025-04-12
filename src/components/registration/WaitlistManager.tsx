import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayerRegistrationWithStatus, TeamRegistrationWithStatus } from '@/types/registration';
import { formatDate } from '@/utils/date';

interface WaitlistManagerProps {
  registrations: (PlayerRegistrationWithStatus | TeamRegistrationWithStatus)[];
  onPromote: (id: string) => Promise<void>;
  onUpdatePosition: (id: string, newPosition: number) => Promise<void>;
  onNotify: (id: string) => Promise<void>;
}

function isTeamRegistration(registration: PlayerRegistrationWithStatus | TeamRegistrationWithStatus): registration is TeamRegistrationWithStatus {
  return 'teamName' in registration;
}

export const WaitlistManager: React.FC<WaitlistManagerProps> = ({
  registrations,
  onPromote,
  onUpdatePosition,
  onNotify,
}) => {
  const sortedRegistrations = [...registrations].sort((a, b) => {
    const posA = a.metadata.waitlistPosition || Infinity;
    const posB = b.metadata.waitlistPosition || Infinity;
    return posA - posB;
  });

  const handlePromote = async (id: string) => {
    try {
      await onPromote(id);
    } catch (error) {
      console.error('Failed to promote registration:', error);
    }
  };

  const handleMoveUp = async (registration: PlayerRegistrationWithStatus | TeamRegistrationWithStatus) => {
    const currentPosition = registration.metadata.waitlistPosition;
    if (currentPosition && currentPosition > 1) {
      const newPosition = currentPosition - 1;
      await onUpdatePosition(registration.id, newPosition);
    }
  };

  const handleMoveDown = async (registration: PlayerRegistrationWithStatus | TeamRegistrationWithStatus) => {
    const currentPosition = registration.metadata.waitlistPosition;
    if (currentPosition && currentPosition < sortedRegistrations.length) {
      const newPosition = currentPosition + 1;
      await onUpdatePosition(registration.id, newPosition);
    }
  };

  const handleNotify = async (id: string) => {
    try {
      await onNotify(id);
    } catch (error) {
      console.error('Failed to notify registration:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Waitlist Management</h3>
        <p className="text-sm text-muted-foreground">
          {sortedRegistrations.length} registration(s) on waitlist
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Position</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Registration Date</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Last Notified</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRegistrations.map((registration) => (
            <TableRow key={registration.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span>#{registration.metadata.waitlistPosition}</span>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveUp(registration)}
                      disabled={registration.metadata.waitlistPosition === 1}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveDown(registration)}
                      disabled={registration.metadata.waitlistPosition === sortedRegistrations.length}
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {isTeamRegistration(registration)
                  ? registration.teamName
                  : `${registration.firstName} ${registration.lastName}`}
              </TableCell>
              <TableCell>{formatDate(registration.createdAt)}</TableCell>
              <TableCell>{registration.metadata.waitlistReason || 'Division full'}</TableCell>
              <TableCell>
                {registration.metadata.waitlistNotified ? (
                  formatDate(registration.metadata.waitlistNotified as unknown as string)
                ) : (
                  <Badge variant="outline">Never</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handlePromote(registration.id)}
                  >
                    Promote
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNotify(registration.id)}
                    disabled={!!registration.metadata.waitlistNotified}
                  >
                    Notify
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}; 