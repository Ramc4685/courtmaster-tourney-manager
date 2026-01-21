/**
 * Tournament Template Service for CourtMaster Tournament Management System
 * 
 * Provides functionality for:
 * - Creating tournament templates from existing tournaments
 * - Applying templates to new tournaments
 * - Managing template categories by sport type
 * - CRUD operations for tournament templates
 */

import { ID, Models, Query } from 'appwrite';
import { databases, COLLECTIONS, APPWRITE_DATABASE_ID } from '../../lib/appwrite';
import eventBus, { EventType } from '../../events/eventBus';

// Template model
export interface TournamentTemplate {
  id: string;
  name: string;
  description: string;
  sport_type: string;
  created_by: string;
  settings: TournamentTemplateSettings;
  format: string;
  categories: string[];
  is_public: boolean;
  usage_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// Template settings structure
export interface TournamentTemplateSettings {
  divisions?: TemplateDivision[];
  scoring_rules?: {
    points_per_set: number;
    sets_to_win: number;
    points_to_win_set: number;
    point_differential?: number;
    tiebreaker_rules?: any;
    [key: string]: any;
  };
  schedule_settings?: {
    court_count: number;
    match_duration_minutes: number;
    break_between_matches_minutes: number;
    max_matches_per_player_per_day?: number;
    start_time?: string;
    end_time?: string;
    daily_schedule?: any[];
    [key: string]: any;
  };
  registration_settings?: {
    allow_self_registration: boolean;
    registration_deadline_days_before?: number;
    max_participants_per_division?: number;
    waiting_list_enabled?: boolean;
    require_waiver?: boolean;
    custom_fields?: any[];
    [key: string]: any;
  };
  [key: string]: any;
}

// Template division structure
export interface TemplateDivision {
  name: string;
  type: string;
  skill_level?: string;
  gender?: string;
  min_age?: number;
  max_age?: number;
  format?: string;
  max_participants?: number;
  [key: string]: any;
}

// Template creation request
export interface TemplateCreateRequest {
  name: string;
  description: string;
  sport_type: string;
  created_by: string;
  settings: TournamentTemplateSettings;
  format?: string;
  categories?: string[];
  is_public?: boolean;
  tags?: string[];
}

// Template search options
export interface TemplateSearchOptions {
  sport_type?: string;
  created_by?: string;
  is_public?: boolean;
  tags?: string[];
  limit?: number;
  offset?: number;
  search_term?: string;
}

/**
 * Tournament Template Service
 */
class TemplateService {
  /**
   * Create a new template
   */
  async createTemplate(request: TemplateCreateRequest): Promise<TournamentTemplate> {
    try {
      const templateData = {
        name: request.name,
        description: request.description,
        sport_type: request.sport_type,
        created_by: request.created_by,
        settings: JSON.stringify(request.settings),
        format: request.format || '',
        categories: JSON.stringify(request.categories || []),
        is_public: request.is_public ?? false,
        usage_count: 0,
        tags: JSON.stringify(request.tags || [])
      };
      
      const response = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.TOURNAMENT_TEMPLATES,
        ID.unique(),
        templateData
      );
      
      return this.mapTemplateFromResponse(response);
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }
  
  /**
   * Get a template by ID
   */
  async getTemplate(templateId: string): Promise<TournamentTemplate> {
    try {
      const response = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.TOURNAMENT_TEMPLATES,
        templateId
      );
      
      return this.mapTemplateFromResponse(response);
    } catch (error) {
      console.error(`Error getting template with ID ${templateId}:`, error);
      throw error;
    }
  }
  
  /**
   * Update an existing template
   */
  async updateTemplate(templateId: string, updates: Partial<TemplateCreateRequest>): Promise<TournamentTemplate> {
    try {
      const updateData: Record<string, any> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.sport_type !== undefined) updateData.sport_type = updates.sport_type;
      if (updates.format !== undefined) updateData.format = updates.format;
      if (updates.is_public !== undefined) updateData.is_public = updates.is_public;
      if (updates.settings !== undefined) updateData.settings = JSON.stringify(updates.settings);
      if (updates.categories !== undefined) updateData.categories = JSON.stringify(updates.categories);
      if (updates.tags !== undefined) updateData.tags = JSON.stringify(updates.tags);
      
      const response = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.TOURNAMENT_TEMPLATES,
        templateId,
        updateData
      );
      
