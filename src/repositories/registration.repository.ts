import { RegistrationDTO } from '@/types/dtos';
import { Registration } from '@/types/models';
import { BaseRepository } from './base.repository';
import { COLLECTIONS } from '@/lib/appwrite';

export class RegistrationRepository extends BaseRepository<RegistrationDTO, Registration> {
  constructor() {
    super(import.meta.env.VITE_APPWRITE_DATABASE_ID, COLLECTIONS.REGISTRATIONS);
  }

  protected toDomain(dto: RegistrationDTO): Registration {
    return {
      id: dto.id,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
      tournament_id: dto.tournament_id,
      player_id: dto.player_id,
      division_id: dto.division_id,
      partner_id: dto.partner_id,
      status: dto.status,
      metadata: dto.metadata,
      notes: dto.notes,
      priority: dto.priority
    };
  }

  protected toDTO(model: Partial<Registration>): Partial<RegistrationDTO> {
    const dto: Partial<RegistrationDTO> = {};

    if (model.id) dto.id = model.id;
    if (model.createdAt) dto.created_at = model.createdAt.toISOString();
    if (model.updatedAt) dto.updated_at = model.updatedAt.toISOString();
    if (model.tournament_id) dto.tournament_id = model.tournament_id;
    if (model.player_id) dto.player_id = model.player_id;
    if (model.division_id) dto.division_id = model.division_id;
    if (model.partner_id) dto.partner_id = model.partner_id;
    if (model.status) dto.status = model.status;
    if (model.metadata) dto.metadata = model.metadata;
    if (model.notes) dto.notes = model.notes;
    if (model.priority !== undefined) dto.priority = model.priority;

    return dto;
  }

  async findByTournament(tournamentId: string): Promise<Registration[]> {
    return this.findAll({ tournament_id: tournamentId });
  }

  async findByPlayer(playerId: string): Promise<Registration[]> {
    return this.findAll({ player_id: playerId });
  }

  async findByDivision(divisionId: string): Promise<Registration[]> {
    return this.findAll({ division_id: divisionId });
  }

  async updateStatus(id: string, status: string): Promise<Registration> {
    return this.update(id, { status });
  }

  async updatePriority(id: string, priority: number): Promise<Registration> {
    return this.update(id, { priority });
  }

  async updateMetadata(id: string, metadata: Record<string, any>): Promise<Registration> {
    return this.update(id, { metadata });
  }
} 