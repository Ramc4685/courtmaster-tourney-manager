import { AuditableEntity } from './base.model';

export enum RegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WAITLISTED = 'WAITLISTED',
  CANCELLED = 'CANCELLED'
}

export interface RegistrationMetadata {
  playerName?: string;
  contactEmail?: string;
  teamSize?: number;
  waitlistPosition?: number;
  waitlistHistory?: Array<{
    date: string;
    fromPosition: number;
    toPosition: number;
    reason?: string;
  }>;
  comments?: Array<{
    id: string;
    text: string;
    createdAt: string;
    createdBy: string;
  }>;
}

export interface Registration extends AuditableEntity {
  tournamentId: string;
  playerId: string | null;
  divisionId: string | null;
  partnerId: string | null;
  status: RegistrationStatus;
  metadata: RegistrationMetadata;
  notes: string | null;
  priority: number;
  type: 'INDIVIDUAL' | 'TEAM';

  // Business methods
  isWaitlisted(): boolean;
  canBeApproved(): boolean;
  getWaitlistPosition(): number | null;
  addComment(text: string, userId: string): void;
  updateWaitlistPosition(newPosition: number, reason?: string): void;
} 