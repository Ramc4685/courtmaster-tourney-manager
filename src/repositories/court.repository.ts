import { CourtDTO } from '@/types/dtos';
import { Court } from '@/types/models';
import { BaseRepository } from './base.repository';
import { COLLECTIONS } from '@/lib/appwrite';

export class CourtRepository extends BaseRepository<CourtDTO, Court> {
  constructor() {
    super(import.meta.env.VITE_APPWRITE_DATABASE_ID, COLLECTIONS.COURTS);
  }

  protected toDomain(dto: CourtDTO): Court {
    return {
      id: dto.id,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
      tournament_id: dto.tournament_id,
      name: dto.name,
      status: dto.status,
      metadata: dto.metadata
    };
  }

  protected toDTO(model: Partial<Court>): Partial<CourtDTO> {
    const dto: Partial<CourtDTO> = {};

    if (model.id) dto.id = model.id;
    if (model.createdAt) dto.created_at = model.createdAt.toISOString();
    if (model.updatedAt) dto.updated_at = model.updatedAt.toISOString();
    if (model.tournament_id) dto.tournament_id = model.tournament_id;
    if (model.name) dto.name = model.name;
    if (model.status) dto.status = model.status;
    if (model.metadata) dto.metadata = model.metadata;

    return dto;
  }
}
