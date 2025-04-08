import { z } from "zod";
import { TournamentFormat, CategoryType } from '@/types/tournament-enums';

export const divisionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Division name is required"),
  type: z.enum(["MENS", "WOMENS", "MIXED"]),
  categories: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, "Category name is required"),
    type: z.nativeEnum(CategoryType),
    format: z.nativeEnum(TournamentFormat),
    scoringSettings: z.object({
      matchFormat: z.enum(["TIMED", "STANDARD"]),
      pointsPerMatch: z.number().min(1),
      maxPoints: z.number().min(1),
      maxSets: z.number().min(1),
      allowNegativeScores: z.boolean(),
      requireTwoPointLead: z.boolean(),
      maxTwoPointLeadScore: z.number().min(1),
    }).optional(),
  })),
});

export const tournamentFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
  format: z.nativeEnum(TournamentFormat),
  description: z.string().optional(),
  registrationEnabled: z.boolean().default(false),
  registrationDeadline: z.date().optional(),
  maxTeams: z.number().min(2).optional(),
  scoringRules: z.object({
    pointsToWin: z.number().min(1).optional(),
    pointsToWinBy: z.number().min(1).optional(),
    maxPoints: z.number().min(1).optional(),
    mustWinByTwo: z.boolean().optional(),
  }).optional(),
  divisions: z.array(divisionSchema).default([]),
  categoryRegistrationRules: z.array(z.any()).default([]),
  requirePlayerProfile: z.boolean().default(false),
});

export type TournamentFormValues = z.infer<typeof tournamentFormSchema>;
export type DivisionFormValues = z.infer<typeof divisionSchema>;

export interface Division {
  id?: string;
  name: string;
  type: CategoryType;
  description?: string;
  maxTeams?: number;
  minTeams?: number;
}
