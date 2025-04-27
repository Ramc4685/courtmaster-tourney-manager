
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/entities';
import { UserRole } from '@/types/tournament-enums';

export class ProfileService {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No profile found
      }
      throw error;
    }
    
    return {
      id: data.id,
      name: data.full_name || data.display_name || data.email.split('@')[0],
      full_name: data.full_name || '',
      display_name: data.display_name || '',
      email: data.email,
      phone: data.phone,
      avatar_url: data.avatar_url,
      role: data.role as UserRole || UserRole.PLAYER,
      player_details: data.player_details,
      player_stats: data.player_stats,
      preferences: data.preferences,
      social_links: data.social_links,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }
  
  async updateProfile(userId: string, profileData: Partial<Profile>): Promise<Profile> {
    const payload: any = {};
    
    if (profileData.full_name !== undefined) payload.full_name = profileData.full_name;
    if (profileData.display_name !== undefined) payload.display_name = profileData.display_name;
    if (profileData.phone !== undefined) payload.phone = profileData.phone;
    if (profileData.avatar_url !== undefined) payload.avatar_url = profileData.avatar_url;
    if (profileData.player_details !== undefined) payload.player_details = profileData.player_details;
    if (profileData.preferences !== undefined) payload.preferences = profileData.preferences;
    if (profileData.social_links !== undefined) payload.social_links = profileData.social_links;
    
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.full_name || data.display_name || data.email.split('@')[0],
      full_name: data.full_name || '',
      display_name: data.display_name || '',
      email: data.email,
      phone: data.phone,
      avatar_url: data.avatar_url,
      role: data.role as UserRole || UserRole.PLAYER,
      player_details: data.player_details,
      player_stats: data.player_stats,
      preferences: data.preferences,
      social_links: data.social_links,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }
}

// Export a singleton instance
export const profileService = new ProfileService();
