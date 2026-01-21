import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TournamentRealtimeUpdate } from '../RealtimeTournamentService';
import { Match } from '@/types/entities';
import { MatchStatus } from '@/types/tournament-enums';

// Mock realtime service for multi-client testing
class MockRealtimeTournamentService {
  private listeners = new Map<string, Set<(data: TournamentRealtimeUpdate) => void>>();

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
}

describe('Multi-Client Sync Tests', () => {
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

  describe('Multi-Client Synchronization', () => {
    it('should sync updates between multiple clients', async () => {
      const client1Updates: TournamentRealtimeUpdate[] = [];
      const client2Updates: TournamentRealtimeUpdate[] = [];
      const client3Updates: TournamentRealtimeUpdate[] = [];

      // Subscribe three clients
      const unsubscribe1 = service.subscribeTournament('tournament-1', (update) => {
        client1Updates.push(update);
      });

      const unsubscribe2 = service.subscribeTournament('tournament-1', (update) => {
        client2Updates.push(update);
      });

      const unsubscribe3 = service.subscribeTournament('tournament-1', (update) => {
        client3Updates.push(update);
      });

      // Publish update
      const matchUpdate: TournamentRealtimeUpdate = {
        type: 'match',
        data: { ...mockMatch, status: MatchStatus.IN_PROGRESS }
      };

      await service.publishTournamentUpdate('tournament-1', matchUpdate);

      // All clients should receive the update
      expect(client1Updates).toHaveLength(1);
      expect(client2Updates).toHaveLength(1);
      expect(client3Updates).toHaveLength(1);
      
      expect(client1Updates[0]).toEqual(matchUpdate);
      expect(client2Updates[0]).toEqual(matchUpdate);
      expect(client3Updates[0]).toEqual(matchUpdate);

      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    });

    it('should handle client disconnection gracefully', async () => {
      const client1Updates: TournamentRealtimeUpdate[] = [];
      const client2Updates: TournamentRealtimeUpdate[] = [];

      const unsubscribe1 = service.subscribeTournament('tournament-1', (update) => {
        client1Updates.push(update);
      });

      const unsubscribe2 = service.subscribeTournament('tournament-1', (update) => {
        client2Updates.push(update);
      });

      // First update - both receive
      const update1: TournamentRealtimeUpdate = {
        type: 'match',
        data: { ...mockMatch, status: MatchStatus.IN_PROGRESS }
      };

      await service.publishTournamentUpdate('tournament-1', update1);
      expect(client1Updates).toHaveLength(1);
      expect(client2Updates).toHaveLength(1);

      // Client 1 disconnects
      unsubscribe1();

      // Second update - only client 2 receives
      const update2: TournamentRealtimeUpdate = {
        type: 'match',
        data: { ...mockMatch, status: MatchStatus.COMPLETED }
      };

      await service.publishTournamentUpdate('tournament-1', update2);
      expect(client1Updates).toHaveLength(1); // Still 1
      expect(client2Updates).toHaveLength(2); // Now 2

      unsubscribe2();
    });

    it('should handle rapid concurrent updates', async () => {
      const clientUpdates: TournamentRealtimeUpdate[] = [];
      
      const unsubscribe = service.subscribeTournament('tournament-1', (update) => {
        clientUpdates.push(update);
      });

      // Publish multiple updates rapidly
      const updates: TournamentRealtimeUpdate[] = [
        { type: 'match', data: { ...mockMatch, status: MatchStatus.IN_PROGRESS } },
        { type: 'match', data: { ...mockMatch, scores: [{ team1: 5, team2: 3 }] } },
        { type: 'match', data: { ...mockMatch, scores: [{ team1: 10, team2: 8 }] } },
        { type: 'match', data: { ...mockMatch, scores: [{ team1: 15, team2: 12 }] } },
        { type: 'match', data: { ...mockMatch, status: MatchStatus.COMPLETED } },
      ];

      // Publish all updates concurrently
      await Promise.all(
        updates.map(update => service.publishTournamentUpdate('tournament-1', update))
      );

      // All updates should be received
      expect(clientUpdates).toHaveLength(5);
      expect(clientUpdates.map(u => u.type)).toEqual(['match', 'match', 'match', 'match', 'match']);

      unsubscribe();
    });
  });
});
