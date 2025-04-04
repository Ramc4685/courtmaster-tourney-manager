
import { Match, StandaloneMatch, AuditLog } from "@/types/tournament";
import { getCurrentUserId } from "./auditUtils";

/**
 * Adds a general log entry to the match audit
 */
export function addMatchAuditLog(match: Match | StandaloneMatch, message: string): Match | StandaloneMatch {
  const userId = getCurrentUserId();
  const timestamp = new Date();
  
  // Create audit log entry
  const logEntry: AuditLog = {
    timestamp,
    userId,
    message,
    type: "GENERAL"
  };

  // Create or update audit logs array
  const auditLogs = match.auditLogs ? [...match.auditLogs, logEntry] : [logEntry];
  
  return {
    ...match,
    auditLogs,
    updated_by: userId
  };
}

/**
 * Adds scoring audit information to a match
 */
export function addScoringAuditInfo(
  match: Match | StandaloneMatch, 
  scorerName?: string
): Match | StandaloneMatch {
  const userId = getCurrentUserId();
  const timestamp = new Date();
  
  // Create audit log entry for scoring
  const logEntry: AuditLog = {
    timestamp,
    userId,
    message: `Score updated by ${scorerName || "Unknown"}`,
    type: "SCORING",
    metadata: {
      scores: [...match.scores],
      scorerName
    }
  };

  // Create or update audit logs array
  const auditLogs = match.auditLogs ? [...match.auditLogs, logEntry] : [logEntry];
  
  return {
    ...match,
    auditLogs,
    scorerName: scorerName || match.scorerName,
    updated_by: userId
  };
}

/**
 * Adds court assignment audit information to a match
 */
export function addCourtAssignmentAuditInfo(
  match: Match | StandaloneMatch,
  courtNumber: number
): Match | StandaloneMatch {
  const userId = getCurrentUserId();
  const timestamp = new Date();
  
  // Create audit log entry for court assignment
  const logEntry: AuditLog = {
    timestamp,
    userId,
    message: `Court ${courtNumber} assigned to match`,
    type: "COURT_ASSIGNMENT",
    metadata: {
      courtNumber,
      previousCourtNumber: match.courtNumber
    }
  };

  // Create or update audit logs array
  const auditLogs = match.auditLogs ? [...match.auditLogs, logEntry] : [logEntry];
  
  return {
    ...match,
    auditLogs,
    courtNumber,
    updated_by: userId
  };
}
