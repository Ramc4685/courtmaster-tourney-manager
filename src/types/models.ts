export interface BaseModel {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Registration extends BaseModel {
  tournament_id: string;
  player_id: string | null;
  division_id: string | null;
  partner_id: string | null;
  status: string;
  metadata: RegistrationMetadata;
  notes: string | null;
  priority: number;
}

export interface RegistrationMetadata {
  playerName?: string;
  contactEmail?: string;
  contactPhone?: string;
  teamSize?: number;
  division?: string;
  emergencyContact?: string;
  waiverSigned?: boolean;
  paymentStatus?: string;
  teamName?: string;
  captainName?: string;
  captainEmail?: string;
  captainPhone?: string;
  waitlistPosition?: number;
  waitlistHistory?: WaitlistHistoryEntry[];
  waitlistNotified?: string;
  comments?: Comment[];
}

export interface WaitlistHistoryEntry {
  timestamp: string;
  reason: string;
  fromPosition: number;
  toPosition: number;
}

export interface Comment {
  text: string;
  createdBy: string;
  createdAt: string;
}

export interface Notification extends BaseModel {
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
}

export interface Profile extends BaseModel {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  preferences: ProfilePreferences;
}

export interface ProfilePreferences {
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  theme?: string;
  language?: string;
}

export interface TournamentMessage extends BaseModel {
  tournamentId: string;
  senderId: string;
  content: string;
} 