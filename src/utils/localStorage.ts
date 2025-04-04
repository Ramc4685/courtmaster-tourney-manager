
import { StandaloneMatch } from "@/types/tournament";

export class LocalStorage {
  /**
   * Save matches to localStorage
   */
  saveMatches(matches: StandaloneMatch[]): void {
    try {
      localStorage.setItem('standalone_matches', JSON.stringify(matches));
    } catch (error) {
      console.error('Error saving matches to localStorage:', error);
    }
  }

  /**
   * Get matches from localStorage
   */
  getMatches(): StandaloneMatch[] {
    try {
      const matches = localStorage.getItem('standalone_matches');
      return matches ? JSON.parse(matches) : [];
    } catch (error) {
      console.error('Error retrieving matches from localStorage:', error);
      return [];
    }
  }

  /**
   * Save a single match to localStorage
   */
  saveMatch(match: StandaloneMatch): void {
    try {
      const matches = this.getMatches();
      const existingMatchIndex = matches.findIndex(m => m.id === match.id);
      if (existingMatchIndex >= 0) {
        matches[existingMatchIndex] = match;
      } else {
        matches.push(match);
      }
      this.saveMatches(matches);
    } catch (error) {
      console.error('Error saving match to localStorage:', error);
    }
  }

  /**
   * Get a match by ID from localStorage
   */
  getMatchById(id: string): StandaloneMatch | null {
    try {
      const matches = this.getMatches();
      return matches.find(m => m.id === id) || null;
    } catch (error) {
      console.error('Error retrieving match from localStorage:', error);
      return null;
    }
  }

  /**
   * Delete a match by ID from localStorage
   */
  deleteMatch(id: string): void {
    try {
      const matches = this.getMatches();
      const filteredMatches = matches.filter(m => m.id !== id);
      this.saveMatches(filteredMatches);
    } catch (error) {
      console.error('Error deleting match from localStorage:', error);
    }
  }

  /**
   * Clear all matches from localStorage
   */
  clearMatches(): void {
    try {
      localStorage.removeItem('standalone_matches');
    } catch (error) {
      console.error('Error clearing matches from localStorage:', error);
    }
  }
}
