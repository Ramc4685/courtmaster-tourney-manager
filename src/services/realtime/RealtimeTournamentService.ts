
import { Tournament, Match } from '@/types/entities';
import { Match as LegacyMatch } from '@/types/tournament';
import { legacyToStandardMatch } from '@/types/match';

export type TournamentRealtimeUpdate =
  | { type: 'tournament'; data: Tournament }
  | { type: 'match'; data: Match }
  | { type: 'announcement'; data: Record<string, any> }
  | { type: 'court'; data: Record<string, any> };

export interface QueuedEvent {
  tournamentId: string;
  update: TournamentRealtimeUpdate;
  timestamp: number;
  retryAttempts: number;
}

export interface MinimalBroadcastPayload {
  type: string;
  tournamentId: string;
  data: {
    type: string;
    id?: string;
    status?: string;
    [key: string]: any;
  };
  timestamp: number;
}

/**
 * Enhanced real-time tournament service interface
 * This service enables multi-user functionality and live updates with better integration
 */
class RealtimeTournamentService {
  private listeners: Map<string, Set<(data: TournamentRealtimeUpdate) => void>> = new Map();
  private matchListeners: Map<string, Set<(data: Match) => void>> = new Map();
  private inProgressListeners: Map<string, Set<(data: Match[]) => void>> = new Map();
  private connectionPool: Map<string, Set<WebSocket>> = new Map();
  private eventQueue: QueuedEvent[] = [];
  private maxQueueSize: number = 1000;
  private maxRetryAttempts: number = 3;
  private isOnline: boolean = true;
  private isProcessing: boolean = false;
  
  /**
   * Helper method to safely notify listeners with consistent error handling
   */
  private notifyListeners<T>(listeners: Set<(data: T) => void>, payload: T): void {
    listeners.forEach(listener => {
      try {
        listener(payload);
      } catch (error) {
        console.error(`[ERROR] Error in listener:`, error);
      }
    });
  }

  /**
   * Helper method to validate update data structure
   */
  private validateUpdateData(updateData: any): updateData is TournamentRealtimeUpdate {
    if (!updateData || typeof updateData !== 'object') {
      console.error(`[ERROR] Invalid updateData: not an object`);
      return false;
    }
    
    if (!updateData.type || typeof updateData.type !== 'string') {
      console.error(`[ERROR] Invalid updateData: missing or invalid type`);
      return false;
    }
    
    if (!updateData.data) {
      console.error(`[ERROR] Invalid updateData: missing data property`);
      return false;
    }
    
    return true;
  }

  /**
   * Helper method to create minimal broadcast payload
   */
  private createMinimalPayload(tournamentId: string, updateData: TournamentRealtimeUpdate): MinimalBroadcastPayload {
    const baseData: any = {
      type: updateData.type
    };
    
    // Add essential fields based on update type
    switch (updateData.type) {
      case 'match':
        baseData.id = updateData.data.id;
        baseData.status = updateData.data.status;
        baseData.scores = updateData.data.scores;
        break;
      case 'tournament':
        baseData.id = updateData.data.id;
        baseData.name = updateData.data.name;
        baseData.status = updateData.data.status;
        break;
      case 'announcement':
      case 'court':
        // For these types, include minimal essential data
        if (updateData.data.id) baseData.id = updateData.data.id;
        if (updateData.data.status) baseData.status = updateData.data.status;
        break;
    }
    
    return {
      type: 'tournament_update',
      tournamentId,
      data: baseData,
      timestamp: Date.now()
    };
  }

  /**
   * Subscribe to changes for a specific tournament
   * @param tournamentId The tournament ID to subscribe to
   * @param callback The callback to execute when tournament data changes
   * @returns Unsubscribe function
   */
  subscribeTournament(
    tournamentId: string,
    callback: (update: TournamentRealtimeUpdate) => void
  ): () => void {
    const key = `tournament:${tournamentId}`;
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key)?.add(callback);
    console.log(`[DEBUG] Subscribed to tournament: ${tournamentId}`);
    
