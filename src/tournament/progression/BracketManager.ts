import { Tournament, Match, Team, TournamentStage, MatchStatus, Division, TournamentCategory, MatchScore } from '@/types/tournament';
import { ValidationError } from '@/utils/errors';
import { generateId } from '@/utils/tournamentUtils';

interface BracketCache {
  tournamentId: string;
  timestamp: Date;
  matches: Match[];
  nextRoundMatches: Match[];
  validationResult: boolean;
}

export class BracketManager {
  private cache: Map<string, BracketCache> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Updates bracket progression after a match is completed
   */
  updateProgression(tournament: Tournament, match: Match): Tournament {
    const cacheKey = this.getCacheKey(tournament.id, match.id);
    const cachedResult = this.getFromCache(cacheKey);
    
    if (cachedResult) {
      return {
        ...tournament,
        matches: cachedResult.matches,
        updatedAt: new Date()
      };
    }

    if (match.status !== MatchStatus.COMPLETED || !match.winner) {
      return tournament;
    }

    const updatedMatches = [...tournament.matches];
    const matchIndex = updatedMatches.findIndex(m => m.id === match.id);
    
    if (matchIndex === -1) {
      throw new ValidationError('Match not found in tournament');
    }

    // Find the next match in the bracket
    const nextMatch = updatedMatches.find(m => 
      m.progression.bracketRound === match.progression.bracketRound + 1 &&
      m.progression.bracketPosition === Math.floor(match.progression.bracketPosition / 2)
    );

    if (nextMatch) {
      const isEvenPosition = match.progression.bracketPosition % 2 === 0;
      const updatedNextMatch: Match = {
        ...nextMatch,
        [isEvenPosition ? 'team2' : 'team1']: match.winner,
        status: this.shouldStartMatch(nextMatch) ? MatchStatus.READY : MatchStatus.SCHEDULED,
        scores: [{
          team1Score: 0,
          team2Score: 0,
          isComplete: false,
          winner: null,
          setNumber: 1,
          timestamp: new Date().toISOString()
        }]
      };
      
      const nextMatchIndex = updatedMatches.findIndex(m => m.id === nextMatch.id);
      updatedMatches[nextMatchIndex] = updatedNextMatch;
    }

    const result = {
      ...tournament,
      matches: updatedMatches,
      updatedAt: new Date()
    };

    // Cache the result
    this.cache.set(cacheKey, {
      tournamentId: tournament.id,
      timestamp: new Date(),
      matches: updatedMatches,
      nextRoundMatches: nextMatch ? [nextMatch] : [],
      validationResult: true
    });

    return result;
  }

  /**
   * Checks if a match should be started based on its teams
   */
  private shouldStartMatch(match: Match): boolean {
    return match.team1 && match.team2 && match.team1.id !== 'TBD' && match.team2.id !== 'TBD';
  }

