import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TournamentStatus } from '@/types/tournament-enums';

interface TournamentStatusBadgeProps {
  status: TournamentStatus;
}

export const TournamentStatusBadge: React.FC<TournamentStatusBadgeProps> = ({ status }) => {
  let variant: 'default' | 'secondary' | 'destructive' | 'outline';
  let label: string;

  switch (status) {
    case TournamentStatus.DRAFT:
      variant = 'outline';
      label = 'Draft';
      break;
    case TournamentStatus.PUBLISHED:
      variant = 'default';
      label = 'Published';
      break;
    case TournamentStatus.IN_PROGRESS:
      variant = 'secondary';
      label = 'In Progress';
      break;
    case TournamentStatus.COMPLETED:
      variant = 'default';
      label = 'Completed';
      break;
    case TournamentStatus.CANCELLED:
      variant = 'destructive';
      label = 'Cancelled';
      break;
    default:
      variant = 'outline';
      label = status;
  }

  return <Badge variant={variant}>{label}</Badge>;
};

export default TournamentStatusBadge;


