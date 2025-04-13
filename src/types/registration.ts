
export enum RegistrationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  WITHDRAWN = "WITHDRAWN",
  WAITLISTED = "WAITLISTED",
  CHECKED_IN = "CHECKED_IN",
  // Add WAITLIST as an alias for WAITLISTED for backward compatibility
  WAITLIST = "WAITLISTED"
}

export interface RegistrationMetadata {
  checkInTime?: string;
  playerName?: string;
  teamName?: string;
  teamSize?: number;
  division?: string;
  contactEmail?: string;
  contactPhone?: string;
  paymentStatus?: string;
  notes?: string;
  partnerPreference?: string;
  skillLevel?: string;
  specialRequests?: string;
  medicalNotes?: string;
  waitlistReason?: string;
  waiverSigned?: boolean;
  // For waitlist movement tracking
  waitlistHistory?: {
    timestamp: string;
    reason: string;
    date?: string;
    fromPosition?: number;
    toPosition?: number;
  }[];
  comments?: string[]; // Add to support RegistrationDetails
  waitlistPromotionHistory?: any[]; // Add for compatibility
  // Additional fields for team registration
  captainName?: string;
  captainEmail?: string;
  captainPhone?: string;
  priority?: number;
  waitlistPosition?: number; // Add for waitlist tracking
  waitlistNotified?: string; // Add for notification tracking
  emergencyContact?: string; // Add for emergency contact info
}

export interface TeamMember {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isTeamCaptain?: boolean;
  name?: string;
  player_id?: string; // Add for compatibility
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  categoryId?: string;
  playerId?: string;
  partnerId?: string;
  status: RegistrationStatus;
  metadata: RegistrationMetadata;
  createdAt: Date;
  updatedAt: Date;
  category?: any;
  division_id?: string; // Add for compatibility
  notes?: string; // Add for compatibility
  priority?: number; // Add for compatibility
}

export interface PlayerRegistrationWithStatus extends TournamentRegistration {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  playerId?: string; // Add for compatibility
  player_id?: string; // Add for compatibility
  division_id?: string; // Add for compatibility
}

export interface TeamRegistrationWithStatus extends TournamentRegistration {
  teamName: string;
  captainName: string;
  captainEmail: string;
  captainPhone?: string;
  members?: TeamMember[];
  playerId?: string; // Add for compatibility
  player_id?: string; // Add for compatibility
  division_id?: string; // Add for compatibility
}

// Define aliases for backward compatibility
export type PlayerRegistration = PlayerRegistrationWithStatus;
export type TeamRegistration = TeamRegistrationWithStatus;
export type TournamentRegistrationStatus = RegistrationStatus;

// Schema for validation using zod
export const playerRegistrationSchema = {
  // Define schema for player registration validation
};

export const teamRegistrationSchema = {
  // Define schema for team registration validation
};
