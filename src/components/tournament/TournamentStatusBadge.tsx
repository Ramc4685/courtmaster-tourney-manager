
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TournamentStatus } from '@/types/tournament';

interface TournamentStatusBadgeProps {
  status: TournamentStatus | string;
}

export const TournamentStatusBadge: React.FC<TournamentStatusBadgeProps> = ({ status }) => {
  let variant: 'default' | 'secondary' | 'destructive' | 'outline';
  let label: string;

  switch (status) {
    case 'DRAFT':
      variant = 'outline';
      label = 'Draft';
      break;
    case 'PUBLISHED':
      variant = 'default';
      label = 'Published';
      break;
    case 'IN_PROGRESS':
      variant = 'secondary';
      label = 'In Progress';
      break;
    case 'COMPLETED':
      variant = 'default';
      label = 'Completed';
      break;
    case 'CANCELLED':
      variant = 'destructive';
      label = 'Cancelled';
      break;
    default:
      variant = 'outline';
      label = status as string;
  }

  return <Badge variant={variant}>{label}</Badge>;
};


