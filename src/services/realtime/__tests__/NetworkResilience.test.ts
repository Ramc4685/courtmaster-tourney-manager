import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TournamentRealtimeUpdate } from '../RealtimeTournamentService';
import { Match } from '@/types/entities';
import { MatchStatus } from '@/types/tournament-enums';

// Mock realtime service for network resilience testing
class MockRealtimeTournamentService {
  private listeners = new Map<string, Set<(data: TournamentRealtimeUpdate) => void>>();
  private isOnline = true;
  private eventQueue: any[] = [];

  subscribeTournament(tournamentId: string, callback: (update: TournamentRealtimeUpdate) => void) {
    const key = `tournament:${tournamentId}`;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)?.add(callback);
    
    return () => {
      const listenerSet = this.listeners.get(key);
      if (listenerSet) {
        listenerSet.delete(callback);
        if (listenerSet.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  async publishTournamentUpdate(tournamentId: string, updateData: TournamentRealtimeUpdate) {
    if (!this.isOnline) {
      this.eventQueue.push({ tournamentId, update: updateData, timestamp: Date.now() });
      return;
    }

    const key = `tournament:${tournamentId}`;
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(updateData);
        } catch (error) {
          console.error('Listener error:', error);
        }
      });
    }
  }

  setOnlineStatus(online: boolean) {
    this.isOnline = online;
  }

  getQueueLength() {
    return this.eventQueue.length;
  }
}

describe('Network Resilience Tests', () => {
  let service: MockRealtimeTournamentService;
  let mockMatch: Match;

  beforeEach(() => {
    service = new MockRealtimeTournamentService();
    mockMatch = {
      id: 'match-1',
      tournamentId: 'tournament-1',
      team1Id: 'team-1',
      team2Id: 'team-2',
      status: MatchStatus.SCHEDULED,
      scheduledTime: new Date(),
      scores: [],
      round: 1,
      courtId: 'court-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe('Network Interruptions', () => {
    it('should handle network interruptions', async () => {
      const clientUpdates: TournamentRealtimeUpdate[] = [];
      
      const unsubscribe = service.subscribeTournament('tournament-1', (update) => {
        clientUpdates.push(update);
      });

      // Go offline
      service.setOnlineStatus(false);

      // Publish while offline - should be queued
      const offlineUpdate: TournamentRealtimeUpdate = {
        type: 'match',
        data: { ...mockMatch, status: MatchStatus.IN_PROGRESS }
      };

      await service.publishTournamentUpdate('tournament-1', offlineUpdate);

      // Should not receive update immediately
      expect(clientUpdates).toHaveLength(0);
      expect(service.getQueueLength()).toBe(1);

      // Come back online
      service.setOnlineStatus(true);

      // Publish another update - should work now
      await service.publishTournamentUpdate('tournament-1', offlineUpdate);
      expect(clientUpdates).toHaveLength(1);

      unsubscribe();
    });

    it('should handle message ordering correctly', async () => {
      const clientUpdates: TournamentRealtimeUpdate[] = [];
      
      const unsubscribe = service.subscribeTournament('tournament-1', (update) => {
        clientUpdates.push(update);
      });

      // Publish updates in sequence
      const updates = [
        { type: 'match' as const, data: { ...mockMatch, status: MatchStatus.SCHEDULED } },
        { type: 'match' as const, data: { ...mockMatch, status: MatchStatus.IN_PROGRESS } },
        { type: 'match' as const, data: { ...mockMatch, status: MatchStatus.COMPLETED } }
      ];

      for (const update of updates) {
        await service.publishTournamentUpdate('tournament-1', update);
      }

      // Should receive all updates in order
      expect(clientUpdates).toHaveLength(3);
      expect(clientUpdates[0].data.status).toBe(MatchStatus.SCHEDULED);
      expect(clientUpdates[1].data.status).toBe(MatchStatus.IN_PROGRESS);
      expect(clientUpdates[2].data.status).toBe(MatchStatus.COMPLETED);

      unsubscribe();
    });

    it('should handle network timeouts gracefully', async () => {
      const clientUpdates: TournamentRealtimeUpdate[] = [];
      
      const unsubscribe = service.subscribeTournament('tournament-1', (update) => {
        clientUpdates.push(update);
      });

      // Simulate network timeout by going offline temporarily
      service.setOnlineStatus(false);
      
      const timeoutUpdate: TournamentRealtimeUpdate = {
        type: 'match',
        data: { ...mockMatch, status: MatchStatus.IN_PROGRESS }
      };

      await service.publishTournamentUpdate('tournament-1', timeoutUpdate);
      expect(clientUpdates).toHaveLength(0);
      expect(service.getQueueLength()).toBe(1);

      // Network recovers
      service.setOnlineStatus(true);
      
      // Should be able to publish new updates
      await service.publishTournamentUpdate('tournament-1', timeoutUpdate);
      expect(clientUpdates).toHaveLength(1);

      unsubscribe();
    });
  });
});
