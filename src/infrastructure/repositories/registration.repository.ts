import { BaseRepository } from './base.repository';
import { Registration, Comment, WaitlistHistoryEntry } from '../../domain/models/registration';
import { RegistrationResponseDTO, CommentDTO, WaitlistHistoryEntryDTO } from '../dtos/registration.dto';
import { supabaseClient } from '../supabase/client';

export class RegistrationRepository extends BaseRepository<RegistrationResponseDTO, Registration> {
  constructor() {
    super(supabaseClient, 'registrations');
  }

  // ... existing code ...

  async findByTournament(tournamentId: string): Promise<Registration[]> {
    return this.findByField('tournament_id', tournamentId);
  }

  async findByPlayer(playerId: string): Promise<Registration[]> {
    return this.findByField('player_id', playerId);
  }

  async findByDivision(divisionId: string): Promise<Registration[]> {
    return this.findByField('division_id', divisionId);
  }

  protected async findByField<T>(field: string, value: T): Promise<Registration[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq(field, value);

    if (error) throw error;
    return data.map(dto => this.toDomain(dto as RegistrationResponseDTO));
  }

  async updateStatus(id: string, status: string): Promise<Registration> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.toDomain(data as RegistrationResponseDTO);
  }

  async updatePriority(id: string, priority: number): Promise<Registration> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ priority })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.toDomain(data as RegistrationResponseDTO);
  }

  async updateMetadata(id: string, metadata: any): Promise<Registration> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ metadata })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.toDomain(data as RegistrationResponseDTO);
  }
}