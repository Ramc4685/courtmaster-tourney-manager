
import { Tournament, Team, Match, Division, TournamentStage, CourtStatus, CategoryType, MatchStatus } from "@/types/tournament";
import { generateId } from "@/utils/tournamentUtils";

// Creates a new tournament
export const createNewTournament = (
  tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">,
  tournaments: Tournament[]
): { tournament: Tournament; tournaments: Tournament[] } => {
  const newTournament: Tournament = {
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    matches: [],
    currentStage: "INITIAL_ROUND" as TournamentStage,
    ...tournamentData,
  };

  const updatedTournaments = [...tournaments, newTournament];
  return { tournament: newTournament, tournaments: updatedTournaments };
};

// Deletes a tournament
export const deleteTournament = (
  tournamentId: string,
  tournaments: Tournament[],
  currentTournament: Tournament | null
): { tournaments: Tournament[]; currentTournament: Tournament | null } => {
  const updatedTournaments = tournaments.filter(t => t.id !== tournamentId);
  const updatedCurrentTournament = currentTournament && currentTournament.id === tournamentId ? null : currentTournament;

  return { tournaments: updatedTournaments, currentTournament: updatedCurrentTournament };
};

// Adds a team to a tournament
export const addTeamToTournament = (team: Team, tournament: Tournament): Tournament => {
  const updatedTeams = [...tournament.teams, team];

  return {
    ...tournament,
    teams: updatedTeams,
    updatedAt: new Date()
  };
};

// Imports teams to a tournament
export const importTeamsToTournament = (teams: Team[], tournament: Tournament): Tournament => {
  const updatedTeams = [...tournament.teams, ...teams];

  return {
    ...tournament,
    teams: updatedTeams,
    updatedAt: new Date()
  };
};

// Assigns seeding to teams in a tournament
export const assignTournamentSeeding = (tournamentId: string, tournaments: Tournament[]): Tournament | undefined => {
  const tournament = tournaments.find(t => t.id === tournamentId);
  if (!tournament) return undefined;

  // Basic seeding logic (can be expanded)
  const seededTeams = [...tournament.teams].sort((a, b) => (a.initialRanking || 0) - (b.initialRanking || 0));
  const updatedTournament: Tournament = { ...tournament, teams: seededTeams };

  return updatedTournament;
};

// Moves a team to a different division
export const moveTeamToDivision = (teamId: string, fromDivision: Division, toDivision: Division, tournament: Tournament): Tournament => {
  // Implementation would go here
  console.log(`Moving team ${teamId} from ${fromDivision} to ${toDivision}`);
  return tournament;
};

// Generates a multi-stage tournament
export const generateMultiStageTournament = (tournament: Tournament): Tournament => {
  // Implementation would go here
  console.log("Generating multi-stage tournament");
  return tournament;
};

// Updated function to handle categoryId
export const scheduleMatchInTournament = (
  team1Id: string, 
  team2Id: string, 
  scheduledTime: Date, 
  tournament: Tournament, 
  courtId?: string,
  categoryId?: string
): Tournament => {
  // Find the teams
  const team1 = tournament.teams.find(t => t.id === team1Id);
  const team2 = tournament.teams.find(t => t.id === team2Id);
  
  if (!team1 || !team2) {
    console.error("One or both teams not found");
    return tournament;
  }
  
  // Find the court if provided
  const court = courtId ? tournament.courts.find(c => c.id === courtId) : undefined;
  
  // Find the category if provided
  const category = categoryId 
    ? tournament.categories.find(c => c.id === categoryId) 
    : undefined;
  
  // Create a new match
  const newMatch: Match = {
    id: generateId(),
    tournamentId: tournament.id,
    team1,
    team2,
    scores: [],
    division: "INITIAL" as Division,
    stage: "INITIAL_ROUND" as TournamentStage,
    courtNumber: court?.number,
    scheduledTime,
    status: "SCHEDULED" as MatchStatus,
    category: category || { 
      id: "default", 
      name: "Default", 
      type: "CUSTOM" as CategoryType 
    }
  };
  
  // Assign the court if provided
  if (court) {
    // Update court status
    const updatedCourts = tournament.courts.map(c => 
      c.id === court.id 
        ? { ...c, status: "IN_USE" as CourtStatus, currentMatch: newMatch } 
        : c
    );
    
    return {
      ...tournament,
      matches: [...tournament.matches, newMatch],
      courts: updatedCourts,
      updatedAt: new Date()
    };
  }
  
  return {
    ...tournament,
    matches: [...tournament.matches, newMatch],
    updatedAt: new Date()
  };
};
