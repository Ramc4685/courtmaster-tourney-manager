
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TournamentStatus } from '@/types/tournament';

interface TournamentStatusBadgeProps {
  status: TournamentStatus;
}

const TournamentStatusBadge: React.FC<TournamentStatusBadgeProps> = ({ status }) => {
  let variant: "default" | "destructive" | "outline" | "secondary" = "default";
  
  switch(status) {
    case 'DRAFT':
      variant = "outline";
      break;
    case 'PUBLISHED':
      variant = "secondary";
      break;
    case 'IN_PROGRESS':
      variant = "default";
      break;
    case 'COMPLETED':
      variant = "secondary";
      break;
    case 'CANCELLED':
      variant = "destructive";
      break;
  }
  
  return (
    <Badge variant={variant}>
      {status.replace('_', ' ')}
    </Badge>
  );
};

export default TournamentStatusBadge;
