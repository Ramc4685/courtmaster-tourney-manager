import { AuditableDTO } from '../repositories/base.repository';

export interface WaitlistHistoryEntryDTO {
  timestamp: string;
  reason: string;
  from_position: number;
  to_position: number;
}

export interface RegistrationMetadataDTO {
  player_name?: string;
  contact_email?: string;
  team_size?: number;
  waitlist_history?: WaitlistHistoryEntryDTO[];
}

export interface CommentDTO {
  text: string;
  created_at: string;
  created_by: string;
}

export interface RegistrationResponseDTO extends AuditableDTO {
  tournament_id: string;
  player_id: string;
  division_id: string;
  partner_id?: string;
  status: string;
  priority: number;
  metadata?: RegistrationMetadataDTO;
  notes?: string;
  comments?: CommentDTO[];
} 