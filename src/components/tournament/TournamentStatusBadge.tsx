
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TournamentStatus } from '@/types/tournament-enums';

interface TournamentStatusBadgeProps {
  status: TournamentStatus | string;
}

export const TournamentStatusBadge: React.FC<TournamentStatusBadgeProps> = ({ status }) => {
  let badgeVariant: 
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning' = 'default';
  
  switch (status) {
    case TournamentStatus.DRAFT:
      badgeVariant = 'secondary';
      break;
    case TournamentStatus.PUBLISHED:
    case TournamentStatus.REGISTRATION:
      badgeVariant = 'warning';
      break;
    case TournamentStatus.IN_PROGRESS:
      badgeVariant = 'default';
      break;
    case TournamentStatus.COMPLETED:
      badgeVariant = 'success';
      break;
    case TournamentStatus.CANCELLED:
      badgeVariant = 'destructive';
      break;
    default:
      badgeVariant = 'outline';
  }
  
  return (
    <Badge variant={badgeVariant as any}>
      {typeof status === 'string' ? status.replace('_', ' ') : String(status).replace('_', ' ')}
    </Badge>
  );
};

export default TournamentStatusBadge;
