import { z } from "zod";

// Player registration schema
export const playerRegistrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

export type PlayerRegistration = z.infer<typeof playerRegistrationSchema>;

// Team member schema
export const teamMemberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  isTeamCaptain: z.boolean().default(false),
});

// Team registration schema
export const teamRegistrationSchema = z.object({
  teamName: z.string().min(1, "Team name is required"),
  members: z.array(teamMemberSchema).min(1, "At least one team member is required"),
});

export type TeamMember = z.infer<typeof teamMemberSchema>;
export type TeamRegistration = z.infer<typeof teamRegistrationSchema>;

// Registration status
export type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED";

// Player registration with status
export interface PlayerRegistrationWithStatus extends PlayerRegistration {
  id: string;
  tournamentId: string;
  status: RegistrationStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Team registration with status
export interface TeamRegistrationWithStatus extends TeamRegistration {
  id: string;
  tournamentId: string;
  status: RegistrationStatus;
  createdAt: Date;
  updatedAt: Date;
} 