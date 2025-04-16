import { Profile, ProfilePreferences } from '@/types/models';
import { ProfileRepository } from '@/repositories/profile.repository';

export class ProfileService {
  private repository: ProfileRepository;

  constructor() {
    this.repository = new ProfileRepository();
  }

  async findById(id: string): Promise<Profile | null> {
    return this.repository.findById(id);
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const profiles = await this.repository.findAll({
      filters: { user_id: userId }
    });
    return profiles[0] || null;
  }

  async update(id: string, data: Partial<Profile>): Promise<Profile> {
    return this.repository.update(id, data);
  }

  async updatePreferences(id: string, preferences: Partial<ProfilePreferences>): Promise<Profile> {
    const profile = await this.findById(id);
    if (!profile) {
      throw new Error(`Profile not found: ${id}`);
    }

    return this.update(id, {
      preferences: {
        ...profile.preferences,
        ...preferences
      }
    });
  }
} 