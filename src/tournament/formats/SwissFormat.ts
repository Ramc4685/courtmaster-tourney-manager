import { TournamentFormatHandler } from '../progression/types';
import { Tournament, Match, Team, FormatConfig } from '@/types/tournament';
import { TournamentStage, MatchStatus, Division, CategoryType } from '@/types/tournament-enums';
import { generateId } from '@/utils/tournamentUtils';

export class SwissFormat implements TournamentFormatHandler {
  formatName = "Swiss System";
  description = "A tournament format where players are paired based on their current score";

  generateMatches(teams: Team[], config?: FormatConfig): Match[] {
    const rounds = config?.rounds || Math.ceil(Math.log2(teams.length));
    const matches: Match[] = [];
    
    // Generate first round matches randomly
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffledTeams.length - 1; i += 2) {
      matches.push(this.createMatch(
        shuffledTeams[i],
        shuffledTeams[i + 1],
        1,
        Math.floor(i / 2) + 1
      ));
    }

    return matches;
  }

  validateFormat(tournament: Tournament): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (tournament.teams.length < 4) {
      errors.push("Swiss format requires at least 4 teams");
    }

    if (tournament.teams.length % 2 !== 0) {
      errors.push("Swiss format requires an even number of teams");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  generateBracket(teams: Team[], config?: FormatConfig): Match[] {
    return this.generateMatches(teams, config);
  }

  getNextRoundMatches(matches: Match[], currentRound: number): Match[] {
    // Get teams and their scores
    const teamScores = this.calculateTeamScores(matches);
    const sortedTeams = Array.from(teamScores.entries())
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .map(([team]) => team);

    const nextRoundMatches: Match[] = [];
    const usedTeams = new Set<string>();

    // Pair teams with similar scores
    for (let i = 0; i < sortedTeams.length; i++) {
      const team1 = sortedTeams[i];
      if (usedTeams.has(team1.id)) continue;

      // Find the next available team with closest score
      for (let j = i + 1; j < sortedTeams.length; j++) {
        const team2 = sortedTeams[j];
        if (usedTeams.has(team2.id)) continue;

        // Check if these teams have played before
        if (!this.haveTeamsPlayed(matches, team1, team2)) {
          nextRoundMatches.push(this.createMatch(
            team1,
            team2,
            currentRound + 1,
            nextRoundMatches.length + 1
          ));
          usedTeams.add(team1.id);
          usedTeams.add(team2.id);
          break;
        }
      }
    }

    return nextRoundMatches;
  }

  updateMatchProgression(tournament: Tournament, completedMatch: Match): Tournament {
    // In Swiss format, we don't need to update progression as matches are generated based on scores
    return tournament;
  }

  private calculateTeamScores(matches: Match[]): Map<Team, number> {
    const scores = new Map<Team, number>();

    matches.forEach(match => {
      if (match.status === MatchStatus.COMPLETED && match.winner) {
        const currentScore = scores.get(match.winner) || 0;
        scores.set(match.winner, currentScore + 1);
      }
    });

    return scores;
  }

  private haveTeamsPlayed(matches: Match[], team1: Team, team2: Team): boolean {
    return matches.some(match => 
      (match.team1?.id === team1.id && match.team2?.id === team2.id) ||
      (match.team1?.id === team2.id && match.team2?.id === team1.id)
    );
  }

  private createMatch(team1: Team, team2: Team, round: number, position: number): Match {
    return {
      id: generateId(),
      tournamentId: '', // Will be set when added to tournament
      team1,
      team2,
      scores: [],
      division: Division.INITIAL,
      stage: TournamentStage.SWISS_ROUND,
      status: MatchStatus.SCHEDULED,
      bracketRound: round,
      bracketPosition: position,
      matchNumber: `${round}-${position}`,
      category: {
        id: '',
        name: 'Default',
        type: CategoryType.CUSTOM,
        division: Division.INITIAL
      },
      progression: {
        roundNumber: round,
        bracketPosition: position,
        bracketRound: round
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
} 