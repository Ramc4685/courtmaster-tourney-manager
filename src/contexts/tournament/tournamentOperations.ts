import { Tournament, Team, Match, Division, TournamentStage } from "@/types/tournament";
import { generateId, updateMatchInTournament } from "@/utils/tournamentUtils";
import { createMatch } from "@/utils/matchUtils";
import { createInitialRoundMatches, assignPlayerSeeding } from "@/utils/tournamentProgressionUtils";
import { autoAssignCourts } from "@/utils/courtUtils";

// Create a new tournament
export const createNewTournament = (
  tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">,
  existingTournaments: Tournament[]
): { tournament: Tournament, tournaments: Tournament[] } => {
  const newTournament: Tournament = {
    ...tournamentData,
    id: generateId(),
    matches: [],
    currentStage: "INITIAL_ROUND", // Default stage
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const updatedTournaments = [...existingTournaments, newTournament];
  
  return { tournament: newTournament, tournaments: updatedTournaments };
};

// Delete tournament
export const deleteTournament = (
  tournamentId: string, 
  tournaments: Tournament[], 
  currentTournament: Tournament | null
): { tournaments: Tournament[], currentTournament: Tournament | null } => {
  const updatedTournaments = tournaments.filter(t => t.id !== tournamentId);
  
  const updatedCurrentTournament = 
    currentTournament?.id === tournamentId ? null : currentTournament;
  
  return { 
    tournaments: updatedTournaments, 
    currentTournament: updatedCurrentTournament 
  };
};

// Add team to current tournament
export const addTeamToTournament = (
  team: Team, 
  currentTournament: Tournament
): Tournament => {
  return {
    ...currentTournament,
    teams: [...currentTournament.teams, team],
    updatedAt: new Date()
  };
};

// Import multiple teams at once
export const importTeamsToTournament = (
  teams: Team[], 
  currentTournament: Tournament
): Tournament => {
  return {
    ...currentTournament,
    teams: [...currentTournament.teams, ...teams],
    updatedAt: new Date()
  };
};

// Schedule a new match with date and time
export const scheduleMatchInTournament = (
  team1Id: string, 
  team2Id: string, 
  scheduledTime: Date, 
  currentTournament: Tournament,
  courtId?: string
): Tournament => {
  const team1 = currentTournament.teams.find(t => t.id === team1Id);
  const team2 = currentTournament.teams.find(t => t.id === team2Id);
  
  if (!team1 || !team2) return currentTournament;
  
  let courtNumber;
  let updatedCourts = [...currentTournament.courts];
  
  if (courtId) {
    const court = currentTournament.courts.find(c => c.id === courtId);
    if (court) {
      courtNumber = court.number;
      // Update court status if a court is assigned
      const courtIndex = updatedCourts.findIndex(c => c.id === courtId);
      if (courtIndex >= 0) {
        updatedCourts[courtIndex] = {
          ...updatedCourts[courtIndex],
          status: "IN_USE"
        };
      }
    }
  }
  
  const newMatch = createMatch(
    currentTournament.id,
    team1,
    team2,
    "INITIAL",
    currentTournament.currentStage,
    scheduledTime,
    courtNumber
  );
  
  return {
    ...currentTournament,
    matches: [...currentTournament.matches, newMatch],
    courts: updatedCourts,
    updatedAt: new Date()
  };
};

// Generate the multi-stage tournament with scheduled times
export const generateMultiStageTournament = (currentTournament: Tournament): Tournament => {
  // Need 38 teams
  if (currentTournament.teams.length !== 38) {
    console.warn("This tournament format requires exactly 38 teams");
    return currentTournament;
  }
  
  // First, apply proper seeding to all players (1-38)
  const seededTournament = assignPlayerSeeding(currentTournament);
  console.log("[DEBUG] Applied seeding 1-38 to all players for multi-stage tournament");
  
  // Then create matches based on seeding
  const matches = createInitialRoundMatches(seededTournament);
  
  return {
    ...seededTournament,
    matches,
    currentStage: "INITIAL_ROUND",
    status: "IN_PROGRESS",
    updatedAt: new Date()
  };
};

// Move team to a different division based on results
export const moveTeamToDivision = (
  teamId: string, 
  fromDivision: Division, 
  toDivision: Division,
  currentTournament: Tournament
): Tournament => {
  // For simplicity, we're just updating existing matches' division
  const updatedMatches = currentTournament.matches.map(match => {
    if ((match.team1.id === teamId || match.team2.id === teamId) && 
        match.division === fromDivision && 
        match.status !== "COMPLETED") {
      return { ...match, division: toDivision };
    }
    return match;
  });
  
  return {
    ...currentTournament,
    matches: updatedMatches,
    updatedAt: new Date()
  };
};

// Add new function to assign or update seeding
export const assignTournamentSeeding = (tournamentId: string, tournaments: Tournament[]): Tournament | null => {
  const tournament = tournaments.find(t => t.id === tournamentId);
  if (!tournament) return null;
  
  // Apply seeding based on initial ranking
  const seededTournament = assignPlayerSeeding(tournament);
  console.log(`[DEBUG] Assigned or updated seeding for ${seededTournament.teams.length} players in tournament ${tournamentId}`);
  
  return seededTournament;
};
