import { Tournament, Match, Team, Division } from '@/types/tournament';
import { TournamentStage, MatchStatus } from '@/types/tournament-enums';
import { generateId } from '@/utils/tournamentUtils';
import { FormatConfig } from '../types';
import { ValidationError } from '@/utils/errors';

interface GroupStanding {
  team: Team;
  points: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  pointsWon: number;
  pointsLost: number;
}

export class GroupStageGenerator {
  /**
   * Validates if tournament meets group stage requirements
   */
  validateRequirements(tournament: Tournament): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const minTeamsPerGroup = 3;

    if (tournament.teams.length < minTeamsPerGroup) {
      errors.push(`Minimum of ${minTeamsPerGroup} teams required for group stage`);
    }

    // Check if teams are seeded if required
    const formatConfig = tournament.formatConfig as FormatConfig;
    if (formatConfig?.seedingEnabled) {
      const unseededTeams = tournament.teams.filter(team => !team.seed);
      if (unseededTeams.length > 0) {
        errors.push('All teams must be seeded for group stage');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generates groups based on team count and seeding
   */
  private generateGroups(teams: Team[], groupCount: number): Team[][] {
    // Sort teams by seed if available
    const sortedTeams = [...teams].sort((a, b) => {
      if (!a.seed || !b.seed) return 0;
      return a.seed - b.seed;
    });

    const groups: Team[][] = Array.from({ length: groupCount }, () => []);
    
    // Distribute teams using snake pattern for balanced groups
    sortedTeams.forEach((team, index) => {
      const groupIndex = index % groupCount;
      groups[groupIndex].push(team);
    });

    return groups;
  }

  /**
   * Generates round-robin matches for a group of teams
   */
  private generateGroupMatches(teams: Team[], groupName: string, tournament: Tournament): Match[] {
    const matches: Match[] = [];
    
    // Generate round-robin matches where each team plays against every other team
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const match: Match = {
          id: generateId(),
          tournamentId: tournament.id,
          team1: teams[i],
          team2: teams[j],
          stage: TournamentStage.GROUP_STAGE,
          status: MatchStatus.SCHEDULED,
          scores: [],
          division: Division.INITIAL, // Default division, should be updated based on category
          groupName,
          bracketRound: 1,
          bracketPosition: matches.length + 1,
          progression: {
            roundNumber: 1,
            bracketPosition: matches.length + 1
          }
        };
        matches.push(match);
      }
    }

    return matches;
  }

  /**
   * Generates all group stage matches
   */
  generateMatches(tournament: Tournament): Match[] {
    const validation = this.validateRequirements(tournament);
    if (!validation.isValid) {
      throw new ValidationError(`Cannot generate group matches: ${validation.errors.join(', ')}`);
    }

    const matches: Match[] = [];
    const groupedTeams = this.groupTeams(tournament.teams);

    // Generate round-robin matches for each group
    Object.entries(groupedTeams).forEach(([groupName, teams]) => {
      const groupMatches = this.generateRoundRobinMatches(tournament, teams, groupName);
      matches.push(...groupMatches);
    });

    return matches;
  }

  /**
   * Groups teams by their assigned group
   */
  private groupTeams(teams: Team[]): Record<string, Team[]> {
    return teams.reduce((groups, team) => {
      const groupName = team.group || 'A';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(team);
      return groups;
    }, {} as Record<string, Team[]>);
  }

