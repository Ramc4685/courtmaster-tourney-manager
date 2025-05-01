import { z } from "zod";
import { TournamentFormat, Division, GameType, PlayType, TournamentStatus, TournamentStageEnum } from '@/types/tournament-enums';

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
  // division: z.string(), // Removed, division info is in the parent structure
  type: z.string().default('standard'), // e.g., 'standard', 'championship'
  playType: z.nativeEnum(PlayType).default(PlayType.SINGLES),
  format: z.nativeEnum(TournamentFormat).default(TournamentFormat.SINGLE_ELIMINATION),
  seeded: z.boolean().optional().default(false),
  maxTeams: z.number().int().positive().optional(), // Max teams specific to this category
  // teams: z.array(z.any()).optional() // We'll type this properly when needed
});

export const divisionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Division name is required"),
  type: z.nativeEnum(Division), // e.g., MENS, WOMENS, OPEN
  level: z.string().optional(), // e.g., ADVANCED, INTERMEDIATE, or custom string
  categories: z.array(categorySchema).min(1, "At least one category is required per division").default([]),
});

export interface DivisionInterface {
  id: string;
  name: string;
  type: Division;
  level?: string;
  categories: Category[];
}

// More detailed scoring rules schema based on PRD 4.1.4
export const scoringRulesSchema = z.object({
  pointsToWinSet: z.number().int().min(1, "Points to win set must be at least 1").default(21),
  setsToWinMatch: z.number().int().min(1, "Sets to win match must be at least 1").default(2),
  maxSets: z.number().int().min(1, "Max sets must be at least 1").default(3),
  mustWinByTwo: z.boolean().default(true),
  maxPointsPerSet: z.number().int().min(1, "Maximum points per set must be at least 1").default(30),
  tiebreakerFormat: z.string().optional(), // e.g., 'standard_tiebreak_7', 'super_tiebreak_10'
  // Add other sport-specific or custom rules as needed
});

// Registration settings schema based on PRD 4.1.1, 4.2.1
export const registrationSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  deadline: z.coerce.date().optional(),
  requirePlayerProfile: z.boolean().default(false),
  maxEntries: z.number().int().positive().optional(), // Overall max entries for the tournament
  maxEntriesPerCategory: z.boolean().default(false), // Flag if max entries are per category
  allowWaitlist: z.boolean().default(true),
  feeAmount: z.number().nonnegative().optional(), // Future implementation
  waiverRequired: z.boolean().default(false),
  // Add other registration settings as needed
});

export const tournamentFormSchema = z.object({
  // Basic Info
  name: z.string().min(1, "Tournament name is required"),
  location: z.string().min(1, "Location is required"),
  gameType: z.nativeEnum(GameType),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  
  // Format & Structure
  format: z.nativeEnum(TournamentFormat).default(TournamentFormat.SINGLE_ELIMINATION), // Overall tournament format if not category-specific
  divisionDetails: z.array(divisionSchema).min(1, "At least one division is required").default([]),
  
  // Registration
  registration: registrationSettingsSchema.default({}),
  
  // Scoring
  scoringRules: scoringRulesSchema.default({}),
  
}).refine(
  (data) => {
    if (data.registration.enabled && !data.registration.deadline) {
      return false;
    }
    return true;
  },
  {
    message: "Registration deadline is required when registration is enabled",
    path: ["registration", "deadline"], // Updated path
  }
).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  },
  {
    message: "End date must be on or after start date",
    path: ["endDate"],
  }
).refine(
  (data) => {
    if (data.registration.enabled && data.registration.deadline) {
      const deadline = new Date(data.registration.deadline);
      const start = new Date(data.startDate);
      return deadline <= start;
    }
    return true;
  },
  {
    message: "Registration deadline must be on or before tournament start date",
    path: ["registration", "deadline"], // Updated path
  }
).refine(
  (data) => {
    // Validate that maxPointsPerSet is >= pointsToWinSet
    if (data.scoringRules.maxPointsPerSet < data.scoringRules.pointsToWinSet) {
      return false;
    }
    return true;
  },
  {
    message: "Maximum points per set cannot be less than points to win set",
    path: ["scoringRules", "maxPointsPerSet"],
  }
);

// Export the inferred types from the schemas
export type Category = z.infer<typeof categorySchema>;
export type TournamentFormValues = z.infer<typeof tournamentFormSchema>;
export type DivisionFormValues = z.infer<typeof divisionSchema>;
export type ScoringRules = z.infer<typeof scoringRulesSchema>;
export type RegistrationSettings = z.infer<typeof registrationSettingsSchema>;

