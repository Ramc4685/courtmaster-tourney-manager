import { BaseRepository } from './base.repository';
import { ProfileDTO } from '@/types/dtos';
import { Profile } from '@/types/models';
import { supabase } from '@/lib/supabase';

export class ProfileRepository extends BaseRepository<ProfileDTO, Profile> {
  constructor() {
    super(supabase, 'profiles');
  }

  protected toDomain(dto: ProfileDTO): Profile {
    return {
      id: dto.id,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      userId: dto.user_id,
      email: dto.email,
      firstName: dto.first_name,
      lastName: dto.last_name,
      phone: dto.phone,
      preferences: dto.preferences
    };
  }

  protected toDTO(model: Partial<Profile>): Partial<ProfileDTO> {
    return {
      id: model.id,
      created_at: model.createdAt,
      updated_at: model.updatedAt,
      user_id: model.userId,
      email: model.email,
      first_name: model.firstName,
      last_name: model.lastName,
      phone: model.phone,
      preferences: model.preferences
    };
  }
} 