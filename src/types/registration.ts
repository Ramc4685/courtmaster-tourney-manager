import { z } from "zod";
import type { TournamentCategory } from './tournament';

export type TournamentRegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITLIST' | 'CHECKED_IN' | 'WITHDRAWN';

export interface RegistrationMetadata {
  playerName: string;
  teamSize: number;
  division: string;
  contactEmail: string;
  contactPhone: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  waiverSigned: boolean;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  specialRequests?: string;
  checkedInAt?: string;
  notes?: string;
  priority?: number;
  comments?: RegistrationComment[];
  waitlistPosition?: number;
  waitlistReason?: string;
  waitlistNotified?: string;
  waitlistPromotionHistory?: Array<{
    date: string;
    fromPosition: number;
    toPosition: number;
  }>;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  teamId: string;
  userId: string;
  status: TournamentRegistrationStatus;
  registeredAt: string;
  notes?: string;
  priority?: number;
  category: TournamentCategory;
  metadata: RegistrationMetadata;
}

// Team member schema
export const teamMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  player_id: z.string(),
});

// Player registration schema
export const playerRegistrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  player_id: z.string(),
  division_id: z.string(),
});

// Team registration schema
export const teamRegistrationSchema = z.object({
  teamName: z.string().min(1, "Team name is required"),
  captainName: z.string().min(1, "Captain name is required"),
  captainEmail: z.string().email("Invalid email address"),
  captainPhone: z.string().optional(),
  members: z.array(teamMemberSchema).min(1, "At least one team member is required"),
  player_id: z.string(),
  division_id: z.string(),
});

export type TeamMember = z.infer<typeof teamMemberSchema>;
export type PlayerRegistration = z.infer<typeof playerRegistrationSchema>;
export type TeamRegistration = z.infer<typeof teamRegistrationSchema>;

export interface RegistrationComment {
  id: string;
  text: string;
  createdBy: string;
  createdAt: string;
}

export interface BaseRegistrationWithStatus {
  id: string;
  tournamentId: string;
  status: TournamentRegistrationStatus;
  metadata: RegistrationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerRegistrationWithStatus extends PlayerRegistration, BaseRegistrationWithStatus {}

export interface TeamRegistrationWithStatus extends TeamRegistration, BaseRegistrationWithStatus {
  metadata: RegistrationMetadata;
} 