import { Match, Team, TournamentCategory, Tournament } from "@/types/tournament";
import { TournamentStage, MatchStatus, Division, CategoryType } from "@/types/tournament-enums";
import { TournamentFormatHandler, FormatConfig, MatchProgression } from "./TournamentFormatService";
import { generateId } from "@/utils/tournamentUtils";

export class SingleEliminationFormat implements TournamentFormatHandler {
  formatName = "Single Elimination";
  
  description = 
    "A bracket tournament where competitors face off in head-to-head matches. " +
    "Losers are immediately eliminated, and winners advance to the next round until a champion is determined.";
  
  faq = [
    "Q: How are byes handled?\nA: If the number of teams is not a power of two, byes are assigned to balance the bracket.",
    "Q: How is seeding managed?\nA: Teams can be seeded to ensure top-ranked teams don't face each other early.",
    "Q: Can eliminated teams play consolation matches?\nA: Optional consolation brackets can be set up for eliminated teams."
  ];

  defaultConfig: FormatConfig = {
    seedingEnabled: true,
    consolationBracket: false,
    thirdPlaceMatch: true,
    scoringSettings: {
      matchFormat: 'STANDARD',
      pointsToWin: 21,
      mustWinByTwo: true,
      maxPoints: 30,
      maxSets: 3,
      requireTwoPointLead: true,
      maxTwoPointLeadScore: 30,
      setsToWin: 2
    }
  };

  generateMatches(teams: Team[], category: TournamentCategory, config?: FormatConfig): Match[] {
    if (teams.length < 2) {
      console.warn("Need at least 2 teams for a Single Elimination tournament");
      return [];
    }

    const actualConfig = { ...this.defaultConfig, ...config };
    const seededTeams = actualConfig.seedingEnabled ? this.generateSeeds(teams) : teams;
    const { matches: firstRoundMatches, byes } = this.handleByes(seededTeams);
    
    return this.generateBracket(seededTeams, actualConfig);
  }

  validateFormat(tournament: Tournament): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (tournament.teams.length < 2) {
      errors.push("Tournament must have at least 2 teams");
    }

    if (tournament.matches.some(m => !m.bracketPosition)) {
      errors.push("All matches must have a bracket position");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  generateBracket(teams: Team[], config?: FormatConfig, category?: TournamentCategory): Match[] {
    const matches: Match[] = [];
    const teamCount = teams.length;
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(teamCount)));
    const byeCount = nextPowerOfTwo - teamCount;
    
    // First round matches
    const firstRoundTeams = [...teams];
    const teamsWithMatches = teamCount - byeCount;
    
    for (let i = 0; i < teamsWithMatches; i += 2) {
      if (i + 1 < teamsWithMatches) {
        const bracketPosition = Math.floor(i / 2) + 1;
        const match: Match = {
          id: generateId(),
          tournamentId: generateId(), // Will be replaced with actual tournament ID
          team1: firstRoundTeams[i],
          team2: firstRoundTeams[i + 1],
          scores: [],
          division: Division.INITIAL,
          stage: TournamentStage.ELIMINATION_ROUND,
          bracketRound: 1,
          bracketPosition,
          status: MatchStatus.SCHEDULED,
          category: category || {
            id: generateId(),
            name: "Default Category",
            type: CategoryType.SINGLES,
            division: Division.INITIAL
          },
          progression: {
            roundNumber: 1,
            bracketPosition
          }
        };
        
        matches.push(match);
      }
    }

    // Generate subsequent rounds
    let currentRound = 1;
    let matchesInRound = matches.length;
    
    while (matchesInRound > 1) {
      const nextRoundMatches = this.getNextRoundMatches(matches, currentRound);
      matches.push(...nextRoundMatches);
      currentRound++;
      matchesInRound = Math.floor(matchesInRound / 2);
    }

