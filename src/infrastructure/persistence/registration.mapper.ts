import { Registration } from '@/domain/models/registration';
import { RegistrationPersistenceDTO } from './registration.persistence';

export class RegistrationMapper {
  static toDomain(dto: RegistrationPersistenceDTO): Registration {
    return {
      id: dto.id,
      tournamentId: dto.tournament_id,
      playerId: dto.player_id,
      divisionId: dto.division_id,
      partnerId: dto.partner_id,
      status: dto.status,
      metadata: dto.metadata ? {
        playerName: dto.metadata.player_name,
        contactEmail: dto.metadata.contact_email,
        teamSize: dto.metadata.team_size,
        waitlistHistory: dto.metadata.waitlist_history?.map(entry => ({
          timestamp: new Date(entry.timestamp),
          reason: entry.reason,
          fromPosition: entry.from_position,
          toPosition: entry.to_position
        })) || []
      } : undefined,
      notes: dto.notes,
      priority: dto.priority,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at)
    };
  }

  static toPersistence(domain: Partial<Registration>): Partial<RegistrationPersistenceDTO> {
    return {
      id: domain.id,
      tournament_id: domain.tournamentId,
      player_id: domain.playerId,
      division_id: domain.divisionId,
      partner_id: domain.partnerId,
      status: domain.status,
      metadata: domain.metadata ? {
        player_name: domain.metadata.playerName,
        contact_email: domain.metadata.contactEmail,
        team_size: domain.metadata.teamSize,
        waitlist_history: domain.metadata.waitlistHistory?.map(entry => ({
          timestamp: entry.timestamp.toISOString(),
          reason: entry.reason,
          from_position: entry.fromPosition,
          to_position: entry.toPosition
        }))
      } : undefined,
      notes: domain.notes,
      priority: domain.priority,
      created_at: domain.createdAt?.toISOString(),
      updated_at: domain.updatedAt?.toISOString()
    };
  }
} 