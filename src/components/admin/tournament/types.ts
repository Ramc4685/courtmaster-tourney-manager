import { z } from "zod";
import { TournamentFormat, CategoryType, PlayType, Division, GameType } from '@/types/tournament-enums';

export const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Category name is required"),
  playType: z.nativeEnum(PlayType),
  format: z.nativeEnum(TournamentFormat),
  scoringSettings: z.object({
    pointsToWin: z.number().min(1),
    mustWinByTwo: z.boolean(),
    maxPoints: z.number().min(1),
  }).optional(),
});

export const divisionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Division name is required"),
  type: z.nativeEnum(Division),
  categories: z.array(categorySchema),
});

export interface Category {
  id: string;
  name: string;
  playType: PlayType;
  format: TournamentFormat;
  scoringSettings?: {
    pointsToWin: number;
    mustWinByTwo: boolean;
    maxPoints: number;
  };
}

export interface DivisionInterface {
  id: string;
  name: string;
  type: Division;
  categories: Category[];
}

export const tournamentFormSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    location: z.string().min(3, "Location must be at least 3 characters"),
    gameType: z.nativeEnum(GameType).default(GameType.BADMINTON),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional(),
    format: z.nativeEnum(TournamentFormat),
    description: z.string().optional(),
    registrationEnabled: z.boolean().default(false),
    registrationDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional(),
    maxTeams: z.number().min(2).default(8),
    scoringRules: z.object({
      pointsToWin: z.number().min(1),
      mustWinByTwo: z.boolean(),
      maxPoints: z.number().min(1),
    }).optional(),
    divisions: z.array(divisionSchema).default([]),
    categoryRegistrationRules: z.array(z.any()).default([]),
    requirePlayerProfile: z.boolean().default(false),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = data.endDate ? new Date(data.endDate) : null;
      return !end || end >= start;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const deadline = data.registrationDeadline ? new Date(data.registrationDeadline) : null;
      return !data.registrationEnabled || !deadline || deadline <= start;
    },
    {
      message: "Registration deadline must be before start date",
      path: ["registrationDeadline"],
    }
  );

export type TournamentFormValues = z.infer<typeof tournamentFormSchema>;
export type DivisionFormValues = z.infer<typeof divisionSchema>;
