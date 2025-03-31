
/**
 * Audit utilities for tracking user actions and maintaining audit fields
 * in the tournament manager application.
 */

import { Tournament, Match, Team, Court } from "@/types/tournament";

/**
 * Gets the current authenticated user ID, or returns a default value if not authenticated
 */
export function getCurrentUserId(): string {
  // This would typically integrate with your authentication system
  // For now, return a placeholder or get from localStorage
  return localStorage.getItem('currentUserId') || 'system';
}

/**
 * Adds audit fields to a new entity
 * @param entity The entity to prepare (Tournament, Match, Team, Court)
 * @returns The entity with audit fields
 */
export function prepareNewEntity<T extends Record<string, any>>(entity: T): T {
  const now = new Date();
  const userId = getCurrentUserId();
  
  return {
    ...entity,
    createdAt: now,
    updatedAt: now,
    created_by: userId,
    updated_by: userId
  };
}

/**
 * Updates audit fields for modified entity
 * @param entity The entity being updated
 * @returns The entity with updated audit fields
 */
export function prepareUpdatedEntity<T extends Record<string, any>>(entity: T): T {
  const now = new Date();
  const userId = getCurrentUserId();
  
  return {
    ...entity,
    updatedAt: now,
    updated_by: userId
  };
}

/**
 * Creates a transaction log entry for auditing purposes
 * This would typically send data to a backend service
 */
export function logTransaction(
  entityType: 'tournament' | 'match' | 'team' | 'court' | 'player',
  actionType: 'create' | 'update' | 'delete',
  entityId: string,
  details?: Record<string, any>
): void {
  const logData = {
    entityType,
    actionType,
    entityId,
    timestamp: new Date(),
    userId: getCurrentUserId(),
    details
  };
  
  console.log('[AUDIT]', logData);
  
  // In a real implementation, you might:
  // 1. Store in local storage for offline operation
  // 2. Queue for sending to server when online
  // 3. Send directly to a backend API
}