    // Add third place match if configured
    if (config?.thirdPlaceMatch) {
      const bracketPosition = 2;
      const thirdPlaceMatch: Match = {
        id: generateId(),
        tournamentId: generateId(),
        team1: { 
          id: 'TBD', 
          name: 'Semifinal 1 Loser', 
          players: [],
          division: Division.INITIAL,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        team2: { 
          id: 'TBD', 
          name: 'Semifinal 2 Loser', 
          players: [],
          division: Division.INITIAL,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        scores: [],
        division: Division.INITIAL,
        stage: TournamentStage.THIRD_PLACE,
        bracketRound: currentRound,
        bracketPosition,
        status: MatchStatus.SCHEDULED,
        category: category || {
          id: generateId(),
          name: "Default Category",
          type: CategoryType.SINGLES,
          division: Division.INITIAL
        },
        progression: {
          roundNumber: currentRound,
          bracketPosition
        }
      };
      
      matches.push(thirdPlaceMatch);
    }

    return matches;
  }

  getNextRoundMatches(matches: Match[], currentRound: number): Match[] {
    const currentRoundMatches = matches.filter(m => m.bracketRound === currentRound);
    const nextRoundMatches: Match[] = [];
    
    for (let i = 0; i < currentRoundMatches.length; i += 2) {
      const match1 = currentRoundMatches[i];
      const match2 = currentRoundMatches[i + 1];
      
      if (match1 && match2) {
        const bracketPosition = Math.floor(i / 2) + 1;
        const nextMatch: Match = {
          id: generateId(),
          tournamentId: match1.tournamentId,
          team1: { 
            id: 'TBD', 
            name: 'TBD', 
            players: [],
            division: Division.INITIAL,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          team2: { 
            id: 'TBD', 
            name: 'TBD', 
            players: [],
            division: Division.INITIAL,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          scores: [],
          division: match1.division,
          stage: match1.stage,
          bracketRound: currentRound + 1,
          bracketPosition,
          status: MatchStatus.SCHEDULED,
          category: match1.category,
          progression: {
            roundNumber: currentRound + 1,
            bracketPosition
          }
        };
        
        // Update progression for current matches
        match1.progression = {
          ...match1.progression,
          nextMatchId: nextMatch.id,
          nextMatchPosition: 'team1'
        };
        
        match2.progression = {
          ...match2.progression,
          nextMatchId: nextMatch.id,
          nextMatchPosition: 'team2'
        };
        
        nextRoundMatches.push(nextMatch);
      }
    }
    
    return nextRoundMatches;
  }

  updateMatchProgression(tournament: Tournament, completedMatch: Match): Tournament {
    const updatedTournament = { ...tournament };
    const { matches } = updatedTournament;
    
    if (completedMatch.status !== MatchStatus.COMPLETED || !completedMatch.winner) {
      return updatedTournament;
    }
    
    // Find the next match
    if (completedMatch.progression?.nextMatchId) {
      const nextMatch = matches.find(m => m.id === completedMatch.progression.nextMatchId);
      
      if (nextMatch) {
        const updatedMatch = { ...nextMatch };
        
        // Update the appropriate team in the next match
        if (completedMatch.progression.nextMatchPosition === 'team1') {
          updatedMatch.team1 = completedMatch.winner;
        } else {
          updatedMatch.team2 = completedMatch.winner;
        }
        
        // Update the match in the tournament
        const matchIndex = matches.findIndex(m => m.id === nextMatch.id);
        if (matchIndex !== -1) {
          matches[matchIndex] = updatedMatch;
        }
      }
    }
    
    return updatedTournament;
  }

  generateSeeds(teams: Team[]): Team[] {
    // Simple implementation - could be enhanced with more sophisticated seeding logic
    return [...teams].sort((a, b) => (a.seed || 0) - (b.seed || 0));
  }

  handleByes(teams: Team[]): { matches: Match[]; byes: Team[] } {
    const teamCount = teams.length;
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(teamCount)));
    const byeCount = nextPowerOfTwo - teamCount;
    
    // Teams that get byes should be top seeds
    const byes = teams.slice(0, byeCount);
    const remainingTeams = teams.slice(byeCount);
    
    // Create first round matches for remaining teams
    const matches: Match[] = [];
    for (let i = 0; i < remainingTeams.length; i += 2) {
      if (i + 1 < remainingTeams.length) {
        const match: Match = {
          id: generateId(),
          tournamentId: "sample",
          team1: remainingTeams[i],
          team2: remainingTeams[i + 1],
          scores: [],
          division: "INITIAL" as Division,
          stage: "ELIMINATION_ROUND" as TournamentStage,
          bracketRound: 1,
          bracketPosition: Math.floor(i / 2) + 1,
          status: "SCHEDULED" as MatchStatus,
          progression: {
            roundNumber: 1,
            bracketPosition: Math.floor(i / 2) + 1
          }
        };
        
        matches.push(match);
      }
    }
    
    return { matches, byes };
  }

  validateScore(match: Match, score: number[]): boolean {
    // Implement score validation based on format rules
    if (!match.category?.scoringSettings) {
      return true; // No validation rules defined
    }
    
    const settings = match.category.scoringSettings;
    
    // Check if the score array has the correct length
    if (score.length !== settings.maxSets * 2) {
      return false;
    }
    
    // Validate each set
    for (let i = 0; i < score.length; i += 2) {
      const team1Score = score[i];
      const team2Score = score[i + 1];
      
      // Check if scores are within valid range
      if (team1Score > settings.maxPoints || team2Score > settings.maxPoints) {
        return false;
      }
      
      // Check if winner has enough points
      const maxScore = Math.max(team1Score, team2Score);
      const minScore = Math.min(team1Score, team2Score);
      
      if (maxScore < settings.pointsToWin) {
        return false;
      }
      
      // Check two-point lead rule
      if (settings.mustWinByTwo && maxScore < settings.maxPoints) {
        if (maxScore - minScore < 2) {
          return false;
        }
      }
    }
    
    return true;
  }

  calculateStandings(tournament: Tournament): Team[] {
    // For single elimination, standings are based on how far teams advanced
    const teams = tournament.teams.map(team => ({
      ...team,
      wins: 0,
      losses: 0,
      roundReached: 0
    }));
    
    // Calculate wins, losses, and rounds reached
    tournament.matches.forEach(match => {
      if (match.status === MatchStatus.COMPLETED && match.winner) {
        const winner = teams.find(t => t.id === match.winner?.id);
        const loser = teams.find(t => t.id === (match.team1.id === match.winner.id ? match.team2.id : match.team1.id));
        
        if (winner) {
          winner.wins++;
          winner.roundReached = Math.max(winner.roundReached, match.bracketRound || 0);
        }
        
        if (loser) {
          loser.losses++;
          loser.roundReached = match.bracketRound || 0;
        }
      }
    });
    
    // Sort teams by round reached (descending) and then by wins (descending)
    return teams.sort((a, b) => {
      if (b.roundReached !== a.roundReached) {
        return b.roundReached - a.roundReached;
      }
      return b.wins - a.wins;
    });
  }

  canAddTeams(tournament: Tournament): boolean {
    // Can only add teams if tournament hasn't started
    return tournament.matches.every(m => m.status === MatchStatus.SCHEDULED);
  }

  canRemoveTeams(tournament: Tournament): boolean {
    // Can only remove teams if tournament hasn't started
    return tournament.matches.every(m => m.status === MatchStatus.SCHEDULED);
  }

  getRequiredTeamCount(): { min: number; max?: number } {
    return { min: 2 }; // Single elimination requires at least 2 teams
  }
}