    // Return unsubscribe function
    return () => {
      const listenerSet = this.listeners.get(key);
      if (listenerSet) {
        listenerSet.delete(callback);
        // Clean up empty sets to prevent memory leaks
        if (listenerSet.size === 0) {
          this.listeners.delete(key);
        }
      }
      console.log(`[DEBUG] Unsubscribed from tournament: ${tournamentId}`);
    };
  }
  
  /**
   * Subscribe to changes for a specific match
   * @param matchId The match ID to subscribe to
   * @param callback The callback to execute when match data changes
   * @returns Unsubscribe function
   */
  subscribeMatch(matchId: string, callback: (match: Match) => void): () => void {
    const key = `match:${matchId}`;
    
    if (!this.matchListeners.has(key)) {
      this.matchListeners.set(key, new Set());
    }
    
    this.matchListeners.get(key)?.add(callback);
    console.log(`[DEBUG] Subscribed to match: ${matchId}`);
    
    // Return unsubscribe function
    return () => {
      const listenerSet = this.matchListeners.get(key);
      if (listenerSet) {
        listenerSet.delete(callback);
        // Clean up empty sets to prevent memory leaks
        if (listenerSet.size === 0) {
          this.matchListeners.delete(key);
        }
      }
      console.log(`[DEBUG] Unsubscribed from match: ${matchId}`);
    };
  }
  
  /**
   * Subscribe to in-progress matches for a tournament
   * @param tournamentId The tournament ID
   * @param callback The callback to execute when in-progress matches change
   * @returns Unsubscribe function
   */
  subscribeInProgressMatches(tournamentId: string, callback: (matches: Match[]) => void): () => void {
    const key = `tournament:${tournamentId}:in-progress`;
    
    if (!this.inProgressListeners.has(key)) {
      this.inProgressListeners.set(key, new Set());
    }
    
    this.inProgressListeners.get(key)?.add(callback);
    console.log(`[DEBUG] Subscribed to in-progress matches for tournament: ${tournamentId}`);
    
    // Return unsubscribe function
    return () => {
      const listenerSet = this.inProgressListeners.get(key);
      if (listenerSet) {
        listenerSet.delete(callback);
        // Clean up empty sets to prevent memory leaks
        if (listenerSet.size === 0) {
          this.inProgressListeners.delete(key);
        }
      }
      console.log(`[DEBUG] Unsubscribed from in-progress matches for tournament: ${tournamentId}`);
    };
  }
  
  /**
   * Enhanced method to publish tournament updates with better integration
   * @param tournamentId The tournament ID
   * @param updateData The update data with type and payload
   */
  async publishTournamentUpdate(tournamentId: string, updateData: TournamentRealtimeUpdate): Promise<void> {
    const key = `tournament:${tournamentId}`;
    console.log(`[DEBUG] Publishing tournament update: ${tournamentId}, type: ${updateData.type}`);
    
    // Validate updateData structure
    if (!this.validateUpdateData(updateData)) {
      console.error(`[ERROR] Invalid updateData structure, skipping update`);
      return;
    }
    
    // Queue event if offline
    if (!this.isOnline) {
      // Check queue size limit
      if (this.eventQueue.length >= this.maxQueueSize) {
        console.warn(`[WARN] Event queue full, dropping oldest event`);
        this.eventQueue.shift();
      }
      
      this.eventQueue.push({
        tournamentId,
        update: updateData,
        timestamp: Date.now(),
        retryAttempts: 0
      });
      return;
    }

    try {
      // Integrate with existing services based on update type
      switch (updateData.type) {
        case 'match':
          await this.handleMatchUpdate(tournamentId, updateData.data);
          break;
        case 'announcement':
          await this.handleAnnouncementUpdate(tournamentId, updateData.data);
          break;
        case 'court':
          await this.handleCourtUpdate(tournamentId, updateData.data);
          break;
        case 'tournament':
        default:
          break;
      }

      // Notify tournament subscribers
      if (this.listeners.has(key)) {
        this.notifyListeners(this.listeners.get(key)!, updateData);
      }

      // Broadcast to WebSocket connections if available
      await this.broadcastToConnections(tournamentId, updateData);

    } catch (error) {
      console.error(`[ERROR] Failed to publish tournament update:`, error);
      // Queue for retry if it fails
      if (this.eventQueue.length < this.maxQueueSize) {
        this.eventQueue.push({
          tournamentId,
          update: updateData,
          timestamp: Date.now(),
          retryAttempts: 0
        });
      }
    }
  }

  /**
   * Handle match-specific updates with service integration
   */
  private async handleMatchUpdate(tournamentId: string, matchData: Match): Promise<void> {
    try {
      // Log match update for now - actual service integration would depend on available methods
      console.log(`[DEBUG] Match update received: ${matchData.id}`, matchData);

      // Notify in-progress match subscribers
      const inProgressKey = `tournament:${tournamentId}:in-progress`;
      if (this.inProgressListeners.has(inProgressKey)) {
        // For now, just pass the match data directly to listeners
        // In a real implementation, we would fetch updated match list from service
        const filteredMatches = [matchData].filter(m => m.status === 'IN_PROGRESS');
        this.notifyListeners(this.inProgressListeners.get(inProgressKey)!, filteredMatches);
      }

      // Notify individual match subscribers
      const matchKey = `match:${matchData.id}`;
      if (this.matchListeners.has(matchKey)) {
        this.notifyListeners(this.matchListeners.get(matchKey)!, matchData);
      }
    } catch (error) {
      console.error(`[ERROR] Failed to handle match update:`, error);
    }
  }

  /**
   * Handle announcement-specific updates
   */
  private async handleAnnouncementUpdate(
    tournamentId: string,
    announcementData: Record<string, any>
  ): Promise<void> {
    try {
      // Log announcement update for now - actual service integration would depend on available methods
      console.log(`[DEBUG] Announcement update received for tournament: ${tournamentId}`, announcementData);
      
      // In a real implementation, we would integrate with the notification service
      // For now, we'll just log the announcement data
    } catch (error) {
      console.error(`[ERROR] Failed to handle announcement update:`, error);
    }
  }

  /**
   * Handle court-specific updates
   */
  private async handleCourtUpdate(
    tournamentId: string,
    courtData: Record<string, any>
  ): Promise<void> {
    try {
      // Update court status if needed
      if (courtData.courtId && courtData.status) {
        // Court service integration would go here
        console.log(`[DEBUG] Court update: ${courtData.courtId} -> ${courtData.status}`);
      }
    } catch (error) {
      console.error(`[ERROR] Failed to handle court update:`, error);
    }
  }

  /**
   * Broadcast updates to WebSocket connections
   */
  private async broadcastToConnections(tournamentId: string, updateData: TournamentRealtimeUpdate): Promise<void> {
    const connectionKey = `tournament:${tournamentId}`;
    const connections = this.connectionPool.get(connectionKey);
    
    if (connections && connections.size > 0) {
      const minimalPayload = this.createMinimalPayload(tournamentId, updateData);
      const message = JSON.stringify(minimalPayload);
      const closedConnections: WebSocket[] = [];
      
      // Send to all connections for this tournament
      connections.forEach(connection => {
        if (connection.readyState === WebSocket.OPEN) {
          try {
            connection.send(message);
          } catch (error) {
            console.error(`[ERROR] Failed to broadcast to WebSocket:`, error);
            closedConnections.push(connection);
          }
        } else {
          // Mark closed/errored connections for removal
          closedConnections.push(connection);
        }
      });
      
      // Remove closed connections
      closedConnections.forEach(connection => {
        connections.delete(connection);
      });
      
      // Remove the key if no connections remain
      if (connections.size === 0) {
        this.connectionPool.delete(connectionKey);
      }
    }
  }

  /**
   * Add a WebSocket connection to the pool for a tournament
   */
  addConnection(tournamentId: string, connection: WebSocket): void {
    const connectionKey = `tournament:${tournamentId}`;
    
    if (!this.connectionPool.has(connectionKey)) {
      this.connectionPool.set(connectionKey, new Set());
    }
    
    this.connectionPool.get(connectionKey)?.add(connection);
    console.log(`[DEBUG] Added WebSocket connection for tournament: ${tournamentId}`);
  }

  /**
   * Legacy method for backward compatibility - refactored to use standard flow
   * @param tournament The updated tournament data
   */
  publishTournamentUpdate_Legacy(tournament: { id: string; matches?: LegacyMatch[] }): void {
    console.log(`[DEBUG] Publishing tournament update (legacy): ${tournament.id}`);
    
    // Handle legacy updates directly to avoid type conflicts
    const key = `tournament:${tournament.id}`;
    
    // Convert legacy matches to standard format for internal processing
    const standardMatches = (tournament.matches || []).map(match => legacyToStandardMatch(match));
    
    // Notify tournament subscribers with legacy data structure
    if (this.listeners.has(key)) {
      // Create a compatible tournament update without the matches array to avoid type issues
      const tournamentUpdate: TournamentRealtimeUpdate = {
        type: 'tournament',
        data: {
          id: tournament.id,
          name: (tournament as any).name || '',
          status: (tournament as any).status || 'PENDING',
          location: (tournament as any).location || '',
          startDate: (tournament as any).startDate || new Date().toISOString(),
          endDate: (tournament as any).endDate || new Date().toISOString(),
          registrationEnabled: (tournament as any).registrationEnabled || false,
          maxParticipants: (tournament as any).maxParticipants || 0,
          currentParticipants: (tournament as any).currentParticipants || 0,
          format: (tournament as any).format || 'SINGLE_ELIMINATION',
          sport: (tournament as any).sport || 'TENNIS',
          visibility: (tournament as any).visibility || 'PUBLIC',
          matches: [], // Empty array to satisfy type requirements
          requirePlayerProfile: false,
          maxTeams: 0,
          formatConfig: {},
          scoring: { bestOf: 3, pointsToWin: 11 },
          rules: [],
          prizes: [],
          officials: []
        } as unknown as Tournament
      };
      
      this.notifyListeners(this.listeners.get(key)!, tournamentUpdate);
    }
    
    // Handle in-progress matches
    const inProgressMatches = standardMatches.filter(match => match.status === 'IN_PROGRESS');
    const inProgressKey = `tournament:${tournament.id}:in-progress`;
    
    if (this.inProgressListeners.has(inProgressKey)) {
      this.notifyListeners(this.inProgressListeners.get(inProgressKey)!, inProgressMatches as Match[]);
    }
    
    // Handle individual match updates
    standardMatches.forEach(standardMatch => {
      this.publishMatchUpdate(standardMatch as Match);
    });
  }
  
  /**
   * Publish match update to subscribers
   * @param match The updated match data
   */
  publishMatchUpdate(match: Match): void {
    const key = `match:${match.id}`;
    console.log(`[DEBUG] Publishing match update: ${match.id}`);
    
    if (this.matchListeners.has(key)) {
      this.notifyListeners(this.matchListeners.get(key)!, match);
    }
  }

  /**
   * Initialize WebSocket connection for a tournament
   */
  initializeConnection(tournamentId: string, wsUrl?: string): void {
    const connectionKey = `tournament:${tournamentId}`;
    
    if (!this.connectionPool.has(connectionKey)) {
      this.connectionPool.set(connectionKey, new Set());
    }

    try {
      // In a real implementation, this would connect to actual WebSocket endpoint
      // For now, we'll simulate the connection initialization
      console.log(`[DEBUG] Initializing connection pool for tournament: ${tournamentId}`);
      
      // Example of how to add a real WebSocket connection:
      // const ws = new WebSocket(wsUrl || 'ws://localhost:8080');
      // this.connectionPool.get(connectionKey)?.add(ws);
    } catch (error) {
      console.error(`[ERROR] Failed to initialize connection:`, error);
    }
  }

  /**
   * Close WebSocket connection for a tournament
   */
  closeConnection(tournamentId: string): void {
    const connectionKey = `tournament:${tournamentId}`;
    const connections = this.connectionPool.get(connectionKey);
    
    if (connections) {
      connections.forEach(connection => {
        try {
          connection.close();
        } catch (error) {
          console.error(`[ERROR] Failed to close connection:`, error);
        }
      });
      console.log(`[DEBUG] Closed ${connections.size} connections for tournament: ${tournamentId}`);
    }
    
    this.connectionPool.delete(connectionKey);
  }

  /**
   * Process queued events when coming back online
   */
  async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0 || this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      console.log(`[DEBUG] Processing ${this.eventQueue.length} queued events`);

      const queuedEvents = [...this.eventQueue];
      this.eventQueue = [];

      for (const event of queuedEvents) {
        try {
          // Check retry attempts
          if (event.retryAttempts >= this.maxRetryAttempts) {
            console.warn(`[WARN] Dropping event after ${event.retryAttempts} retry attempts:`, event);
            continue;
          }
          
          await this.publishTournamentUpdate(event.tournamentId, event.update);
        } catch (error) {
          console.error(`[ERROR] Failed to process queued event:`, error);
          
          // Increment retry attempts and re-queue if under limit
          if (event.retryAttempts < this.maxRetryAttempts) {
            event.retryAttempts++;
            if (this.eventQueue.length < this.maxQueueSize) {
              this.eventQueue.push(event);
            }
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Set online/offline status
   */
  setOnlineStatus(isOnline: boolean): void {
    const wasOffline = !this.isOnline;
    this.isOnline = isOnline;
    
    console.log(`[DEBUG] Network status changed: ${isOnline ? 'online' : 'offline'}`);
    
    if (isOnline && wasOffline) {
      // Process queued events when coming back online
      this.processEventQueue();
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(tournamentId: string): { connected: boolean; online: boolean; connectionCount: number } {
    const connectionKey = `tournament:${tournamentId}`;
    const connections = this.connectionPool.get(connectionKey);
    
    return {
      connected: connections !== undefined && connections.size > 0,
      online: this.isOnline,
      connectionCount: connections?.size || 0
    };
  }

  /**
   * Get statistics about the service
   */
  getStats(): {
    tournamentSubscriptions: number;
    matchSubscriptions: number;
    inProgressSubscriptions: number;
    activeConnections: number;
    queuedEvents: number;
    isOnline: boolean;
  } {
    // Sum the sizes of all listener sets for accurate counts
    const tournamentSubscriptions = Array.from(this.listeners.values())
      .reduce((sum, listenerSet) => sum + listenerSet.size, 0);
    
    const matchSubscriptions = Array.from(this.matchListeners.values())
      .reduce((sum, listenerSet) => sum + listenerSet.size, 0);
    
    const inProgressSubscriptions = Array.from(this.inProgressListeners.values())
      .reduce((sum, listenerSet) => sum + listenerSet.size, 0);
    
    const activeConnections = Array.from(this.connectionPool.values())
      .reduce((sum, connectionSet) => sum + connectionSet.size, 0);
    
    return {
      tournamentSubscriptions,
      matchSubscriptions,
      inProgressSubscriptions,
      activeConnections,
      queuedEvents: this.eventQueue.length,
      isOnline: this.isOnline
    };
  }

  /**
   * Clear all subscriptions and connections
   */
  cleanup(): void {
    console.log('[DEBUG] Cleaning up RealtimeTournamentService');
    
    // Close all connections
    this.connectionPool.forEach((connections, key) => {
      connections.forEach(connection => {
        try {
          connection.close();
        } catch (error) {
          console.error(`[ERROR] Failed to close connection ${key}:`, error);
        }
      });
    });
    
    // Clear all data
    this.listeners.clear();
    this.matchListeners.clear();
    this.inProgressListeners.clear();
    this.connectionPool.clear();
    this.eventQueue = [];
    this.isProcessing = false;
  }
}

// Create a singleton instance
export const realtimeTournamentService = new RealtimeTournamentService();
