
import { Match, Team, TournamentCategory, TournamentStage, MatchStatus, Division } from "@/types/tournament";
import { TournamentFormatHandler } from "./TournamentFormatService";
import { generateId } from "@/utils/tournamentUtils";

export class DoubleEliminationFormat implements TournamentFormatHandler {
  formatName = "Double Elimination";
  
  description = 
    "A tournament format where teams have two chances before elimination. " +
    "Initial matches take place in the Winners bracket; upon a loss, a team moves to the Losers bracket. " +
    "A team is eliminated after their second loss.";
  
  faq = [
    "Q: How does the final round work?\nA: The winner of the Winners bracket faces the winner of the Losers bracket in the finals.",
    "Q: What if the Losers bracket winner defeats the Winners bracket winner?\nA: In true double elimination, a second match is played to determine the champion.",
    "Q: How are teams paired in the Losers bracket?\nA: Teams who lost in the same round of the Winners bracket are typically placed in different portions of the Losers bracket."
  ];

  generateMatches(teams: Team[], category: TournamentCategory): Match[] {
    if (teams.length < 4) {
      console.warn("Need at least 4 teams for a meaningful Double Elimination tournament");
      return [];
    }

    const matches: Match[] = [];
    
    // For sample data, we'll create both winners and losers bracket matches
    // First, create winners bracket first round
    for (let i = 0; i < teams.length; i += 2) {
      if (i + 1 < teams.length) {
        const match: Match = {
          id: generateId(),
          tournamentId: "sample", // Will be replaced
          team1: teams[i],
          team2: teams[i + 1],
          scores: [],
          division: "DIVISION_1" as Division, // Winners bracket
          stage: "ELIMINATION_ROUND" as TournamentStage,
          bracketRound: 1,
          bracketPosition: Math.floor(i / 2) + 1,
          status: "SCHEDULED" as MatchStatus,
          scheduledTime: new Date(Date.now() + 3600000 * (i / 2)),
          category: category,
          groupName: "Winners Bracket"
        };
        
        matches.push(match);
      }
    }
    
    // Create a sample losers bracket match (in a real implementation, this would be generated dynamically)
    if (teams.length >= 4) {
      const losersBracketMatch: Match = {
        id: generateId(),
        tournamentId: "sample",
        team1: teams[2], // Using team 3 as a placeholder
        team2: teams[3], // Using team 4 as a placeholder
        scores: [],
        division: "DIVISION_2" as Division, // Losers bracket
        stage: "ELIMINATION_ROUND" as TournamentStage,
        bracketRound: 1,
        bracketPosition: 1,
        status: "SCHEDULED" as MatchStatus,
        scheduledTime: new Date(Date.now() + 7200000), // 2 hours later
        category: category,
        groupName: "Losers Bracket"
      };
      
      matches.push(losersBracketMatch);
    }
    
    // Create a placeholder final match
    if (teams.length >= 2) {
      const finalMatch: Match = {
        id: generateId(),
        tournamentId: "sample",
        team1: teams[0], // Using team 1 as a placeholder
        team2: teams[1], // Using team 2 as a placeholder
        scores: [],
        division: "DIVISION_1" as Division,
        stage: "ELIMINATION_ROUND" as TournamentStage,
        bracketRound: 3, // Final round
        bracketPosition: 1,
        status: "SCHEDULED" as MatchStatus,
        scheduledTime: new Date(Date.now() + 10800000), // 3 hours later
        category: category,
        groupName: "Final"
      };
      
      matches.push(finalMatch);
    }
    
    return matches;
  }
}
