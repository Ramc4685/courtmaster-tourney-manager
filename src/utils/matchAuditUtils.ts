
import { Match, AuditLog, Tournament, StandaloneMatch, isStandaloneMatch } from "@/types/tournament";
import { getCurrentUserId } from "@/utils/auditUtils";

/**
 * Generates a unique match number based on tournament and date information
 * Format: TRN-YYYYMMDD-XXX where XXX is a sequential number
 */
export function generateMatchNumber(tournament: Tournament): string {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  
  // Count existing matches to determine the next number
  // Start with 1 if no matches exist, otherwise increment from the highest
  const existingMatchCount = tournament.matches.length;
  const sequenceNumber = existingMatchCount + 1;
  
  // Pad the sequence number to ensure it's at least 3 digits
  const paddedNumber = String(sequenceNumber).padStart(3, '0');
  
  // Create the match number: TRN prefix + date + sequence
  return `TRN-${dateStr}-${paddedNumber}`;
}

/**
 * Adds an audit log entry to a match
 */
export function addMatchAuditLog(
  match: Match | StandaloneMatch,
  action: string,
  details?: Record<string, any>
): Match | StandaloneMatch {
  const userId = getCurrentUserId();
  const now = new Date();
  
  const auditEntry: AuditLog = {
    timestamp: now,
    user_id: userId,
    action,
    details
  };
  
  // Create a new array if auditLogs doesn't exist
  const auditLogs = match.auditLogs ? [...match.auditLogs, auditEntry] : [auditEntry];
  
  return {
    ...match,
    auditLogs,
    updatedAt: now,
    updated_by: userId
  };
}

/**
 * Adds scoring audit information to a match
 */
export function addScoringAuditInfo(
  match: Match | StandaloneMatch, 
  scorerName: string, 
  courtNumber?: number
): Match | StandaloneMatch {
  const now = new Date();
  const userId = getCurrentUserId();
  
  // Only set the endTime if the match is being completed
  const endTime = match.status === 'COMPLETED' ? now : match.endTime;
  
  // Create basic update with shared properties
  const basicUpdate = {
    scorerName,
    courtNumber: courtNumber || match.courtNumber,
    endTime,
    updatedAt: now,
    updated_by: userId
  };
  
  // Combine with the match object, preserving the correct type
  const updatedMatch = {
    ...match,
    ...basicUpdate
  };
  
  // Add an audit log entry for this update
  return addMatchAuditLog(updatedMatch, 'SCORE_UPDATE', {
    scorerName,
    courtNumber: courtNumber || match.courtNumber,
    endTime: match.status === 'COMPLETED' ? endTime : undefined,
    scores: match.scores
  });
}
