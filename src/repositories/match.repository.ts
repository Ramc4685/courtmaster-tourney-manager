import { MatchDTO } from '@/types/dtos';
import { Match } from '@/types/models';
import { BaseRepository } from './base.repository';
import { COLLECTIONS } from '@/lib/appwrite';

export class MatchRepository extends BaseRepository<MatchDTO, Match> {
  constructor() {
    super(import.meta.env.VITE_APPWRITE_DATABASE_ID, COLLECTIONS.MATCHES);
  }

  protected toDomain(dto: MatchDTO): Match {
    return {
      id: dto.id,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
      tournament_id: dto.tournament_id,
      round_number: dto.round_number,
      match_number: dto.match_number,
      scheduled_time: dto.scheduled_time,
      player1_id: dto.player1_id,
      player2_id: dto.player2_id,
      team1_id: dto.team1_id,
      team2_id: dto.team2_id,
      winner_id: dto.winner_id,
      status: dto.status,
      court_id: dto.court_id,
      metadata: dto.metadata
    };
  }

  protected toDTO(model: Partial<Match>): Partial<MatchDTO> {
    const dto: Partial<MatchDTO> = {};

    if (model.id) dto.id = model.id;
    if (model.createdAt) dto.created_at = model.createdAt.toISOString();
    if (model.updatedAt) dto.updated_at = model.updatedAt.toISOString();
    if (model.tournament_id) dto.tournament_id = model.tournament_id;
    if (model.round_number !== undefined) dto.round_number = model.round_number;
    if (model.match_number !== undefined) dto.match_number = model.match_number;
    if (model.scheduled_time) dto.scheduled_time = model.scheduled_time;
    if (model.player1_id) dto.player1_id = model.player1_id;
    if (model.player2_id) dto.player2_id = model.player2_id;
    if (model.team1_id) dto.team1_id = model.team1_id;
    if (model.team2_id) dto.team2_id = model.team2_id;
    if (model.winner_id) dto.winner_id = model.winner_id;
    if (model.status) dto.status = model.status;
    if (model.court_id) dto.court_id = model.court_id;
    if (model.metadata) dto.metadata = model.metadata;

    return dto;
  }
}