  /**
   * Generates round-robin matches for a group
   */
  private generateRoundRobinMatches(tournament: Tournament, teams: Team[], groupName: string): Match[] {
    const matches: Match[] = [];
    
    // Generate matches where each team plays against every other team
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const match: Match = {
          id: generateId(),
          tournamentId: tournament.id,
          team1: teams[i],
          team2: teams[j],
          scores: [],
          division: tournament.format.divisions[0],
          stage: TournamentStage.GROUP_STAGE,
          status: MatchStatus.SCHEDULED,
          courtNumber: undefined,
          bracketRound: 1,
          bracketPosition: matches.length + 1,
          category: tournament.categories[0],
          group: groupName,
          progression: {
            roundNumber: 1,
            bracketPosition: matches.length + 1,
            group: groupName
          },
          updatedAt: new Date()
        };
        matches.push(match);
      }
    }

    return matches;
  }

  /**
   * Calculates standings for a group
   */
  private calculateGroupStandings(matches: Match[], teams: Team[]): GroupStanding[] {
    const standings: Record<string, GroupStanding> = {};

    // Initialize standings for all teams
    teams.forEach(team => {
      standings[team.id] = {
        team,
        points: 0,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        setsWon: 0,
        setsLost: 0,
        pointsWon: 0,
        pointsLost: 0
      };
    });

    // Calculate statistics from matches
    matches.forEach(match => {
      if (match.status !== MatchStatus.COMPLETED || !match.winner) return;

      const team1Standing = standings[match.team1.id];
      const team2Standing = standings[match.team2.id];

      team1Standing.matchesPlayed++;
      team2Standing.matchesPlayed++;

      if (match.winner.id === match.team1.id) {
        team1Standing.matchesWon++;
        team1Standing.points += 2;
        team2Standing.matchesLost++;
        team2Standing.points += match.scores.some(set => set.team2 > 0) ? 1 : 0;
      } else {
        team2Standing.matchesWon++;
        team2Standing.points += 2;
        team1Standing.matchesLost++;
        team1Standing.points += match.scores.some(set => set.team1 > 0) ? 1 : 0;
      }

      // Calculate set and point statistics
      match.scores.forEach(set => {
        team1Standing.setsWon += set.team1 > set.team2 ? 1 : 0;
        team1Standing.setsLost += set.team1 < set.team2 ? 1 : 0;
        team1Standing.pointsWon += set.team1;
        team1Standing.pointsLost += set.team2;

        team2Standing.setsWon += set.team2 > set.team1 ? 1 : 0;
        team2Standing.setsLost += set.team2 < set.team1 ? 1 : 0;
        team2Standing.pointsWon += set.team2;
        team2Standing.pointsLost += set.team1;
      });
    });

    return Object.values(standings).sort((a, b) => {
      // Sort by points
      if (b.points !== a.points) return b.points - a.points;
      // Then by matches won
      if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
      // Then by set difference
      const aSetDiff = a.setsWon - a.setsLost;
      const bSetDiff = b.setsWon - b.setsLost;
      if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
      // Then by point difference
      const aPointDiff = a.pointsWon - a.pointsLost;
      const bPointDiff = b.pointsWon - b.pointsLost;
      return bPointDiff - aPointDiff;
    });
  }

  /**
   * Handles progression after group stage completion
   */
  handleProgression(tournament: Tournament): Tournament {
    const groupMatches = tournament.matches.filter(match => 
      match.stage === TournamentStage.GROUP_STAGE
    );

    if (groupMatches.length === 0) {
      return tournament;
    }

    // Check if all group matches are completed
    const allMatchesComplete = groupMatches.every(match => 
      match.status === MatchStatus.COMPLETED
    );

    if (!allMatchesComplete) {
      return tournament;
    }

    // Calculate standings for each group
    const groupedTeams = this.groupTeams(tournament.teams);
    const groupStandings: Record<string, GroupStanding[]> = {};

    Object.entries(groupedTeams).forEach(([groupName, teams]) => {
      const groupMatches = tournament.matches.filter(match => 
        match.stage === TournamentStage.GROUP_STAGE && 
        match.group === groupName
      );
      groupStandings[groupName] = this.calculateGroupStandings(groupMatches, teams);
    });

    // Determine teams advancing to next stage
    const advancingTeams = this.determineAdvancingTeams(groupStandings, tournament.format);

    // Update tournament with advancing teams and their seeding
    return {
      ...tournament,
      teams: tournament.teams.map(team => {
        const advancing = advancingTeams.find(t => t.team.id === team.id);
        if (advancing) {
          return {
            ...team,
            seed: advancing.seed,
            qualifiedForNextStage: true
          };
        }
        return {
          ...team,
          qualifiedForNextStage: false
        };
      }),
      updatedAt: new Date()
    };
  }

  /**
   * Determines which teams advance to the next stage
   */
  private determineAdvancingTeams(
    groupStandings: Record<string, GroupStanding[]>, 
    format: Tournament['format']
  ): Array<{ team: Team; seed: number }> {
    const advancingTeams: Array<{ team: Team; seed: number }> = [];
    let seedCounter = 1;

    // Get top N teams from each group based on format
    const teamsPerGroup = format.teamsAdvancingPerGroup || 2;

    Object.values(groupStandings).forEach(standings => {
      standings.slice(0, teamsPerGroup).forEach(standing => {
        advancingTeams.push({
          team: standing.team,
          seed: seedCounter++
        });
      });
    });

    return advancingTeams;
  }
} 