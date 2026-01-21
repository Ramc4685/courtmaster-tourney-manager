/**
 * Sentry Integration for CourtMaster (Disabled for Development)
 *
 * Sentry monitoring is disabled in development mode
 */

// No-op implementations for development
export function initializeSentry(): void {
  console.debug('Sentry disabled in development mode');
}

export function setSentryUser(user: any): void {
  // No-op
}

export function setSentryTournamentContext(context: any): void {
  // No-op
}

export function setSentryMatchContext(context: any): void {
  // No-op
}

export function captureSentryException(error: Error, context?: Record<string, any>): string | undefined {
  console.error('Error captured (Sentry disabled):', error, context);
  return undefined;
}

export function captureSentryMessage(message: string, level: string = 'info'): string | undefined {
  console.log(`[${level.toUpperCase()}] ${message}`);
  return undefined;
}

export function addSentryBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: string;
  data?: Record<string, any>;
}): void {
  console.debug('Breadcrumb:', breadcrumb);
}

export function startSentryTransaction(name: string, op: string): any | undefined {
  console.debug(`Transaction started: ${name} (${op})`);
  return undefined;
}

export function isSentryEnabled(): boolean {
  return false;
}

export default {
  initializeSentry,
  setSentryUser,
  setSentryTournamentContext,
  setSentryMatchContext,
  captureSentryException,
  captureSentryMessage,
  addSentryBreadcrumb,
  startSentryTransaction,
  isSentryEnabled
};