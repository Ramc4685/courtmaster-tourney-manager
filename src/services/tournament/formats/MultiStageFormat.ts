
import { Match, Team, TournamentCategory, TournamentStage, MatchStatus, Division } from "@/types/tournament";
import { TournamentFormatHandler } from "./TournamentFormatService";
import { generateId } from "@/utils/tournamentUtils";

export class MultiStageFormat implements TournamentFormatHandler {
  formatName = "Multi-Stage Tournament";
  
  description = 
    "A flexible tournament format with multiple stages of competition. " +
    "Typically begins with qualifying rounds, followed by division placement, " +
    "and culminates in division-specific playoffs. Ideal for tournaments with " +
    "teams of varying skill levels.";
  
  faq = [
    "Q: How are teams initially assigned to divisions?\nA: Through qualifying rounds or pre-tournament seeding.",
    "Q: Can teams move between divisions?\nA: Yes, teams can be promoted or relegated based on performance.",
    "Q: How are the final winners determined?\nA: Each division typically has its own playoff bracket and champion."
  ];

  generateMatches(teams: Team[], category: TournamentCategory): Match[] {
    if (teams.length < 8) {
      console.warn("Need at least 8 teams for a meaningful Multi-Stage tournament");
      return [];
    }

    const matches: Match[] = [];
    
    // Create initial qualification matches
    for (let i = 0; i < teams.length; i += 2) {
      if (i + 1 < teams.length) {
        const match: Match = {
          id: generateId(),
          tournamentId: "sample", // Will be replaced
          team1: teams[i],
          team2: teams[i + 1],
          scores: [],
          division: "INITIAL" as Division,
          stage: "INITIAL_ROUND" as TournamentStage,
          status: "SCHEDULED" as MatchStatus,
          scheduledTime: new Date(Date.now() + 3600000 * (i / 2)),
          category: category,
          groupName: "Qualification Round"
        };
        
        matches.push(match);
      }
    }
    
    // Create division placement matches
    if (teams.length >= 4) {
      // Division 1 placement match
      const div1Placement: Match = {
        id: generateId(),
        tournamentId: "sample",
        team1: teams[0], // Placeholder
        team2: teams[2], // Placeholder
        scores: [],
        division: "DIVISION_1" as Division,
        stage: "DIVISION_PLACEMENT" as TournamentStage,
        status: "SCHEDULED" as MatchStatus,
        scheduledTime: new Date(Date.now() + 86400000), // 1 day later
        category: category,
        groupName: "Division 1 Placement"
      };
      
      matches.push(div1Placement);
      
      // Division 2 placement match
      const div2Placement: Match = {
        id: generateId(),
        tournamentId: "sample",
        team1: teams[1], // Placeholder
        team2: teams[3], // Placeholder
        scores: [],
        division: "DIVISION_2" as Division,
        stage: "DIVISION_PLACEMENT" as TournamentStage,
        status: "SCHEDULED" as MatchStatus,
        scheduledTime: new Date(Date.now() + 86400000 + 3600000), // 1 day + 1 hour later
        category: category,
        groupName: "Division 2 Placement"
      };
      
      matches.push(div2Placement);
    }
    
    // Create playoff matches
    if (teams.length >= 4) {
      // Division 1 semifinal
      const div1Semifinal: Match = {
        id: generateId(),
        tournamentId: "sample",
        team1: teams[0], // Placeholder
        team2: teams[1], // Placeholder
        scores: [],
        division: "DIVISION_1" as Division,
        stage: "PLAYOFF_KNOCKOUT" as TournamentStage,
        bracketRound: 1,
        bracketPosition: 1,
        status: "SCHEDULED" as MatchStatus,
        scheduledTime: new Date(Date.now() + 172800000), // 2 days later
        category: category,
        groupName: "Division 1 Playoffs"
      };
      
      matches.push(div1Semifinal);
      
      // Division 1 final
      const div1Final: Match = {
        id: generateId(),
        tournamentId: "sample",
        team1: teams[0], // Placeholder
        team2: teams[2], // Placeholder
        scores: [],
        division: "DIVISION_1" as Division,
        stage: "PLAYOFF_KNOCKOUT" as TournamentStage,
        bracketRound: 2,
        bracketPosition: 1,
        status: "SCHEDULED" as MatchStatus,
        scheduledTime: new Date(Date.now() + 259200000), // 3 days later
        category: category,
        groupName: "Division 1 Final"
      };
      
      matches.push(div1Final);
    }
    
    return matches;
  }
}
