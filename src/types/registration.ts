
import { z } from 'zod';
import { Division } from './tournament-enums';

export enum RegistrationStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CHECKED_IN = "CHECKED_IN",
  WAITLIST = "WAITLIST",
  WAITLISTED = "WAITLISTED", // Keep both for compatibility
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  APPROVED = "APPROVED",
  WITHDRAWN = "WITHDRAWN"
}

// Alias for backward compatibility
export type TournamentRegistrationStatus = RegistrationStatus;

export interface RegistrationMetadata {
  checkInTime?: string;
  playerName: string;
  teamName?: string; // Add for TeamRegistrationForm
  teamSize: number;
  division: string;
  contactEmail: string;
  contactPhone: string;
  paymentStatus?: string;
  notes?: string;
  specialRequests?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  previousParticipation?: boolean;
  skillLevel?: string;
  waitlistPosition?: number;
  waitlistPromotionHistory?: {
    timestamp: string;
    reason: string;
    date?: string; // Support for old format
    fromPosition?: number; // Support for old format
    toPosition?: number; // Support for old format
  }[];
  waitlistNotified?: string;
  priority?: number;
  waitlistReason?: string;
  comments?: string;
  waiverSigned?: boolean;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  categoryId: string;
  playerId: string;
  partnerId?: string;
  status: RegistrationStatus;
  metadata: RegistrationMetadata;
  createdAt: Date;
  updatedAt: Date;
  category: any;
}

export interface PlayerRegistrationWithStatus extends TournamentRegistration {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  player_id?: string;
  division_id?: string;
}

export interface TeamMember {
  id?: string;
  player_id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  isTeamCaptain?: boolean;
  name?: string;
}

export interface TeamRegistrationWithStatus extends TournamentRegistration {
  teamName: string;
  captainName: string;
  captainEmail: string;
  captainPhone?: string;
  members: TeamMember[];
  player_id?: string;
  division_id?: string;
}

// Schema for player registration validation
export const playerRegistrationSchema = z.object({
  player_id: z.string(),
  division_id: z.string(),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

// Schema for team member validation
export const teamMemberSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  isTeamCaptain: z.boolean().optional(),
  name: z.string().optional(),
  player_id: z.string().optional(), // Add for TeamRegistrationForm
});

// Schema for team registration validation
export const teamRegistrationSchema = z.object({
  player_id: z.string(),
  division_id: z.string(),
  teamName: z.string().min(2, "Team name is required"),
  captainName: z.string().min(2, "Captain name is required"),
  captainEmail: z.string().email("Invalid email address"),
  captainPhone: z.string().optional(),
  members: z.array(teamMemberSchema).min(1, "At least one team member is required"),
});

// Type definitions from schemas
export type PlayerRegistration = z.infer<typeof playerRegistrationSchema>;
export type TeamRegistration = z.infer<typeof teamRegistrationSchema>;
