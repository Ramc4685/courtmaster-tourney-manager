import { z } from 'zod';
// Import and re-export RegistrationStatus
import { RegistrationStatus as ImportedRegistrationStatus } from './tournament-enums';
export const RegistrationStatus = ImportedRegistrationStatus;

// Registration type
export type RegistrationType = 'player' | 'team' | 'official';

export interface RegistrationComment {
  id: string;
  text: string;
  createdAt: string;
  createdBy: string;
}

/**
 * Metadata object containing additional registration information and tracking data.
 * Used for storing flexible data that doesn't fit in the main registration schema.
 */
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
  updatedAt?: string;
}

export interface TeamMember {
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

/**
 * User preferences for registration settings and options.
 * Contains key-value pairs for flexible preference storage.
 */
export interface UserPreferences {
  [key: string]: unknown;
}

/**
 * Sport-specific data structure for storing custom information per sport type.
 * Contains dynamic fields based on the specific sport requirements.
 */
export interface SportSpecificData {
  [key: string]: unknown;
}

// Base interface containing common registration fields
export interface BaseRegistrationFields {
  id: string;
  categoryId?: string;
  status: string;
  registeredAt: string;
  updatedAt?: string;
  waiverAccepted?: boolean;
  paymentStatus?: string;
  waitlistPosition?: number;
  sportType?: string;
}

// Consolidated Player Registration Type (used by service/context)
export interface PlayerRegistration extends BaseRegistrationFields {
  tournamentId: string;
  userId: string;
  playerName: string;
  playerEmail: string;
}

// Consolidated Team Registration Type (used by service/context)
export interface TeamRegistration extends BaseRegistrationFields {
  tournamentId: string;
  teamId: string;
  divisionId: string;
  teamName: string;
  captainId?: string;
}

// Generic registration interface for mixed lists (e.g., waitlist)
export interface RegistrationItem extends BaseRegistrationFields {
  name: string; // Player name or Team name
  type: RegistrationType;
}

// Enhanced registration type for multi-sport support
export interface Registration {
  id: string;
  $id?: string; // Appwrite document ID
  tournamentId: string;
  divisionId: string;
  playerId?: string;
  teamId?: string;
  partnerId?: string;
  type: RegistrationType;
  status: string;
  createdAt: string;
  updatedAt: string;
  checkedIn?: boolean;
  checkedInAt?: string;
  checkedInBy?: string;
  waiverSigned?: boolean;
  waiverId?: string;
  paymentStatus?: 'pending' | 'completed' | 'refunded';
  paymentAmount?: number;
  paymentMethod?: string;
  paymentId?: string;
  notes?: string;
  /**
   * Additional metadata for flexible data storage
   */
  metadata?: RegistrationMetadata;
  /**
   * User preferences for registration configuration
   */
  preferences?: UserPreferences;
  sportType?: string;
  /**
   * Sport-specific data containing custom fields per sport
   */
  sportSpecificData?: SportSpecificData;
}

// Registration with status information
export interface RegistrationWithStatus extends Registration {
  team1Name?: string;
  team2Name?: string;
  divisionName?: string;
  categoryName?: string;
  playerName?: string;
  teamName?: string;
  email?: string;
  phone?: string;
  sportType: string;
}

// Player-specific registration with status
export interface PlayerRegistrationWithStatus extends RegistrationWithStatus {
  firstName?: string;
  lastName?: string;
  playerEmail?: string;
  playerPhone?: string;
}

// Team-specific registration with status  
export interface TeamRegistrationWithStatus extends RegistrationWithStatus {
  teamName: string;
  captainName?: string;
  captainEmail?: string;
  teamSize?: number;
  members?: Array<{
    name: string;
    email: string;
    phone?: string;
    role?: string;
  }>;
}


// Zod schemas for validation (if needed, align with actual form data)
export const playerRegistrationSchema = z.object({
  // ... schema based on registration form fields
});

export const teamRegistrationSchema = z.object({
  // ... schema based on registration form fields
});

