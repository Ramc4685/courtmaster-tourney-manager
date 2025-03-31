
import { StandaloneMatch, Team, MatchStatus, MatchScore, ScoringSettings } from "@/types/tournament";
import { generateId } from "@/utils/tournamentUtils";
import { storageService } from "../storage/StorageService";
import { determineMatchWinnerAndLoser, getDefaultScoringSettings } from "@/utils/matchUtils";
import { getCurrentUserId } from "@/utils/auditUtils";

export class StandaloneMatchService {
  private MATCHES_KEY = 'standalone_matches';
  private CURRENT_MATCH_KEY = 'current_standalone_match';

  // Get all standalone matches
  async getMatches(): Promise<StandaloneMatch[]> {
    const matches = await storageService.getItem<StandaloneMatch[]>(this.MATCHES_KEY);
    return matches || [];
  }

  // Get current standalone match
  async getCurrentMatch(): Promise<StandaloneMatch | null> {
    return storageService.getItem<StandaloneMatch>(this.CURRENT_MATCH_KEY);
  }

  // Save all standalone matches
  async saveMatches(matches: StandaloneMatch[]): Promise<void> {
    await storageService.setItem(this.MATCHES_KEY, matches);
  }

  // Save current standalone match
  async saveCurrentMatch(match: StandaloneMatch | null): Promise<void> {
    if (match) {
      await storageService.setItem(this.CURRENT_MATCH_KEY, match);
    } else {
      await storageService.removeItem(this.CURRENT_MATCH_KEY);
    }
  }

  // Create a new standalone match
  async createMatch(team1: Team, team2: Team, scheduledTime?: Date): Promise<StandaloneMatch> {
    const now = new Date();
    const userId = getCurrentUserId();
    
    const newMatch: StandaloneMatch = {
      id: generateId(),
      team1,
      team2,
      scores: [],
      status: "SCHEDULED",
      createdAt: now,
      updatedAt: now,
      created_by: userId,
      updated_by: userId,
      isPublic: false,
      shareCode: this.generateShareCode()
    };

    const matches = await this.getMatches();
    matches.push(newMatch);
    
    await this.saveMatches(matches);
    await this.saveCurrentMatch(newMatch);
    
    return newMatch;
  }

  // Delete a standalone match
  async deleteMatch(matchId: string): Promise<void> {
    const matches = await this.getMatches();
    const currentMatch = await this.getCurrentMatch();
    
    const updatedMatches = matches.filter(m => m.id !== matchId);
    await this.saveMatches(updatedMatches);
    
    if (currentMatch?.id === matchId) {
      await this.saveCurrentMatch(null);
    }
  }

  // Update a standalone match
  async updateMatch(match: StandaloneMatch): Promise<StandaloneMatch> {
    const updatedMatch = {
      ...match,
      updatedAt: new Date(),
      updated_by: getCurrentUserId()
    };
    
    const matches = await this.getMatches();
    const updatedMatches = matches.map(m => 
      m.id === match.id ? updatedMatch : m
    );
    
    await this.saveMatches(updatedMatches);
    
    const currentMatch = await this.getCurrentMatch();
    if (currentMatch?.id === match.id) {
      await this.saveCurrentMatch(updatedMatch);
    }
    
    return updatedMatch;
  }

  // Set current standalone match
  async setCurrentMatch(match: StandaloneMatch): Promise<void> {
    await this.saveCurrentMatch(match);
  }

  // Update match score
  async updateMatchScore(
    matchId: string, 
    setIndex: number, 
    team1Score: number, 
    team2Score: number
  ): Promise<StandaloneMatch | null> {
    const matches = await this.getMatches();
    const match = matches.find(m => m.id === matchId);
    
    if (!match) return null;
    
    const updatedScores = [...match.scores];
    
    // Ensure we have enough sets
    while (updatedScores.length <= setIndex) {
      updatedScores.push({ team1Score: 0, team2Score: 0 });
    }
    
    // Update the score at the specified index
    updatedScores[setIndex] = { team1Score, team2Score };
    
    const updatedMatch = {
      ...match,
      scores: updatedScores,
      updatedAt: new Date(),
      updated_by: getCurrentUserId()
    };
    
    // Update the match
    await this.updateMatch(updatedMatch);
    
    return updatedMatch;
  }

  // Update match status
  async updateMatchStatus(
    matchId: string,
    status: MatchStatus
  ): Promise<StandaloneMatch | null> {
    const matches = await this.getMatches();
    const match = matches.find(m => m.id === matchId);
    
    if (!match) return null;
    
    const updatedMatch = {
      ...match,
      status,
      updatedAt: new Date(),
      updated_by: getCurrentUserId()
    };
    
    // Update the match
    await this.updateMatch(updatedMatch);
    
    return updatedMatch;
  }

  // Complete a match
  async completeMatch(
    matchId: string,
    scoringSettings?: ScoringSettings
  ): Promise<StandaloneMatch | null> {
    const matches = await this.getMatches();
    const match = matches.find(m => m.id === matchId);
    
    if (!match) return null;
    
    // Get scoring settings with badminton defaults
    const settings = scoringSettings || getDefaultScoringSettings();
    
    // Determine winner based on scores
    const result = determineMatchWinnerAndLoser(match, settings);
    if (!result) return null;
    
    const { winner, loser } = result;
    
    const updatedMatch = {
      ...match,
      status: "COMPLETED" as MatchStatus,
      winner,
      loser,
      updatedAt: new Date(),
      updated_by: getCurrentUserId()
    };
    
    // Update the match
    await this.updateMatch(updatedMatch);
    
    return updatedMatch;
  }

  // Generate a unique share code
  private generateShareCode(): string {
    // Generate a random 6-character alphanumeric code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  // Get a match by share code
  async getMatchByShareCode(shareCode: string): Promise<StandaloneMatch | null> {
    const matches = await this.getMatches();
    return matches.find(m => m.shareCode === shareCode) || null;
  }

  // Toggle match publicity
  async toggleMatchPublicity(matchId: string): Promise<StandaloneMatch | null> {
    const matches = await this.getMatches();
    const match = matches.find(m => m.id === matchId);
    
    if (!match) return null;
    
    const updatedMatch = {
      ...match,
      isPublic: !match.isPublic,
      updatedAt: new Date(),
      updated_by: getCurrentUserId()
    };
    
    // Update the match
    await this.updateMatch(updatedMatch);
    
    return updatedMatch;
  }
}

// Create a singleton instance
export const standaloneMatchService = new StandaloneMatchService();
