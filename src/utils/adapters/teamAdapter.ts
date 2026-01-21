import { Division } from '@/types/tournament-enums';
import { Team, Player } from '@/types/tournament.d';

/**
 * Interface for Team with proper typing for both snake_case and camelCase patterns
 */
export interface TeamEntity {
  id: string;
  name: string;
  tournament_id: string;
  tournamentId: string;
  division?: Division;
  division_id?: string;
  divisionId?: string;
  players: PlayerEntity[];
  created_at: Date;
  createdAt: Date;
  updated_at: Date;
  updatedAt: Date;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for Player with proper typing for both snake_case and camelCase patterns
 */
export interface PlayerEntity {
  id: string;
  name: string;
  team_id: string;
  teamId: string;
  email?: string;
  phone?: string;
  profile_id?: string;
  profileId?: string;
  created_at: Date;
  createdAt: Date;
  updated_at: Date;
  updatedAt: Date;
}

/**
 * Converts a team object from the backend (snake_case) to frontend format (camelCase)
 */
export const teamFromBackend = (data: any): TeamEntity => {
  return {
    id: data.id,
    name: data.name,
    tournamentId: data.tournament_id,
    tournament_id: data.tournament_id,
    division: data.division,
    divisionId: data.division_id,
    division_id: data.division_id,
    players: data.players ? data.players.map(playerFromBackend) : [],
    createdAt: new Date(data.created_at),
    created_at: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    updated_at: new Date(data.updated_at),
    description: data.description,
    metadata: data.metadata
  };
};

/**
 * Converts a team object from frontend format to backend format for API calls
 */
export const teamToBackend = (team: Partial<TeamEntity>): Record<string, any> => {
  const payload: Record<string, any> = {};
  
  if (team.name !== undefined) payload.name = team.name;
  if (team.tournamentId !== undefined) payload.tournament_id = team.tournamentId;
  if (team.tournament_id !== undefined) payload.tournament_id = team.tournament_id;
  if (team.division !== undefined) payload.division = team.division;
  if (team.divisionId !== undefined) payload.division_id = team.divisionId;
  if (team.division_id !== undefined) payload.division_id = team.division_id;
  if (team.description !== undefined) payload.description = team.description;
  if (team.metadata !== undefined) payload.metadata = team.metadata;
  
  return payload;
};

/**
 * Converts a player object from the backend (snake_case) to frontend format (camelCase)
 */
export const playerFromBackend = (data: any): PlayerEntity => {
  return {
    id: data.id,
    name: data.name,
    teamId: data.team_id,
    team_id: data.team_id,
    email: data.email,
    phone: data.phone,
    profileId: data.profile_id,
    profile_id: data.profile_id,
    createdAt: new Date(data.created_at),
    created_at: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    updated_at: new Date(data.updated_at)
  };
};

/**
 * Converts a player object from frontend format to backend format for API calls
 */
export const playerToBackend = (player: Partial<PlayerEntity>): Record<string, any> => {
  const payload: Record<string, any> = {};
  
  if (player.name !== undefined) payload.name = player.name;
  if (player.teamId !== undefined) payload.team_id = player.teamId;
  if (player.team_id !== undefined) payload.team_id = player.team_id;
  if (player.email !== undefined) payload.email = player.email;
  if (player.phone !== undefined) payload.phone = player.phone;
  if (player.profileId !== undefined) payload.profile_id = player.profileId;
  if (player.profile_id !== undefined) payload.profile_id = player.profile_id;
  
  return payload;
};
