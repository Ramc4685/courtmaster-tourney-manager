import { z } from "zod";
import { TournamentFormat, Division, GameType, PlayType } from '@/types/tournament-enums';

// Define the main category types as a const object
const CATEGORY_TYPES = {
  MENS: 'MENS',
  WOMENS: 'WOMENS',
  MIXED: 'MIXED',
  OPEN: 'OPEN',
} as const;

// Define the division levels as a const object
const DIVISION_LEVELS = {
  ADVANCED: 'ADVANCED',
  STANDARD: 'STANDARD',
  INTERMEDIATE: 'INTERMEDIATE',
  BEGINNER: 'BEGINNER',
  CUSTOM: 'CUSTOM',
} as const;

// Export the types derived from the const objects
export type CategoryType = typeof CATEGORY_TYPES[keyof typeof CATEGORY_TYPES];
export type DivisionLevel = typeof DIVISION_LEVELS[keyof typeof DIVISION_LEVELS];

// Export the const objects for use in the application
export const CategoryTypes = CATEGORY_TYPES;
export const DivisionLevels = DIVISION_LEVELS;

export const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Category name is required"),
  playType: z.nativeEnum(PlayType),
  format: z.nativeEnum(TournamentFormat).default(TournamentFormat.SINGLE_ELIMINATION),
  division: z.nativeEnum(Division).default(Division.OPEN),
});

export const divisionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Division name is required"),
  type: z.nativeEnum(Division),
  categories: z.array(categorySchema).default([]),
});

export interface DivisionInterface {
  id: string;
  name: string;
  type: typeof Division[keyof typeof Division];
  categories: Category[];
}

// Helper function to convert string date to Date object
const dateStringToDate = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  return date;
};

export const tournamentFormSchema = z.object({
  name: z.string().min(1, "Tournament name is required"),
  location: z.string().min(1, "Location is required"),
  gameType: z.nativeEnum(GameType),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  divisionDetails: z.array(divisionSchema).default([]),
  registrationEnabled: z.boolean().default(false),
  registrationDeadline: z.coerce.date().optional(),
  requirePlayerProfile: z.boolean().default(false),
  maxTeams: z.number().min(0, "Maximum teams must be 0 or greater"),
  scoringRules: z.object({
    pointsToWin: z.number().min(1, "Points to win must be at least 1"),
    mustWinByTwo: z.boolean(),
    maxPoints: z.number().min(1, "Maximum points must be at least 1"),
  }),
}).refine(
  (data) => {
    if (data.registrationEnabled && !data.registrationDeadline) {
      return false;
    }
    return true;
  },
  {
    message: "Registration deadline is required when registration is enabled",
    path: ["registrationDeadline"],
  }
).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  },
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
).refine(
  (data) => {
    if (data.registrationEnabled && data.registrationDeadline) {
      const deadline = new Date(data.registrationDeadline);
      const start = new Date(data.startDate);
      return deadline <= start;
    }
    return true;
  },
  {
    message: "Registration deadline must be before tournament start date",
    path: ["registrationDeadline"],
  }
);

// Export the inferred types from the schemas
export type Category = z.infer<typeof categorySchema>;
export type TournamentFormValues = z.infer<typeof tournamentFormSchema>;
export type DivisionFormValues = z.infer<typeof divisionSchema>;
