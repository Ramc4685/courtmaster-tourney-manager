import { AuditableModel } from '../../infrastructure/repositories/base.repository';

export enum RegistrationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  WAITLISTED = 'waitlisted',
  CANCELLED = 'cancelled'
}

export interface WaitlistHistoryEntry {
  timestamp: Date;
  reason: string;
  fromPosition: number;
  toPosition: number;
}

export interface Comment {
  text: string;
  createdAt: Date;
  createdBy: string;
}

export interface RegistrationMetadata {
  playerName?: string;
  contactEmail?: string;
  teamSize?: number;
  waitlistHistory?: WaitlistHistoryEntry[];
}

export interface Registration extends AuditableModel {
  tournamentId: string;
  playerId: string;
  divisionId: string;
  partnerId?: string;
  status: string;
  priority: number;
  metadata?: RegistrationMetadata;
  notes?: string;
  comments?: Comment[];
} 