export interface BaseDTO {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface RegistrationDTO extends BaseDTO {
  tournament_id: string;
  player_id: string | null;
  division_id: string | null;
  partner_id: string | null;
  status: string;
  metadata: Record<string, any>;
  notes: string | null;
  priority: number;
}

export interface NotificationDTO extends BaseDTO {
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
}

export interface ProfileDTO extends BaseDTO {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  preferences: Record<string, any>;
}

export interface TournamentMessageDTO extends BaseDTO {
  tournament_id: string;
  sender_id: string;
  content: string;
} 