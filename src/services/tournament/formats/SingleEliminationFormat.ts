
import { Match, Team, TournamentCategory, TournamentStage, MatchStatus, Division } from "@/types/tournament";
import { TournamentFormatHandler } from "./TournamentFormatService";
import { generateId } from "@/utils/tournamentUtils";

export class SingleEliminationFormat implements TournamentFormatHandler {
  formatName = "Single Elimination";
  
  description = 
    "A bracket tournament where competitors face off in head-to-head matches. " +
    "Losers are immediately eliminated, and winners advance to the next round until a champion is determined.";
  
  faq = [
    "Q: How are byes handled?\nA: If the number of teams is not a power of two, byes are assigned to balance the bracket.",
    "Q: How is seeding managed?\nA: Teams can be seeded to ensure top-ranked teams don't face each other early.",
    "Q: Can eliminated teams play consolation matches?\nA: Optional consolation brackets can be set up for eliminated teams."
  ];

  generateMatches(teams: Team[], category: TournamentCategory): Match[] {
    if (teams.length < 2) {
      console.warn("Need at least 2 teams for a Single Elimination tournament");
      return [];
    }

    const matches: Match[] = [];
    
    // Calculate the number of teams in the first round
    // For single elimination, we need a power of 2 number of slots
    const teamCount = teams.length;
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(teamCount)));
    const byeCount = nextPowerOfTwo - teamCount;
    
    // Create first round matches
    const firstRoundTeams = [...teams];
    
    // If we have byes, some teams will automatically advance
    const teamsWithMatches = teamCount - byeCount;
    
    // Generate first round matches
    for (let i = 0; i < teamsWithMatches; i += 2) {
      if (i + 1 < teamsWithMatches) {
        const match: Match = {
          id: generateId(),
          tournamentId: "sample", // Will be replaced by actual tournament ID
          team1: firstRoundTeams[i],
          team2: firstRoundTeams[i + 1],
          scores: [],
          division: "INITIAL" as Division,
          stage: "ELIMINATION_ROUND" as TournamentStage,
          bracketRound: 1,
          bracketPosition: Math.floor(i / 2) + 1,
          status: "SCHEDULED" as MatchStatus,
          scheduledTime: new Date(Date.now() + 3600000 * (i / 2)), // Schedule 1 hour apart
          category: category
        };
        
        matches.push(match);
      }
    }
    
    // For a typical tournament display, we'd also create placeholder matches
    // for future rounds, but we'll skip that for sample data
    
    return matches;
  }
}
