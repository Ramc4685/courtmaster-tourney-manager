
import { Match, Team, TournamentCategory, TournamentStage, MatchStatus, Division } from "@/types/tournament";
import { TournamentFormatHandler } from "./TournamentFormatService";
import { generateId } from "@/utils/tournamentUtils";

export class GroupKnockoutFormat implements TournamentFormatHandler {
  formatName = "Group Stage + Knockout";
  
  description = 
    "A two-phase tournament that begins with round robin groups, followed by " +
    "a knockout stage with the top teams from each group. This format " +
    "combines the fairness of round robin with the excitement of elimination brackets.";
  
  faq = [
    "Q: How many teams advance from each group?\nA: Typically 1-2 teams per group, but this can be configured.",
    "Q: How are teams seeded in the knockout stage?\nA: Usually winners of one group face runners-up from another group.",
    "Q: What if there's a tie in the group standings?\nA: Tie-breakers include head-to-head results, point differential, and goals scored."
  ];

  generateMatches(teams: Team[], category: TournamentCategory): Match[] {
    if (teams.length < 6) {
      console.warn("Need at least 6 teams for a meaningful Group + Knockout tournament");
      return [];
    }

    const matches: Match[] = [];
    
    // Split teams into groups (for sample data, we'll use 2 groups)
    const groupSize = Math.ceil(teams.length / 2);
    const groupA = teams.slice(0, groupSize);
    const groupB = teams.slice(groupSize);
    
    // Generate group stage matches for Group A
    for (let i = 0; i < groupA.length; i++) {
      for (let j = i + 1; j < groupA.length; j++) {
        const match: Match = {
          id: generateId(),
          tournamentId: "sample", // Will be replaced
          team1: groupA[i],
          team2: groupA[j],
          scores: [],
          division: "INITIAL" as Division,
          stage: "GROUP_STAGE" as TournamentStage,
          status: "SCHEDULED" as MatchStatus,
          scheduledTime: new Date(Date.now() + 3600000 * matches.length),
          category: category,
          groupName: "Group A"
        };
        
        matches.push(match);
      }
    }
    
    // Generate group stage matches for Group B
    for (let i = 0; i < groupB.length; i++) {
      for (let j = i + 1; j < groupB.length; j++) {
        const match: Match = {
          id: generateId(),
          tournamentId: "sample", // Will be replaced
          team1: groupB[i],
          team2: groupB[j],
          scores: [],
          division: "INITIAL" as Division,
          stage: "GROUP_STAGE" as TournamentStage,
          status: "SCHEDULED" as MatchStatus,
          scheduledTime: new Date(Date.now() + 3600000 * matches.length),
          category: category,
          groupName: "Group B"
        };
        
        matches.push(match);
      }
    }
    
    // Create knockout stage matches (semifinal)
    if (groupA.length > 0 && groupB.length > 0) {
      // Group A winner vs Group B runner-up
      const semifinal1: Match = {
        id: generateId(),
        tournamentId: "sample",
        team1: groupA[0], // Group A winner (placeholder)
        team2: groupB[1], // Group B runner-up (placeholder)
        scores: [],
        division: "DIVISION_1" as Division,
        stage: "ELIMINATION_ROUND" as TournamentStage,
        bracketRound: 1,
        bracketPosition: 1,
        status: "SCHEDULED" as MatchStatus,
        scheduledTime: new Date(Date.now() + 86400000), // 1 day later
        category: category,
        groupName: "Semifinals"
      };
      
      matches.push(semifinal1);
      
      // Group B winner vs Group A runner-up
      const semifinal2: Match = {
        id: generateId(),
        tournamentId: "sample",
        team1: groupB[0], // Group B winner (placeholder)
        team2: groupA[1], // Group A runner-up (placeholder)
        scores: [],
        division: "DIVISION_1" as Division,
        stage: "ELIMINATION_ROUND" as TournamentStage,
        bracketRound: 1,
        bracketPosition: 2,
        status: "SCHEDULED" as MatchStatus,
        scheduledTime: new Date(Date.now() + 86400000 + 3600000), // 1 day + 1 hour later
        category: category,
        groupName: "Semifinals"
      };
      
      matches.push(semifinal2);
      
      // Final match
      const final: Match = {
        id: generateId(),
        tournamentId: "sample",
        team1: groupA[0], // Placeholder
        team2: groupB[0], // Placeholder
        scores: [],
        division: "DIVISION_1" as Division,
        stage: "ELIMINATION_ROUND" as TournamentStage,
        bracketRound: 2,
        bracketPosition: 1,
        status: "SCHEDULED" as MatchStatus,
        scheduledTime: new Date(Date.now() + 172800000), // 2 days later
        category: category,
        groupName: "Final"
      };
      
      matches.push(final);
    }
    
    return matches;
  }
}
