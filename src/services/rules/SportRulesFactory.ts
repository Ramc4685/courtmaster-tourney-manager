/**
 * Sport Rules Factory for CourtMaster Tournament Management System
 * 
 * Creates and manages sport-specific rule implementations based on tournament settings.
 * Provides methods to get available sports, create rule instances, and validate settings.
 */

import { ISportRules, IRacquetSportRules, ITeamSportRules, IIndividualSportRules } from '../../domain/rules/ISportRules';
import BadmintonRules from '../../domain/rules/BadmintonRules';
import TennisRules from '../../domain/rules/TennisRules';
import VolleyballRules from '../../domain/rules/VolleyballRules';

// Sport metadata interface
export interface SportMetadata {
  id: string;
  name: string;
  description: string;
  type: 'racquet' | 'team' | 'individual';
  icon?: string;
  teamSizes: number[];
  formats: {
    id: string;
    name: string;
    description: string;
  }[];
  defaultSettings: Record<string, any>;
  isTeamSport: boolean;
}

/**
 * Factory class for creating and managing sport rule implementations
 */
class SportRulesFactory {
  private sportRules: Map<string, ISportRules> = new Map();
  
  constructor() {
    // Register available sport implementations
    this.registerSport(BadmintonRules);
    this.registerSport(TennisRules);
    this.registerSport(VolleyballRules);
  }
  
  /**
   * Register a sport rule implementation with the factory
   */
  private registerSport(rules: ISportRules): void {
    this.sportRules.set(rules.sportId, rules);
  }
  
  /**
   * Get sport rules for a specific sport by ID
   */
  getRules(sportId: string): ISportRules | null {
    return this.sportRules.get(sportId) || null;
  }
  
  /**
   * Get all available sports
   */
  getAvailableSports(): SportMetadata[] {
    const sports: SportMetadata[] = [];
    
    this.sportRules.forEach(rules => {
      const type = this.getSportType(rules);
      
      const metadata: SportMetadata = {
        id: rules.sportId,
        name: rules.sportName,
        description: rules.sportDescription,
        type,
        teamSizes: this.getTeamSizes(rules),
        formats: rules.formats.map(format => ({
          id: format.id,
          name: format.name,
          description: format.description
        })),
        defaultSettings: this.getDefaultSettings(rules),
        isTeamSport: rules.isTeamSport
      };
      
      sports.push(metadata);
    });
    
    return sports;
  }
  
  /**
   * Create a rules instance based on sport ID and optional format
   */
  createRules(sportId: string, formatId?: string): ISportRules | null {
    const rules = this.getRules(sportId);
    
    if (!rules) {
      console.error(`Sport '${sportId}' not found`);
      return null;
    }
    
    // If a format ID is provided, validate it
    if (formatId && !rules.getFormat(formatId)) {
      console.error(`Format '${formatId}' not found for sport '${sportId}'`);
      return null;
    }
    
    return rules;
  }
  
  /**
   * Validate sport-specific tournament settings
   */
  validateSettings(sportId: string, settings: Record<string, any>): {
    valid: boolean;
    errors: string[];
  } {
    const rules = this.getRules(sportId);
    const errors: string[] = [];
    
    if (!rules) {
      return {
        valid: false,
        errors: [`Sport '${sportId}' not found`]
      };
    }
    
    // Validate format if provided
    if (settings.formatId && !rules.getFormat(settings.formatId)) {
      errors.push(`Format '${settings.formatId}' not found for sport '${sportId}'`);
    }
    
    // Validate team size if provided
    if (settings.teamSize !== undefined) {
      const minTeamSize = rules.teamSize;
      const maxTeamSize = rules.maxTeamSize || rules.teamSize;
      
      if (settings.teamSize < minTeamSize || settings.teamSize > maxTeamSize) {
        errors.push(`Team size must be between ${minTeamSize} and ${maxTeamSize} for ${rules.sportName}`);
      }
    }
    
    // For team sports, validate minimum players
    if (rules.isTeamSport && settings.minimumPlayers !== undefined) {
      const teamRules = rules as ITeamSportRules;
      
      if (settings.minimumPlayers < teamRules.minimumPlayers) {
        errors.push(`Minimum players must be at least ${teamRules.minimumPlayers} for ${rules.sportName}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get the default settings for a sport
   */
  getDefaultSettings(rules: ISportRules): Record<string, any> {
    const defaultFormat = rules.getFormat(rules.defaultFormatId);
    
    const settings: Record<string, any> = {
      formatId: rules.defaultFormatId,
      teamSize: rules.teamSize,
      isTeamSport: rules.isTeamSport
    };
    
    if (defaultFormat) {
      settings.pointsToWinSet = defaultFormat.pointsToWinSet;
      settings.minimumPointDifferential = defaultFormat.minimumPointDifferential;
      settings.setCount = defaultFormat.setCount;
      settings.setsToWin = Math.ceil(defaultFormat.setCount / 2);
      
      if (defaultFormat.allowTiebreaker) {
        settings.allowTiebreaker = true;
        settings.tiebreakerPoints = defaultFormat.tiebreakerPoints;
      }
    }
    
    // Add sport-specific settings based on type
    if (this.getSportType(rules) === 'racquet') {
      const racquetRules = rules as IRacquetSportRules;
      settings.hasAlternatingServe = racquetRules.hasAlternatingServe;
    } else if (this.getSportType(rules) === 'team') {
      const teamRules = rules as ITeamSportRules;
      settings.minimumPlayers = teamRules.minimumPlayers;
      settings.allowsSubstitutions = teamRules.allowsSubstitutions;
      
      if (teamRules.maxSubstitutions) {
        settings.maxSubstitutions = teamRules.maxSubstitutions;
      }
    }
    
    return settings;
  }
  
  /**
   * Get the type of sport (racquet, team, or individual)
   */
  private getSportType(rules: ISportRules): 'racquet' | 'team' | 'individual' {
    if ('hasAlternatingServe' in rules) {
      return 'racquet';
    } else if ('minimumPlayers' in rules) {
      return 'team';
    } else {
      return 'individual';
    }
  }
  
  /**
   * Get the possible team sizes for a sport
   */
  private getTeamSizes(rules: ISportRules): number[] {
    if (rules.maxTeamSize && rules.maxTeamSize > rules.teamSize) {
      // Create array of possible team sizes from min to max
      const sizes: number[] = [];
      for (let size = rules.teamSize; size <= rules.maxTeamSize; size++) {
        sizes.push(size);
      }
      return sizes;
    }
    
    // For fixed team size sports
    return [rules.teamSize];
  }
}

export default new SportRulesFactory();
