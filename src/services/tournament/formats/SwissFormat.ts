
import { Match, Team, TournamentCategory, TournamentStage, MatchStatus, Division } from "@/types/tournament";
import { TournamentFormatHandler } from "./TournamentFormatService";
import { generateId } from "@/utils/tournamentUtils";

export class SwissFormat implements TournamentFormatHandler {
  formatName = "Swiss System";
  
  description = 
    "A tournament format where teams play a fixed number of rounds, with pairings " +
    "determined by matching teams with similar records. No team is eliminated " +
    "until all rounds are completed, making it ideal for tournaments with time constraints.";
  
  faq = [
    "Q: How many rounds are typically played in a Swiss tournament?\nA: For n teams, log2(n) rounds are recommended, but any number is possible.",
    "Q: How are pairings determined?\nA: Teams with similar records are paired, making sure teams don't play each other more than once.",
    "Q: How are final standings determined?\nA: By total points, with tie-breakers like Buchholz scores (sum of opponents' scores)."
  ];

  generateMatches(teams: Team[], category: TournamentCategory): Match[] {
    if (teams.length < 4) {
      console.warn("Need at least 4 teams for a meaningful Swiss tournament");
      return [];
    }

    const matches: Match[] = [];
    
    // For Swiss format, we'll generate sample matches for 2 rounds
    
    // Round 1 - Initial pairings (can be random or seeded)
    for (let i = 0; i < teams.length; i += 2) {
      if (i + 1 < teams.length) {
        const match: Match = {
          id: generateId(),
          tournamentId: "sample", // Will be replaced
          team1: teams[i],
          team2: teams[i + 1],
          scores: [],
          division: "INITIAL" as Division,
          stage: "GROUP_STAGE" as TournamentStage,
          status: "SCHEDULED" as MatchStatus,
          scheduledTime: new Date(Date.now() + 3600000 * (i / 2)),
          category: category,
          groupName: "Swiss Round 1"
        };
        
        matches.push(match);
      }
    }
    
    // Round 2 - Just for sample data, we'll create placeholder matches
    // In a real Swiss tournament, these would be determined after Round 1 results
    if (teams.length >= 4) {
      // Hypothetical second round pairings (would normally depend on first round results)
      const round2Pairs = [
        [0, 2], // Team 1 vs Team 3
        [1, 3]  // Team 2 vs Team 4
      ];
      
      for (let i = 0; i < round2Pairs.length; i++) {
        if (round2Pairs[i][0] < teams.length && round2Pairs[i][1] < teams.length) {
          const match: Match = {
            id: generateId(),
            tournamentId: "sample",
            team1: teams[round2Pairs[i][0]],
            team2: teams[round2Pairs[i][1]],
            scores: [],
            division: "INITIAL" as Division,
            stage: "GROUP_STAGE" as TournamentStage,
            status: "SCHEDULED" as MatchStatus,
            scheduledTime: new Date(Date.now() + 7200000 + 3600000 * i), // 2+ hours later
            category: category,
            groupName: "Swiss Round 2"
          };
          
          matches.push(match);
        }
      }
    }
    
    return matches;
  }
}
