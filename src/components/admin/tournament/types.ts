import { z } from "zod";

export enum TournamentFormat {
  SINGLE_ELIMINATION = "SINGLE_ELIMINATION",
  DOUBLE_ELIMINATION = "DOUBLE_ELIMINATION",
  ROUND_ROBIN = "ROUND_ROBIN",
}

export enum CategoryType {
  MENS_SINGLES = "MENS_SINGLES",
  WOMENS_SINGLES = "WOMENS_SINGLES",
  MENS_DOUBLES = "MENS_DOUBLES",
  WOMENS_DOUBLES = "WOMENS_DOUBLES",
  MIXED_DOUBLES = "MIXED_DOUBLES",
}

// Define the form schema with Zod
export const tournamentFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
  format: z.nativeEnum(TournamentFormat, {
    required_error: "Tournament format is required",
  }),
  description: z.string().optional(),
  registrationEnabled: z.boolean().default(false),
  registrationDeadline: z.date().optional(),
  maxTeams: z.number().min(2).optional(),
  scoringRules: z.object({
    pointsToWin: z.number().min(1).default(11),
    mustWinByTwo: z.boolean().default(true),
    maxPoints: z.number().min(1).optional(),
  }).default({}),
  divisions: z.array(z.object({
    name: z.string().min(1, "Division name is required"),
    categories: z.array(z.object({
      name: z.string().min(1, "Category name is required"),
      type: z.nativeEnum(CategoryType),
    })).default([]),
  })).default([]),
});

export type TournamentFormValues = z.infer<typeof tournamentFormSchema>;

export interface Division {
  name: string;
  categories: {
    name: string;
    type: CategoryType;
  }[];
} 