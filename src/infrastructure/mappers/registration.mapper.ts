import { Registration, RegistrationMetadata } from '../../domain/models/registration';
import { RegistrationPersistenceDTO } from '../persistence/registration.persistence';

export class RegistrationMapper {
  static toDomain(dto: RegistrationPersistenceDTO): Registration {
    return {
      id: dto.id,
      tournamentId: dto.tournament_id,
      playerId: dto.player_id,
      divisionId: dto.division_id,
      partnerId: dto.partner_id,
      status: dto.status,
      metadata: dto.metadata ? this.mapMetadataToDomain(dto.metadata) : undefined,
      notes: dto.notes,
      priority: dto.priority,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at)
    };
  }

  static toPersistence(domain: Registration): Omit<RegistrationPersistenceDTO, 'id' | 'created_at' | 'updated_at'> {
    return {
      tournament_id: domain.tournamentId,
      player_id: domain.playerId,
      division_id: domain.divisionId,
      partner_id: domain.partnerId,
      status: domain.status,
      metadata: domain.metadata ? this.mapMetadataToPersistence(domain.metadata) : undefined,
      notes: domain.notes,
      priority: domain.priority
    };
  }

  private static mapMetadataToDomain(persistenceMetadata: any): RegistrationMetadata {
    return {
      playerName: persistenceMetadata.player_name,
      contactEmail: persistenceMetadata.contact_email,
      teamSize: persistenceMetadata.team_size,
      waitlistHistory: persistenceMetadata.waitlist_history?.map((entry: any) => ({
        timestamp: new Date(entry.timestamp),
        reason: entry.reason,
        fromPosition: entry.from_position,
        toPosition: entry.to_position
      }))
    };
  }

  private static mapMetadataToPersistence(domainMetadata: RegistrationMetadata): any {
    return {
      player_name: domainMetadata.playerName,
      contact_email: domainMetadata.contactEmail,
      team_size: domainMetadata.teamSize,
      waitlist_history: domainMetadata.waitlistHistory?.map(entry => ({
        timestamp: entry.timestamp.toISOString(),
        reason: entry.reason,
        from_position: entry.fromPosition,
        to_position: entry.toPosition
      }))
    };
  }
} 