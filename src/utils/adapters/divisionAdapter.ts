import { Division, CategoryType, PlayType } from '@/types/tournament-enums';
import { DivisionConfig } from '@/types/tournament-enums';

/**
 * Interface for Division with proper typing for both snake_case and camelCase patterns
 */
export interface DivisionEntity {
  id: string;
  name: string;
  type: Division;
  tournament_id: string;
  tournamentId: string;
  categories?: CategoryEntity[];
  min_age?: number;
  minAge?: number;
  max_age?: number;
  maxAge?: number;
  gender?: string;
  capacity?: number;
  skill_level?: string;
  skillLevel?: string;
  created_at: Date;
  createdAt: Date;
  updated_at: Date;
  updatedAt: Date;
}

/**
 * Interface for Category with proper typing for both snake_case and camelCase patterns
 */
export interface CategoryEntity {
  id: string;
  name: string;
  type: CategoryType;
  division_id: string;
  divisionId: string;
  play_type?: PlayType;
  playType?: PlayType;
  format?: any;
  capacity?: number;
  created_at: Date;
  createdAt: Date;
  updated_at: Date;
  updatedAt: Date;
}

/**
 * Converts a division object from the backend (snake_case) to frontend format (camelCase)
 */
export const divisionFromBackend = (data: any): DivisionEntity => {
  return {
    id: data.id,
    name: data.name,
    type: data.type as Division,
    tournamentId: data.tournament_id,
    tournament_id: data.tournament_id,
    categories: data.categories ? data.categories.map(categoryFromBackend) : [],
    minAge: data.min_age,
    min_age: data.min_age,
    maxAge: data.max_age,
    max_age: data.max_age,
    gender: data.gender,
    capacity: data.capacity,
    skillLevel: data.skill_level,
    skill_level: data.skill_level,
    createdAt: new Date(data.created_at),
    created_at: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    updated_at: new Date(data.updated_at)
  };
};

/**
 * Converts a division object from frontend format to backend format for API calls
 */
export const divisionToBackend = (division: Partial<DivisionEntity>): Record<string, any> => {
  const payload: Record<string, any> = {};

  if (division.name !== undefined) payload.name = division.name;
  if (division.type !== undefined) payload.type = division.type;
  if (division.tournamentId !== undefined) payload.tournament_id = division.tournamentId;
  if (division.tournament_id !== undefined) payload.tournament_id = division.tournament_id;
  if (division.minAge !== undefined) payload.min_age = division.minAge;
  if (division.min_age !== undefined) payload.min_age = division.min_age;
  if (division.maxAge !== undefined) payload.max_age = division.maxAge;
  if (division.max_age !== undefined) payload.max_age = division.max_age;
  if (division.gender !== undefined) payload.gender = division.gender;
  if (division.capacity !== undefined) payload.capacity = division.capacity;
  if (division.skillLevel !== undefined) payload.skill_level = division.skillLevel;
  if (division.skill_level !== undefined) payload.skill_level = division.skill_level;

  return payload;
};

/**
 * Converts a category object from the backend (snake_case) to frontend format (camelCase)
 */
export const categoryFromBackend = (data: any): CategoryEntity => {
  return {
    id: data.id,
    name: data.name,
    type: data.type as CategoryType,
    divisionId: data.division_id,
    division_id: data.division_id,
    playType: data.play_type as PlayType,
    play_type: data.play_type as PlayType,
    format: data.format,
    capacity: data.capacity,
    createdAt: new Date(data.created_at),
    created_at: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    updated_at: new Date(data.updated_at)
  };
};

/**
 * Converts a category object from frontend format to backend format for API calls
 */
export const categoryToBackend = (category: Partial<CategoryEntity>): Record<string, any> => {
  const payload: Record<string, any> = {};

  if (category.name !== undefined) payload.name = category.name;
  if (category.type !== undefined) payload.type = category.type;
  if (category.divisionId !== undefined) payload.division_id = category.divisionId;
  if (category.division_id !== undefined) payload.division_id = category.division_id;
  if (category.playType !== undefined) payload.play_type = category.playType;
  if (category.play_type !== undefined) payload.play_type = category.play_type;
  if (category.format !== undefined) payload.format = category.format;
  if (category.capacity !== undefined) payload.capacity = category.capacity;

  return payload;
};
