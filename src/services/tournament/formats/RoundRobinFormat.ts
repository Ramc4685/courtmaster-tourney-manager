
import { Match, Team, TournamentCategory, TournamentStage, MatchStatus, Division } from "@/types/tournament";
import { TournamentFormatHandler } from "./TournamentFormatService";
import { generateId } from "@/utils/tournamentUtils";

export class RoundRobinFormat implements TournamentFormatHandler {
  formatName = "Round Robin";
  
  description = 
    "A tournament format where every team plays against every other team. " +
    "Final standings are determined by cumulative wins, losses, and points. " +
    "This format ensures all teams play the same number of matches.";
  
  faq = [
    "Q: How many matches are played in a round robin tournament?\nA: For n teams, there are n*(n-1)/2 total matches.",
    "Q: How are ties in the standings resolved?\nA: Typically by head-to-head results, point differential, or total points scored.",
    "Q: Can round robin tournaments have multiple groups?\nA: Yes, larger tournaments often use multiple round robin groups followed by playoffs."
  ];

  generateMatches(teams: Team[], category: TournamentCategory): Match[] {
    if (teams.length < 3) {
      console.warn("Need at least 3 teams for a meaningful Round Robin tournament");
      return [];
    }

    const matches: Match[] = [];
    
    // For each pair of teams, create a match
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const matchIndex = matches.length;
        const match: Match = {
          id: generateId(),
          tournamentId: "sample", // Will be replaced
          team1: teams[i],
          team2: teams[j],
          scores: [],
          division: "INITIAL" as Division,
          stage: "GROUP_STAGE" as TournamentStage,
          status: "SCHEDULED" as MatchStatus,
          scheduledTime: new Date(Date.now() + 3600000 * matchIndex), // Schedule 1 hour apart
          category: category,
          groupName: "Round Robin"
        };
        
        matches.push(match);
      }
    }
    
    return matches;
  }
}
