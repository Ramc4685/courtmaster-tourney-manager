
import { Court } from '@/types/entities';
import { CourtStatus } from '@/types/tournament-enums';

/**
 * Converts a court object from the backend (snake_case) to frontend format (camelCase)
 */
export const courtFromBackend = (data: any): Court => {
  return {
    id: data.id,
    name: data.name,
    courtNumber: data.court_number,
    court_number: data.court_number, // For backward compatibility
    status: data.status as CourtStatus,
    description: data.description || '',
    tournamentId: data.tournament_id,
    tournament_id: data.tournament_id, // For backward compatibility
    createdAt: new Date(data.created_at),
    created_at: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    updated_at: new Date(data.updated_at)
  };
};

/**
 * Converts a court object from frontend format to backend format for API calls
 */
export const courtToBackend = (court: Partial<Court>): Record<string, any> => {
  const payload: Record<string, any> = {};
  
  if (court.name !== undefined) payload.name = court.name;
  if (court.courtNumber !== undefined) payload.court_number = court.courtNumber;
  if (court.court_number !== undefined) payload.court_number = court.court_number;
  if (court.status !== undefined) payload.status = court.status;
  if (court.description !== undefined) payload.description = court.description;
  if (court.tournamentId !== undefined) payload.tournament_id = court.tournamentId;
  if (court.tournament_id !== undefined) payload.tournament_id = court.tournament_id;
  
  return payload;
};
