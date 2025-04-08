import {
  validateScore,
  isSetComplete,
  getSetWinner,
  createScoreAuditLog,
  getDefaultScoringSettings
} from '../scoringRules';
import { MatchScore, ScoringSettings } from '@/types/scoring';

describe('scoringRules', () => {
  describe('validateScore', () => {
    const defaultSettings: ScoringSettings = {
      maxPoints: 21,
      requireTwoPointLead: true,
      maxTwoPointLeadScore: 30,
      maxSets: 3,
      setsToWin: 2
    };

    it('validates a valid score', () => {
      const score: MatchScore = {
        team1Score: 21,
        team2Score: 19,
        isComplete: false,
        winner: null,
        duration: 0,
        auditLogs: []
      };

      const result = validateScore(score, defaultSettings);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects negative scores', () => {
      const score: MatchScore = {
        team1Score: -1,
        team2Score: 19,
        isComplete: false,
        winner: null,
        duration: 0,
        auditLogs: []
      };

      const result = validateScore(score, defaultSettings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Scores cannot be negative');
    });

    it('detects scores exceeding maximum points', () => {
      const score: MatchScore = {
        team1Score: 31,
        team2Score: 19,
        isComplete: false,
        winner: null,
        duration: 0,
        auditLogs: []
      };

      const result = validateScore(score, defaultSettings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Score cannot exceed 30 points');
    });
  });

  describe('isSetComplete', () => {
    const defaultSettings: ScoringSettings = {
      maxPoints: 21,
      requireTwoPointLead: true,
      maxTwoPointLeadScore: 30,
      maxSets: 3,
      setsToWin: 2
    };

    it('determines when a set is complete with two-point lead', () => {
      expect(isSetComplete(21, 19, defaultSettings)).toBe(true);
      expect(isSetComplete(19, 21, defaultSettings)).toBe(true);
    });

    it('determines when a set is not complete without two-point lead', () => {
      expect(isSetComplete(21, 20, defaultSettings)).toBe(false);
      expect(isSetComplete(20, 21, defaultSettings)).toBe(false);
    });

    it('determines when a set is complete at maximum points', () => {
      expect(isSetComplete(30, 29, defaultSettings)).toBe(true);
      expect(isSetComplete(29, 30, defaultSettings)).toBe(true);
    });
  });

  describe('getSetWinner', () => {
    const defaultSettings: ScoringSettings = {
      maxPoints: 21,
      requireTwoPointLead: true,
      maxTwoPointLeadScore: 30,
      maxSets: 3,
      setsToWin: 2
    };

    it('determines the winner when set is complete', () => {
      expect(getSetWinner(21, 19, defaultSettings)).toBe('team1');
      expect(getSetWinner(19, 21, defaultSettings)).toBe('team2');
    });

    it('returns null when set is not complete', () => {
      expect(getSetWinner(21, 20, defaultSettings)).toBe(null);
      expect(getSetWinner(20, 21, defaultSettings)).toBe(null);
    });
  });

  describe('createScoreAuditLog', () => {
    it('creates an audit log entry with correct format', () => {
      const score: MatchScore = {
        team1Score: 21,
        team2Score: 19,
        isComplete: true,
        winner: 'team1',
        duration: 0,
        auditLogs: []
      };

      const auditLog = createScoreAuditLog(
        'score_update',
        score,
        'scorer',
        '20-19'
      );

      expect(auditLog.action).toBe('score_update');
      expect(auditLog.details.score).toBe('21-19');
      expect(auditLog.details.scorer).toBe('scorer');
      expect(auditLog.details.previousScore).toBe('20-19');
      expect(auditLog.details.setComplete).toBe(true);
    });
  });

  describe('getDefaultScoringSettings', () => {
    it('returns correct settings for badminton', () => {
      const settings = getDefaultScoringSettings('badminton');
      expect(settings.maxPoints).toBe(21);
      expect(settings.requireTwoPointLead).toBe(true);
      expect(settings.maxTwoPointLeadScore).toBe(30);
    });

    it('returns correct settings for tennis', () => {
      const settings = getDefaultScoringSettings('tennis');
      expect(settings.maxPoints).toBe(6);
      expect(settings.requireTwoPointLead).toBe(true);
      expect(settings.maxTwoPointLeadScore).toBe(7);
    });

    it('throws error for unknown sport', () => {
      expect(() => getDefaultScoringSettings('unknown')).toThrow();
    });
  });
}); 