      return this.mapTemplateFromResponse(response);
    } catch (error) {
      console.error(`Error updating template with ID ${templateId}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.TOURNAMENT_TEMPLATES,
        templateId
      );
      return true;
    } catch (error) {
      console.error(`Error deleting template with ID ${templateId}:`, error);
      return false;
    }
  }
  
  /**
   * Search for templates
   */
  async searchTemplates(options: TemplateSearchOptions = {}): Promise<{ templates: TournamentTemplate[]; total: number }> {
    try {
      const {
        sport_type,
        created_by,
        is_public,
        tags,
        limit = 20,
        offset = 0,
        search_term
      } = options;
      
      const queries = [
        Query.limit(limit),
        Query.offset(offset)
      ];
      
      if (sport_type) {
        queries.push(Query.equal('sport_type', sport_type));
      }
      
      if (created_by) {
        queries.push(Query.equal('created_by', created_by));
      }
      
      if (is_public !== undefined) {
        queries.push(Query.equal('is_public', is_public));
      }
      
      // For now, we'll search in the name field only since Appwrite doesn't support full-text search
      if (search_term) {
        queries.push(Query.search('name', search_term));
      }
      
      // Advanced tag filtering will be handled in-memory since we're storing them as JSON strings
      
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.TOURNAMENT_TEMPLATES,
        queries
      );
      
      let templates = response.documents.map(doc => this.mapTemplateFromResponse(doc));
      
      // Filter by tags if provided (client-side filtering)
      if (tags && tags.length > 0) {
        templates = templates.filter(template => {
          const templateTags = template.tags || [];
          return tags.some(tag => templateTags.includes(tag));
        });
      }
      
      return {
        templates,
        total: response.total
      };
    } catch (error) {
      console.error('Error searching templates:', error);
      throw error;
    }
  }
  
  /**
   * Create a template from an existing tournament
   */
  async createTemplateFromTournament(
    tournamentId: string,
    templateName: string,
    templateDescription: string,
    userId: string,
    options: {
      is_public?: boolean;
      categories?: string[];
      tags?: string[];
    } = {}
  ): Promise<TournamentTemplate> {
    try {
      // Fetch the tournament data
      const tournament = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        tournamentId
      );
      
      if (!tournament) {
        throw new Error(`Tournament with ID ${tournamentId} not found`);
      }
      
      // Fetch tournament divisions
      const divisionsResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.DIVISIONS,
        [Query.equal('tournament_id', tournamentId)]
      );
      
      const divisions = divisionsResponse.documents.map(div => ({
        name: div.name,
        type: div.type,
        skill_level: div.skill_level,
        gender: div.gender,
        min_age: div.min_age,
        max_age: div.max_age
      }));
      
      // Extract tournament settings
      const settings: TournamentTemplateSettings = {
        divisions: divisions,
        scoring_rules: tournament.scoring_rules ? JSON.parse(tournament.scoring_rules) : undefined,
        schedule_settings: tournament.schedule_settings ? JSON.parse(tournament.schedule_settings) : undefined,
        registration_settings: tournament.registration_settings ? JSON.parse(tournament.registration_settings) : undefined
      };
      
      // Create template request
      const templateRequest: TemplateCreateRequest = {
        name: templateName,
        description: templateDescription,
        sport_type: tournament.sport_type || 'badminton', // Default to badminton if not specified
        created_by: userId,
        settings: settings,
        format: tournament.format || 'single_elimination',
        categories: options.categories || [],
        is_public: options.is_public || false,
        tags: options.tags || []
      };
      
      return this.createTemplate(templateRequest);
    } catch (error) {
      console.error(`Error creating template from tournament ${tournamentId}:`, error);
      throw error;
    }
  }
  
  /**
   * Apply a template to create a new tournament
   */
  async applyTemplateToTournament(
    templateId: string,
    tournamentBaseData: {
      name: string;
      description?: string;
      start_date: string;
      end_date: string;
      venue?: string;
      organizer_id: string;
    }
  ): Promise<string> {
    try {
      // Fetch the template
      const template = await this.getTemplate(templateId);
      
      // Create the tournament with template settings
      const tournamentData = {
        name: tournamentBaseData.name,
        description: tournamentBaseData.description || template.description,
        start_date: tournamentBaseData.start_date,
        end_date: tournamentBaseData.end_date,
        venue: tournamentBaseData.venue || '',
        organizer_id: tournamentBaseData.organizer_id,
        status: 'draft',
        sport_type: template.sport_type,
        format: template.format,
        scoring_rules: JSON.stringify(template.settings.scoring_rules || {}),
        schedule_settings: JSON.stringify(template.settings.schedule_settings || {}),
        registration_settings: JSON.stringify(template.settings.registration_settings || {}),
        template_id: templateId
      };
      
      const tournamentResponse = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        ID.unique(),
        tournamentData
      );
      
      const tournamentId = tournamentResponse.$id;
      
      // Create divisions from template
      if (template.settings.divisions && template.settings.divisions.length > 0) {
        for (const division of template.settings.divisions) {
          await databases.createDocument(
            APPWRITE_DATABASE_ID,
            COLLECTIONS.DIVISIONS,
            ID.unique(),
            {
              tournament_id: tournamentId,
              name: division.name,
              type: division.type,
              skill_level: division.skill_level || null,
              gender: division.gender || null,
              min_age: division.min_age || null,
              max_age: division.max_age || null
            }
          );
        }
      }
      
      // Increment usage count for the template
      await this.incrementTemplateUsage(templateId);
      
      // Emit tournament created event
      eventBus.emit(EventType.TOURNAMENT_CREATED, {
        tournamentId,
        name: tournamentBaseData.name,
        organizerId: tournamentBaseData.organizer_id,
        fromTemplateId: templateId
      }, 'TemplateService');
      
      return tournamentId;
    } catch (error) {
      console.error(`Error applying template ${templateId} to new tournament:`, error);
      throw error;
    }
  }
  
  /**
   * Increment the usage count for a template
   */
  private async incrementTemplateUsage(templateId: string): Promise<void> {
    try {
      const template = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.TOURNAMENT_TEMPLATES,
        templateId
      );
      
      const currentUsageCount = template.usage_count || 0;
      
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.TOURNAMENT_TEMPLATES,
        templateId,
        { usage_count: currentUsageCount + 1 }
      );
    } catch (error) {
      console.error(`Error incrementing usage count for template ${templateId}:`, error);
      // We don't want to throw an error here as it's not critical
    }
  }
  
  /**
   * Map Appwrite response to TournamentTemplate interface
   */
  private mapTemplateFromResponse(response: Models.Document): TournamentTemplate {
    return {
      id: response.$id,
      name: response.name,
      description: response.description,
      sport_type: response.sport_type,
      created_by: response.created_by,
      settings: JSON.parse(response.settings),
      format: response.format,
      categories: JSON.parse(response.categories || '[]'),
      is_public: response.is_public,
      usage_count: response.usage_count || 0,
      tags: JSON.parse(response.tags || '[]'),
      created_at: response.$createdAt,
      updated_at: response.$updatedAt
    };
  }
}

export default new TemplateService();
