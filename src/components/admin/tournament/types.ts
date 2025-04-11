
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

export interface Division {
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
    startDate: z.date({
      required_error: "Start date is required",
    }),
    endDate: z.date().optional(),
    format: z.nativeEnum(TournamentFormat),
    description: z.string().optional(),
    registrationEnabled: z.boolean().default(false),
    registrationDeadline: z.date().optional(),
    maxTeams: z.number().min(2).optional(),
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
    (data) => !data.startDate || !data.endDate || data.endDate >= data.startDate,
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => !data.registrationEnabled || !data.registrationDeadline || !data.startDate || data.registrationDeadline <= data.startDate,
    {
      message: "Registration deadline must be before start date",
      path: ["registrationDeadline"],
    }
  );

export type TournamentFormValues = z.infer<typeof tournamentFormSchema>;
export type DivisionFormValues = z.infer<typeof divisionSchema>;
