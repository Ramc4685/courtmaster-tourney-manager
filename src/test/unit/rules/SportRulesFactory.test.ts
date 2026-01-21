import { describe, it, expect, vi, beforeEach } from 'vitest';
import sportRulesFactory from '@/services/rules/SportRulesFactory';
import { BadmintonRules } from '@/domain/rules/BadmintonRules';
import { TennisRules } from '@/domain/rules/TennisRules';
import { VolleyballRules } from '@/domain/rules/VolleyballRules';

// Mock the rule classes
vi.mock('@/domain/rules/BadmintonRules');
vi.mock('@/domain/rules/TennisRules');
vi.mock('@/domain/rules/VolleyballRules');

describe('SportRulesFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAvailableSports', () => {
    it('should return correct metadata for all registered sports', () => {
      const sports = sportRulesFactory.getAvailableSports();

      expect(sports).toHaveLength(3);

      const badminton = sports.find(s => s.id === 'badminton');
      expect(badminton).toMatchObject({
        id: 'badminton',
        name: 'Badminton',
        type: 'racquet',
        teamSizes: expect.any(Array),
        formats: expect.any(Array),
        defaultSettings: expect.any(Object),
        isTeamSport: false
      });

      const tennis = sports.find(s => s.id === 'tennis');
      expect(tennis).toMatchObject({
        id: 'tennis',
        name: 'Tennis',
        type: 'racquet',
        teamSizes: expect.any(Array),
        formats: expect.any(Array),
        defaultSettings: expect.any(Object),
        isTeamSport: false
      });

      const volleyball = sports.find(s => s.id === 'volleyball');
      expect(volleyball).toMatchObject({
        id: 'volleyball',
        name: 'Volleyball',
        type: 'team',
        teamSizes: expect.any(Array),
        formats: expect.any(Array),
        defaultSettings: expect.any(Object),
        isTeamSport: true
      });
    });

    it('should return sports with correct sport types', () => {
      const sports = sportRulesFactory.getAvailableSports();

      const racquetSports = sports.filter(s => s.type === 'racquet');
      const teamSports = sports.filter(s => s.type === 'team');

      expect(racquetSports).toHaveLength(2);
      expect(teamSports).toHaveLength(1);

      expect(racquetSports.map(s => s.id)).toEqual(expect.arrayContaining(['badminton', 'tennis']));
      expect(teamSports.map(s => s.id)).toEqual(expect.arrayContaining(['volleyball']));
    });
  });

  describe('getRules', () => {
    it('should return rules instance for badminton sport', () => {
      const rules = sportRulesFactory.getRules('badminton');
      expect(rules).toBeTruthy();
      expect(rules?.sportId).toBe('badminton');
    });

    it('should return rules instance for tennis sport', () => {
      const rules = sportRulesFactory.getRules('tennis');
      expect(rules).toBeTruthy();
      expect(rules?.sportId).toBe('tennis');
    });

    it('should return rules instance for volleyball sport', () => {
      const rules = sportRulesFactory.getRules('volleyball');
      expect(rules).toBeTruthy();
      expect(rules?.sportId).toBe('volleyball');
    });

    it('should return null for unknown sport', () => {
      const rules = sportRulesFactory.getRules('unknown');
      expect(rules).toBeNull();
    });

    it('should return null for null or undefined sport', () => {
      const rules1 = sportRulesFactory.getRules(null as any);
      expect(rules1).toBeNull();

      const rules2 = sportRulesFactory.getRules(undefined as any);
      expect(rules2).toBeNull();
    });
  });

  describe('createRules', () => {
    it('should create rules with valid sport and format combination', () => {
      const rules = sportRulesFactory.createRules('badminton', 'standard');
      expect(rules).toBeTruthy();
      expect(rules?.sportId).toBe('badminton');
    });

    it('should create rules without format specification', () => {
      const rules = sportRulesFactory.createRules('tennis');
      expect(rules).toBeTruthy();
      expect(rules?.sportId).toBe('tennis');
    });

    it('should return null for unsupported format', () => {
      const rules = sportRulesFactory.createRules('badminton', 'UNSUPPORTED_FORMAT');
      expect(rules).toBeNull();
    });

    it('should return null for unknown sport with format', () => {
      const rules = sportRulesFactory.createRules('unknown', 'standard');
      expect(rules).toBeNull();
    });
  });

  describe('validateSettings', () => {
    const mockTournamentSettings = {
      formatId: 'standard',
      teamSize: 1,
      setsToWin: 2,
      pointsToWin: 21
    };

    it('should validate settings with correct sport and format', () => {
      const result = sportRulesFactory.validateSettings('badminton', mockTournamentSettings);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return error for unknown sport', () => {
      const result = sportRulesFactory.validateSettings('unknown', mockTournamentSettings);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Sport 'unknown' not found");
    });

    it('should return error for unsupported format', () => {
      const settings = { ...mockTournamentSettings, formatId: 'UNSUPPORTED' };
      const result = sportRulesFactory.validateSettings('badminton', settings);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Format 'UNSUPPORTED' not found for sport 'badminton'");
    });

    it('should return error for invalid team size', () => {
      const settings = { ...mockTournamentSettings, teamSize: 5 }; // Too large for badminton
      const result = sportRulesFactory.validateSettings('badminton', settings);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate volleyball team size correctly', () => {
      const volleyballSettings = {
        ...mockTournamentSettings,
        teamSize: 6
      };

      const result = sportRulesFactory.validateSettings('volleyball', volleyballSettings);
      expect(result.valid).toBe(true);
    });
  });

  describe('integration tests', () => {
    it('should provide complete sport metadata through getAvailableSports', () => {
      const sports = sportRulesFactory.getAvailableSports();

      for (const sport of sports) {
        expect(sport).toHaveProperty('id');
        expect(sport).toHaveProperty('name');
        expect(sport).toHaveProperty('type');
        expect(sport).toHaveProperty('teamSizes');
        expect(sport).toHaveProperty('formats');
        expect(sport).toHaveProperty('defaultSettings');
        expect(sport).toHaveProperty('isTeamSport');

        // Verify we can get rules for each sport
        const rules = sportRulesFactory.getRules(sport.id);
        expect(rules).toBeTruthy();
        expect(rules?.sportId).toBe(sport.id);
      }
    });

    it('should validate settings correctly for different sports', () => {
      const validBadmintonSettings = { formatId: 'standard', teamSize: 1 };
      const validVolleyballSettings = { formatId: 'standard', teamSize: 6 };

      const badmintonResult = sportRulesFactory.validateSettings('badminton', validBadmintonSettings);
      const volleyballResult = sportRulesFactory.validateSettings('volleyball', validVolleyballSettings);

      expect(badmintonResult.valid).toBe(true);
      expect(volleyballResult.valid).toBe(true);
    });
  });
});
