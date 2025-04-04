
import { Match, AuditLog, Tournament, StandaloneMatch } from "@/types/tournament";
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
 * Type guard to check if a match is a standalone match
 */
export function isStandaloneMatch(match: Match | StandaloneMatch): match is StandaloneMatch {
  return !('tournamentId' in match);
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
  
  // Create audit details object with extended information
  const auditDetails = {
    scorerName,
    courtNumber: courtNumber || match.courtNumber,
    timestamp: now,
    scores: match.scores,
    status: match.status,
    // Add more detailed audit information
    setScores: match.scores.map((score, index) => ({
      set: index + 1,
      team1Score: score.team1Score,
      team2Score: score.team2Score
    }))
  };
  
  // Create basic update with shared properties
  const basicUpdate = {
    scorerName: scorerName || userId,
    courtNumber: courtNumber || match.courtNumber,
    endTime,
    updatedAt: now,
    updated_by: userId
  };
  
  // Handle special case for tournament vs standalone match
  if (isStandaloneMatch(match)) {
    // Return StandaloneMatch type
    const updatedMatch = {
      ...match,
      ...basicUpdate
    } as StandaloneMatch;
    
    return addMatchAuditLog(updatedMatch, 'SCORE_UPDATE', auditDetails);
  } else {
    // Return Match type
    const updatedMatch = {
      ...match,
      ...basicUpdate
    } as Match;
    
    return addMatchAuditLog(updatedMatch, 'SCORE_UPDATE', auditDetails);
  }
}

/**
 * Adds court assignment information to audit log
 */
export function addCourtAssignmentAuditInfo(
  match: Match | StandaloneMatch,
  courtNumber: number
): Match | StandaloneMatch {
  const auditDetails = {
    courtNumber,
    timestamp: new Date(),
    action: "COURT_ASSIGNMENT"
  };
  
  // Update the match with court information
  const updatedMatch = {
    ...match,
    courtNumber
    // courtName is not included since it doesn't exist on both match types
  };
  
  return addMatchAuditLog(updatedMatch, 'COURT_ASSIGNMENT', auditDetails);
}

/**
 * Generate default scorer name if none provided
 */
export function getDefaultScorerName(): string {
  const userId = getCurrentUserId();
  return `Scorer-${userId.substring(0, 8)}`;
}
