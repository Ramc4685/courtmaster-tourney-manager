
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
}

export interface PlayerRegistrationWithStatus extends TournamentRegistration {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface TeamRegistrationWithStatus extends TournamentRegistration {
  teamName: string;
  captainName: string;
  captainEmail: string;
  captainPhone?: string;
  members?: TeamMember[];
}

// Schema for validation using zod
export const playerRegistrationSchema = {
  // Define schema for player registration validation
};

export const teamRegistrationSchema = {
  // Define schema for team registration validation
};
