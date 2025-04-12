
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TournamentStatus } from '@/types/tournament-enums';

interface TournamentStatusBadgeProps {
  status: TournamentStatus | string;
}

export const TournamentStatusBadge: React.FC<TournamentStatusBadgeProps> = ({ status }) => {
  // Define the badge variants that are supported by the Badge component
  let badgeVariant: "default" | "destructive" | "outline" | "secondary" | "success" = "default";
  
  switch (status) {
    case TournamentStatus.DRAFT:
      badgeVariant = "secondary";
      break;
    case TournamentStatus.PUBLISHED:
    case TournamentStatus.REGISTRATION:
      badgeVariant = "outline";
      break;
    case TournamentStatus.IN_PROGRESS:
      badgeVariant = "default";
      break;
    case TournamentStatus.COMPLETED:
      badgeVariant = "success";
      break;
    case TournamentStatus.CANCELLED:
      badgeVariant = "destructive";
      break;
    default:
      badgeVariant = "outline";
  }
  
  return (
    <Badge variant={badgeVariant}>
      {typeof status === 'string' ? status.replace('_', ' ') : String(status).replace('_', ' ')}
    </Badge>
  );
};

export default TournamentStatusBadge;
