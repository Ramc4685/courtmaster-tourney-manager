import { Tournament, Team, Match, Division, TournamentStage, CourtStatus, CategoryType, MatchStatus } from "@/types/tournament";
import { generateId } from "@/utils/tournamentUtils";
import { prepareNewEntity, prepareUpdatedEntity, getCurrentUserId } from "@/utils/auditUtils";
import { generateMatchNumber, addMatchAuditLog } from "@/utils/matchAuditUtils";

// Creates a new tournament
export const createNewTournament = (
  tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">,
  tournaments: Tournament[]
): { tournament: Tournament; tournaments: Tournament[] } => {
  const now = new Date();
  const userId = getCurrentUserId();
  
  const newTournament: Tournament = {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    created_by: userId,
    updated_by: userId,
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
  // Apply audit fields to the team
  const teamWithAudit = prepareNewEntity(team);
  const updatedTeams = [...tournament.teams, teamWithAudit];

  // Update the tournament with audit fields
  return prepareUpdatedEntity({
    ...tournament,
    teams: updatedTeams
  });
};

// Imports teams to a tournament
export const importTeamsToTournament = (teams: Team[], tournament: Tournament): Tournament => {
  const userId = getCurrentUserId();
  const now = new Date();
  
  // Add audit fields to each team
  const teamsWithAudit = teams.map(team => ({
    ...team,
    createdAt: now,
    updatedAt: now,
    created_by: userId,
    updated_by: userId
  }));
  
  const updatedTeams = [...tournament.teams, ...teamsWithAudit];

  // Update tournament with audit fields
  return {
    ...tournament,
    teams: updatedTeams,
    updatedAt: now,
    updated_by: userId
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

// Updated function to handle matchNumber and audit fields
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
  
  // Get current user ID for audit fields
  const userId = getCurrentUserId();
  const now = new Date();
  
  // Generate a unique match number
  const matchNumber = generateMatchNumber(tournament);
  
  // Create a new match with audit fields and match number
  const newMatch: Match = {
    id: generateId(),
    matchNumber, // Add the generated match number
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
    },
    createdAt: now,
    updatedAt: now,
    created_by: userId,
    updated_by: userId,
    auditLogs: [{ // Initialize audit logs with a creation entry
      timestamp: now,
      user_id: userId,
      action: 'MATCH_CREATED',
      details: {
        scheduledTime,
        courtId: court?.id,
        team1Id: team1.id,
        team2Id: team2.id
      }
    }]
  };
  
  // Assign the court if provided
  if (court) {
    // Update court status with audit fields
    const updatedCourts = tournament.courts.map(c => 
      c.id === court.id 
        ? { 
            ...c, 
            status: "IN_USE" as CourtStatus, 
            currentMatch: newMatch,
            updatedAt: now,
            updated_by: userId
          } 
        : c
    );
    
    return {
      ...tournament,
      matches: [...tournament.matches, newMatch],
      courts: updatedCourts,
      updatedAt: now,
      updated_by: userId
    };
  }
  
  return {
    ...tournament,
    matches: [...tournament.matches, newMatch],
    updatedAt: now,
    updated_by: userId
  };
};
