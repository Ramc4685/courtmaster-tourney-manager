import { AuditableResponseDTO, BaseRequestDTO } from './base.dto';
import { RegistrationStatus } from '@/domain/models/registration.model';

// Request DTOs
export interface CreateRegistrationRequestDTO extends BaseRequestDTO {
  tournament_id: string;
  player_id?: string;
  division_id?: string;
  partner_id?: string;
  type: 'INDIVIDUAL' | 'TEAM';
  metadata?: {
    player_name?: string;
    contact_email?: string;
    team_size?: number;
  };
  notes?: string;
}

export interface UpdateRegistrationRequestDTO extends BaseRequestDTO {
  division_id?: string;
  partner_id?: string;
  status?: RegistrationStatus;
  notes?: string;
  priority?: number;
}

export interface AddCommentRequestDTO extends BaseRequestDTO {
  text: string;
}

export interface UpdateWaitlistPositionRequestDTO extends BaseRequestDTO {
  position: number;
  reason?: string;
}

// Response DTOs
export interface RegistrationResponseDTO extends AuditableResponseDTO {
  tournament_id: string;
  player_id: string | null;
  division_id: string | null;
  partner_id: string | null;
  status: string;
  metadata: {
    player_name?: string;
    contact_email?: string;
    team_size?: number;
    waitlist_position?: number;
    waitlist_history?: Array<{
      date: string;
      from_position: number;
      to_position: number;
      reason?: string;
    }>;
    comments?: Array<{
      id: string;
      text: string;
      created_at: string;
      created_by: string;
    }>;
  };
  notes: string | null;
  priority: number;
  type: 'INDIVIDUAL' | 'TEAM';
}

export interface RegistrationListResponseDTO {
  items: RegistrationResponseDTO[];
  total: number;
  page: number;
  page_size: number;
} 