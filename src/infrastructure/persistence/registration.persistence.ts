import { BaseDTO } from '../repositories/base.repository';
import { Registration, RegistrationStatus, RegistrationMetadata } from '@/domain/models/registration';
import { Json } from '@/types/supabase';

export interface RegistrationPersistenceDTO extends BaseDTO {
  tournament_id: string;
  player_id: string | null;
  division_id: string | null;
  partner_id: string | null;
  status: string;
  metadata: Json;
  notes: string | null;
  priority: number;
  type: string;
}

export function toDomain(dto: RegistrationPersistenceDTO): Registration {
  return {
    id: dto.id,
    createdAt: new Date(dto.created_at),
    updatedAt: new Date(dto.updated_at),
    tournamentId: dto.tournament_id,
    playerId: dto.player_id,
    divisionId: dto.division_id,
    partnerId: dto.partner_id,
    status: dto.status as RegistrationStatus,
    metadata: dto.metadata as RegistrationMetadata,
    notes: dto.notes,
    priority: dto.priority,
    type: dto.type as 'INDIVIDUAL' | 'TEAM'
  };
}

export function toDTO(entity: Partial<Registration>): Partial<RegistrationPersistenceDTO> {
  const dto: Partial<RegistrationPersistenceDTO> = {};

  if (entity.tournamentId !== undefined) dto.tournament_id = entity.tournamentId;
  if (entity.playerId !== undefined) dto.player_id = entity.playerId;
  if (entity.divisionId !== undefined) dto.division_id = entity.divisionId;
  if (entity.partnerId !== undefined) dto.partner_id = entity.partnerId;
  if (entity.status !== undefined) dto.status = entity.status;
  if (entity.metadata !== undefined) dto.metadata = entity.metadata as Json;
  if (entity.notes !== undefined) dto.notes = entity.notes;
  if (entity.priority !== undefined) dto.priority = entity.priority;
  if (entity.type !== undefined) dto.type = entity.type;

  return dto;
}