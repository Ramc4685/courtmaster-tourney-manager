import { Match, Team, Tournament, Division } from '@/types';
import { ValidationError } from '@/domain/services/errors';
import { TournamentFormat } from '@/domain/models/tournament.model';
import { StageGenerator } from './base';

export class EliminationStageGenerator implements StageGenerator {
  private format: TournamentFormat;
  private tournament: Tournament;

  constructor(tournament: Tournament) {
    this.tournament = tournament;
    this.format = tournament.format;
  }

  validateRequirements(teams: Team[]): void {
    if (teams.length < 2) {
      throw new ValidationError('Elimination brackets require at least 2 teams');
    }

    if (this.tournament.seedingEnabled) {
      const hasValidSeeding = teams.every(team => team.seed !== undefined && team.seed > 0);
      if (!hasValidSeeding) {
        throw new ValidationError('All teams must have valid seeding when seeding is enabled');
      }
    }

    if (this.format === TournamentFormat.DOUBLE_ELIMINATION && teams.length < 4) {
      throw new ValidationError('Double elimination requires at least 4 teams');
    }
  }

  generateMatches(teams: Team[]): Match[] {
    this.validateRequirements(teams);
    
    const sortedTeams = this.tournament.seedingEnabled 
      ? teams.sort((a, b) => (a.seed || 0) - (b.seed || 0))
      : teams;

    const firstRoundMatches = this.generateFirstRound(sortedTeams);
    
    if (this.format === TournamentFormat.DOUBLE_ELIMINATION) {
      const losersBracketMatches = this.generateLosersBracket(firstRoundMatches.length);
      return [...firstRoundMatches, ...losersBracketMatches];
    }

    return firstRoundMatches;
  }

  private generateFirstRound(teams: Team[]): Match[] {
    const numTeams = teams.length;
    const numByes = this.calculateByes(numTeams);
    const matches: Match[] = [];
    let matchIndex = 0;

    // Generate first round matches with byes
    for (let i = 0; i < numTeams; i += 2) {
      if (i + 1 >= numTeams) {
        // Handle bye
        matches.push({
          id: `${this.tournament.id}_r1_m${matchIndex}`,
          tournamentId: this.tournament.id,
          round: 1,
          matchNumber: matchIndex + 1,
          team1Id: teams[i].id,
          team2Id: null, // Bye
          winnerId: teams[i].id, // Auto-advance team with bye
          nextMatchId: null, // Will be set after all matches are generated
          bracket: 'WINNERS',
          status: 'COMPLETED'
        });
      } else {
        matches.push({
          id: `${this.tournament.id}_r1_m${matchIndex}`,
          tournamentId: this.tournament.id,
          round: 1,
          matchNumber: matchIndex + 1,
          team1Id: teams[i].id,
          team2Id: teams[i + 1].id,
          winnerId: null,
          nextMatchId: null,
          bracket: 'WINNERS',
          status: 'PENDING'
        });
      }
      matchIndex++;
    }

    // Set next match IDs for progression
    this.setNextMatchIds(matches);
    return matches;
  }

  private generateLosersBracket(numFirstRoundMatches: number): Match[] {
    const loserMatches: Match[] = [];
    const numLoserRounds = Math.ceil(Math.log2(numFirstRoundMatches));
    let matchIndex = numFirstRoundMatches;

    for (let round = 1; round <= numLoserRounds; round++) {
      const matchesInRound = Math.floor(numFirstRoundMatches / Math.pow(2, round));
      
      for (let match = 0; match < matchesInRound; match++) {
        loserMatches.push({
          id: `${this.tournament.id}_lr${round}_m${matchIndex}`,
          tournamentId: this.tournament.id,
          round: round,
          matchNumber: matchIndex + 1,
          team1Id: null, // Will be set when winners bracket matches complete
          team2Id: null,
          winnerId: null,
          nextMatchId: null,
          bracket: 'LOSERS',
          status: 'PENDING'
        });
        matchIndex++;
      }
    }

    // Set next match IDs for losers bracket progression
    this.setLosersBracketNextMatchIds(loserMatches);
    return loserMatches;
  }

  private calculateByes(numTeams: number): number {
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(numTeams)));
    return nextPowerOfTwo - numTeams;
  }

  private setNextMatchIds(matches: Match[]): void {
    const numMatches = matches.length;
    for (let i = 0; i < numMatches; i++) {
      const nextMatchIndex = Math.floor(i / 2);
      if (nextMatchIndex < numMatches / 2) {
        matches[i].nextMatchId = matches[nextMatchIndex + numMatches / 2].id;
      }
    }
  }

  private setLosersBracketNextMatchIds(matches: Match[]): void {
    const numMatches = matches.length;
    for (let i = 0; i < numMatches - 1; i++) {
      const nextMatchIndex = Math.floor(i / 2) + Math.floor(numMatches / 2);
      if (nextMatchIndex < numMatches) {
        matches[i].nextMatchId = matches[nextMatchIndex].id;
      }
    }
  }

  handleProgression(completedMatch: Match, allMatches: Match[]): void {
    if (!completedMatch.winnerId) {
      throw new ValidationError('Cannot progress match without a winner');
    }

    const nextMatch = allMatches.find(m => m.id === completedMatch.nextMatchId);
    if (!nextMatch) return;

    // Determine if this is an even or odd numbered match to place winner in team1 or team2 slot
    const matchNumber = parseInt(completedMatch.id.split('_m')[1]);
    if (matchNumber % 2 === 0) {
      nextMatch.team2Id = completedMatch.winnerId;
    } else {
      nextMatch.team1Id = completedMatch.winnerId;
    }

    // If both teams are set, update match status
    if (nextMatch.team1Id && nextMatch.team2Id) {
      nextMatch.status = 'READY';
    }

    // Handle loser progression for double elimination
    if (this.format === TournamentFormat.DOUBLE_ELIMINATION && completedMatch.bracket === 'WINNERS') {
      const loserId = completedMatch.team1Id === completedMatch.winnerId 
        ? completedMatch.team2Id 
        : completedMatch.team1Id;
      
      // Find corresponding losers bracket match
      const loserMatch = allMatches.find(m => 
        m.bracket === 'LOSERS' && 
        (!m.team1Id || !m.team2Id) && 
        m.round === completedMatch.round
      );

      if (loserMatch) {
        if (!loserMatch.team1Id) {
          loserMatch.team1Id = loserId;
        } else {
          loserMatch.team2Id = loserId;
        }

        if (loserMatch.team1Id && loserMatch.team2Id) {
          loserMatch.status = 'READY';
        }
      }
    }
  }
} 