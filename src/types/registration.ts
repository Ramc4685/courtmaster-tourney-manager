import { z } from 'zod';
// Import and re-export RegistrationStatus
import { RegistrationStatus as ImportedRegistrationStatus } from './tournament-enums';
export const RegistrationStatus = ImportedRegistrationStatus;

export interface RegistrationComment {
  id: string;
  text: string;
  createdAt: string;
  createdBy: string;
}

export interface RegistrationMetadata {
  notes?: string;
  priority?: number;
  comments?: RegistrationComment[];
  waitlistPosition?: number;
  waitlistReason?: string;
  waitlistNotified?: string;
  tags?: string[];
  source?: string;
  checkInNotes?: string;
  checkInTime?: string;
  playerName?: string;
  contactEmail?: string;
  teamSize?: number;
  waitlistHistory?: Array<{
    date: string;
    fromPosition: number;
    toPosition: number;
    reason?: string;
  }>;
  // Add fields based on actual usage/schema
  updatedAt?: string; // Added for consistency if needed
}

export interface TeamMember {
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

// Consolidated Player Registration Type (used by service/context)
export interface PlayerRegistration {
  id: string;
  tournamentId: string;
  userId: string;
  categoryId?: string | null; // Optional based on schema
  status: RegistrationStatus;
  registeredAt: string; // Use string for ISO date format
  updatedAt?: string | null; // Use string for ISO date format
  playerName: string;
  playerEmail: string;
  waiverAccepted?: boolean | null;
  paymentStatus?: string | null; // e.g., 'pending', 'paid', 'failed'
  waitlistPosition?: number | null;
  // Add other relevant fields from DB schema if needed
}

// Consolidated Team Registration Type (used by service/context)
export interface TeamRegistration {
  id: string;
  tournamentId: string;
  teamId: string; // Assuming a link to a teams table
  categoryId?: string | null; // Optional based on schema
  status: RegistrationStatus;
  registeredAt: string; // Use string for ISO date format
  updatedAt?: string | null; // Use string for ISO date format
  teamName: string;
  captainId?: string | null;
  memberUserIds?: string[]; // Or fetch members separately
  waiverAccepted?: boolean | null;
  paymentStatus?: string | null;
  waitlistPosition?: number | null;
  // Add other relevant fields from DB schema if needed
}


// Generic registration interface for mixed lists (e.g., waitlist)
export interface RegistrationItem {
  id: string;
  name: string; // Player name or Team name
  type: 'player' | 'team';
  status: RegistrationStatus;
  registeredAt: string;
  updatedAt?: string | null;
  waitlistPosition?: number | null;
  // Add other common fields if necessary
}


// Zod schemas for validation (if needed, align with actual form data)
export const playerRegistrationSchema = z.object({
  // ... schema based on registration form fields
});

export const teamRegistrationSchema = z.object({
  // ... schema based on registration form fields
});

