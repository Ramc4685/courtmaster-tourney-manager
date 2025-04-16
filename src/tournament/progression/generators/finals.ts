import { Tournament, Match, Team, TournamentStage, MatchStatus } from '@/types/tournament';
import { ValidationError } from '@/utils/errors';
import { generateId } from '@/utils/tournamentUtils';

export class FinalsGenerator {
  /**
   * Validates tournament requirements for finals stage
   */
  private validateRequirements(tournament: Tournament): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const qualifiedTeams = this.getQualifiedTeams(tournament);

    if (qualifiedTeams.length < 2) {
      errors.push('Finals require at least 2 qualified teams');
    }

    if (qualifiedTeams.length > 2 && !tournament.format.thirdPlaceMatch) {
      errors.push('More than 2 teams qualified but third place match is not enabled');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Gets teams qualified for finals based on previous stage results
   */
  private getQualifiedTeams(tournament: Tournament): Team[] {
    const previousStage = tournament.currentStage === TournamentStage.FINALS 
      ? TournamentStage.ELIMINATION_ROUND 
      : tournament.currentStage;

    const previousMatches = tournament.matches.filter(match => 
      match.stage === previousStage && 
      match.status === MatchStatus.COMPLETED
    );

    // Get winners from previous stage's final matches
    return previousMatches
      .filter(match => match.winner)
      .map(match => match.winner as Team)
      .slice(0, tournament.format.thirdPlaceMatch ? 4 : 2);
  }

  /**
   * Generates finals matches
   */
  generateMatches(tournament: Tournament): Match[] {
    const validation = this.validateRequirements(tournament);
    if (!validation.isValid) {
      throw new ValidationError(`Cannot generate finals matches: ${validation.errors.join(', ')}`);
    }

    const qualifiedTeams = this.getQualifiedTeams(tournament);
    const matches: Match[] = [];

    // Generate championship match
    const championshipMatch: Match = {
      id: generateId(),
      tournamentId: tournament.id,
      team1: qualifiedTeams[0],
      team2: qualifiedTeams[1],
      scores: [],
      division: tournament.format.divisions[0], // Use first division for finals
      stage: TournamentStage.FINALS,
      status: MatchStatus.SCHEDULED,
      courtNumber: undefined,
      bracketRound: 1,
      bracketPosition: 1,
      category: tournament.categories[0], // Use first category for finals
      updatedAt: new Date()
    };
    matches.push(championshipMatch);

    // Generate third place match if enabled and we have enough teams
    if (tournament.format.thirdPlaceMatch && qualifiedTeams.length >= 4) {
      const thirdPlaceMatch: Match = {
        id: generateId(),
        tournamentId: tournament.id,
        team1: qualifiedTeams[2],
        team2: qualifiedTeams[3],
        scores: [],
        division: tournament.format.divisions[0],
        stage: TournamentStage.FINALS,
        status: MatchStatus.SCHEDULED,
        courtNumber: undefined,
        bracketRound: 1,
        bracketPosition: 2,
        category: tournament.categories[0],
        updatedAt: new Date()
      };
      matches.push(thirdPlaceMatch);
    }

    return matches;
  }

  /**
   * Handles progression after finals completion
   */
  handleProgression(tournament: Tournament): Tournament {
    const finalsMatches = tournament.matches.filter(match => 
      match.stage === TournamentStage.FINALS && 
      match.status === MatchStatus.COMPLETED
    );

    if (finalsMatches.length === 0) {
      return tournament;
    }

    // Update tournament status to completed if all finals matches are done
    const allFinalsComplete = tournament.matches
      .filter(match => match.stage === TournamentStage.FINALS)
      .every(match => match.status === MatchStatus.COMPLETED);

    if (allFinalsComplete) {
      return {
        ...tournament,
        currentStage: TournamentStage.COMPLETED,
        updatedAt: new Date()
      };
    }

    return tournament;
  }
} 