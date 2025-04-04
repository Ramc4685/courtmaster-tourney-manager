
import { StandaloneMatch } from "@/types/tournament";

/**
 * Utility class for managing local storage operations
 * Provides typed access to store and retrieve data
 */
export class LocalStorage {
  // Keys for storing different data types
  private MATCHES_KEY = 'standalone_matches';
  private SETTINGS_KEY = 'app_settings';

  /**
   * Save standalone matches to local storage
   */
  saveMatches(matches: StandaloneMatch[]): void {
    try {
      localStorage.setItem(this.MATCHES_KEY, JSON.stringify(matches));
    } catch (error) {
      console.error('Error saving matches to localStorage:', error);
    }
  }

  /**
   * Get standalone matches from local storage
   */
  getMatches(): StandaloneMatch[] | null {
    try {
      const data = localStorage.getItem(this.MATCHES_KEY);
      if (!data) return null;
      
      // Parse the JSON data
      const parsedData = JSON.parse(data);
      
      // Ensure dates are properly converted back from strings
      return this.convertDatesInMatchData(parsedData);
    } catch (error) {
      console.error('Error retrieving matches from localStorage:', error);
      return null;
    }
  }

  /**
   * Save application settings to local storage
   */
  saveSettings(settings: Record<string, any>): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  }

  /**
   * Get application settings from local storage
   */
  getSettings(): Record<string, any> | null {
    try {
      const data = localStorage.getItem(this.SETTINGS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving settings from localStorage:', error);
      return null;
    }
  }

  /**
   * Helper method to convert date strings back to Date objects
   * in retrieved match data
   */
  private convertDatesInMatchData(matches: any[]): StandaloneMatch[] {
    return matches.map(match => ({
      ...match,
      createdAt: match.createdAt ? new Date(match.createdAt) : undefined,
      updatedAt: match.updatedAt ? new Date(match.updatedAt) : undefined,
      scheduledTime: match.scheduledTime ? new Date(match.scheduledTime) : undefined,
      endTime: match.endTime ? new Date(match.endTime) : undefined,
      // Convert dates in audit logs if they exist
      auditLogs: match.auditLogs?.map((log: any) => ({
        ...log,
        timestamp: log.timestamp ? new Date(log.timestamp) : undefined
      }))
    }));
  }

  /**
   * Clear all data from local storage
   */
  clearAll(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}