  /**
   * Generates matches for the next round in a bracket
   */
  generateNextRound(tournament: Tournament, currentRound: number): Match[] {
    const cacheKey = this.getCacheKey(tournament.id, `round_${currentRound}`);
    const cachedResult = this.getFromCache(cacheKey);
    
    if (cachedResult) {
      return cachedResult.nextRoundMatches;
    }

    const currentRoundMatches = tournament.matches.filter(m => 
      m.progression.bracketRound === currentRound
    );

    if (currentRoundMatches.length === 0) {
      return [];
    }

    const nextRoundMatches: Match[] = [];
    const matchesInNextRound = Math.ceil(currentRoundMatches.length / 2);

    for (let i = 0; i < matchesInNextRound; i++) {
      const match: Match = {
        id: generateId(),
        tournamentId: tournament.id,
        team1: { 
          id: 'TBD', 
          name: 'TBD', 
          players: [], 
          division: currentRoundMatches[0].division,
          createdAt: new Date(), 
          updatedAt: new Date() 
        },
        team2: { 
          id: 'TBD', 
          name: 'TBD', 
          players: [], 
          division: currentRoundMatches[0].division,
          createdAt: new Date(), 
          updatedAt: new Date() 
        },
        scores: [{
          team1Score: 0,
          team2Score: 0,
          isComplete: false,
          winner: null,
          setNumber: 1,
          timestamp: new Date().toISOString()
        }],
        division: currentRoundMatches[0].division,
        stage: currentRoundMatches[0].stage,
        status: MatchStatus.SCHEDULED,
        category: currentRoundMatches[0].category,
        bracketRound: currentRound + 1,
        bracketPosition: i + 1,
        matchNumber: `${currentRound + 1}-${i + 1}`,
        progression: {
          roundNumber: currentRound + 1,
          bracketPosition: i + 1,
          bracketRound: currentRound + 1,
          path: 'WINNERS'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      nextRoundMatches.push(match);
    }

    // Cache the result
    this.cache.set(cacheKey, {
      tournamentId: tournament.id,
      timestamp: new Date(),
      matches: tournament.matches,
      nextRoundMatches,
      validationResult: true
    });

    return nextRoundMatches;
  }

  /**
   * Handles byes in the bracket
   */
  handleByes(tournament: Tournament): Tournament {
    const firstRoundMatches = tournament.matches.filter(m => 
      m.progression.bracketRound === 1
    );

    const updatedMatches = [...tournament.matches];

    firstRoundMatches.forEach(match => {
      if (match.team1.id === 'BYE' || match.team2.id === 'BYE') {
        const winner = match.team1.id === 'BYE' ? match.team2 : match.team1;
        const updatedMatch = {
          ...match,
          winner,
          status: MatchStatus.COMPLETED,
          scores: [{ team1Score: 0, team2Score: 0 }]
        };

        const matchIndex = updatedMatches.findIndex(m => m.id === match.id);
        updatedMatches[matchIndex] = updatedMatch;

        // Update next match
        const nextMatch = updatedMatches.find(m => 
          m.progression.bracketRound === match.progression.bracketRound + 1 &&
          m.progression.bracketPosition === Math.floor(match.progression.bracketPosition / 2)
        );

        if (nextMatch) {
          const isEvenPosition = match.progression.bracketPosition % 2 === 0;
          const updatedNextMatch = {
            ...nextMatch,
            [isEvenPosition ? 'team2' : 'team1']: winner
          };
          
          const nextMatchIndex = updatedMatches.findIndex(m => m.id === nextMatch.id);
          updatedMatches[nextMatchIndex] = updatedNextMatch;
        }
      }
    });

    return {
      ...tournament,
      matches: updatedMatches,
      updatedAt: new Date()
    };
  }

  /**
   * Validates the bracket structure
   */
  validateBracket(tournament: Tournament): boolean {
    const cacheKey = this.getCacheKey(tournament.id, 'validation');
    const cachedResult = this.getFromCache(cacheKey);
    
    if (cachedResult) {
      return cachedResult.validationResult;
    }

    const matchesByRound = tournament.matches.reduce((rounds, match) => {
      const round = match.progression.bracketRound;
      if (!rounds[round]) rounds[round] = [];
      rounds[round].push(match);
      return rounds;
    }, {} as Record<number, Match[]>);

    const roundNumbers = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
    let isValid = true;

    // Check each round
    for (let i = 0; i < roundNumbers.length; i++) {
      const round = roundNumbers[i];
      const matches = matchesByRound[round];

      // Check number of matches in round
      if (i > 0) {
        const previousRoundMatches = matchesByRound[roundNumbers[i - 1]];
        if (matches.length !== Math.ceil(previousRoundMatches.length / 2)) {
          isValid = false;
          break;
        }
      }

      // Check bracket positions
      const positions = matches.map(m => m.progression.bracketPosition).sort((a, b) => a - b);
      if (!positions.every((pos, index) => pos === index + 1)) {
        isValid = false;
        break;
      }

      // Check match connections
      if (i > 0) {
        for (const match of matches) {
          const previousRoundMatches = matchesByRound[round - 1].filter(m =>
            Math.floor(m.progression.bracketPosition / 2) === match.progression.bracketPosition
          );
          if (previousRoundMatches.length !== 2) {
            isValid = false;
            break;
          }
        }
      }
    }

    // Cache the result
    this.cache.set(cacheKey, {
      tournamentId: tournament.id,
      timestamp: new Date(),
      matches: tournament.matches,
      nextRoundMatches: [],
      validationResult: isValid
    });

    return isValid;
  }

  /**
   * Clears the cache for a specific tournament
   */
  clearCache(tournamentId: string) {
    for (const [key, value] of this.cache.entries()) {
      if (value.tournamentId === tournamentId) {
        this.cache.delete(key);
      }
    }
  }

  private getCacheKey(tournamentId: string, operation: string): string {
    return `${tournamentId}_${operation}`;
  }

  private getFromCache(key: string): BracketCache | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp.getTime() > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }
} 