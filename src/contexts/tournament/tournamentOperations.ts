
import { Tournament, Team, TournamentFormat, Division, TournamentStage, TournamentCategory } from '@/types/tournament';
import { generateId } from '@/utils/tournamentUtils';
import { createDefaultCategories } from '@/utils/categoryUtils';

export const createNewTournament = (
  tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">,
  tournaments: Tournament[]
) => {
  // Ensure the tournament has default categories if none are provided
  const categories = tournamentData.categories?.length > 0 
    ? tournamentData.categories 
    : createDefaultCategories();
  
  const tournament: Tournament = {
    id: generateId(),
    ...tournamentData,
    categories, // Add categories
    matches: [],
    currentStage: "INITIAL_ROUND",
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  return { tournament, tournaments: [...tournaments, tournament] };
};

export const deleteTournament = (
  tournamentId: string,
  tournaments: Tournament[],
  currentTournament: Tournament | null
): { tournaments: Tournament[]; currentTournament: Tournament | null } => {
  const updatedTournaments = tournaments.filter(t => t.id !== tournamentId);
  const updatedCurrentTournament = currentTournament?.id === tournamentId ? null : currentTournament;
  
  return { tournaments: updatedTournaments, currentTournament: updatedCurrentTournament };
};

export const addTeamToTournament = (team: Team, currentTournament: Tournament): Tournament => {
  return {
    ...currentTournament,
    teams: [...currentTournament.teams, team],
    updatedAt: new Date()
  };
};

export const importTeamsToTournament = (teams: Team[], currentTournament: Tournament): Tournament => {
  return {
    ...currentTournament,
    teams: [...currentTournament.teams, ...teams],
    updatedAt: new Date()
  };
};

export const scheduleMatchInTournament = (
  team1Id: string,
  team2Id: string,
  scheduledTime: Date,
  currentTournament: Tournament,
  courtId?: string
): Tournament => {
  const team1 = currentTournament.teams.find(team => team.id === team1Id);
  const team2 = currentTournament.teams.find(team => team.id === team2Id);

  if (!team1 || !team2) {
    console.error('One or both teams not found in tournament');
    return currentTournament;
  }

  // Determine category from teams (use team1's category, or the first tournament category as fallback)
  const category = team1.category || team2.category || currentTournament.categories[0];
  
  if (!category) {
    console.error('No category found for match');
    return currentTournament;
  }

  const newMatch = {
    id: generateId(),
    tournamentId: currentTournament.id,
    team1: team1,
    team2: team2,
    scores: [],
    division: "INITIAL" as Division,  // Explicitly cast to Division type
    stage: "INITIAL_ROUND" as TournamentStage,  // Explicitly cast to TournamentStage type
    scheduledTime: scheduledTime,
    status: "SCHEDULED",
    courtNumber: courtId ? parseInt(courtId.split('-')[1]) : undefined,
    updatedAt: new Date(),
    category: category  // Add the required category field
  };

  return {
    ...currentTournament,
    matches: [...currentTournament.matches, newMatch],
    updatedAt: new Date()
  };
};

export const generateMultiStageTournament = (currentTournament: Tournament): Tournament => {
  // Placeholder for actual multi-stage tournament generation logic
  // This would involve creating matches for initial rounds, division placement, and playoff knockout stages
  return {
    ...currentTournament,
    updatedAt: new Date()
  };
};

export const moveTeamToDivision = (teamId: string, fromDivision: Division, toDivision: Division, currentTournament: Tournament): Tournament => {
  // Placeholder for actual team division movement logic
  return {
    ...currentTournament,
    updatedAt: new Date()
  };
};

// Add tournament seeding assignment
export const assignTournamentSeeding = (tournamentId: string, tournaments: Tournament[]) => {
  const tournament = tournaments.find(t => t.id === tournamentId);
  if (!tournament) return null;
  
  // Assign seeding by categories
  const updatedTeams = [...tournament.teams];
  
  // Group teams by category
  const teamsByCategory: Record<string, Team[]> = {};
  for (const team of updatedTeams) {
    const categoryId = team.category?.id || 'uncategorized';
    if (!teamsByCategory[categoryId]) {
      teamsByCategory[categoryId] = [];
    }
    teamsByCategory[categoryId].push(team);
  }
  
  // Assign seeding within each category group
  for (const categoryId in teamsByCategory) {
    const teams = teamsByCategory[categoryId];
    teams.forEach((team, index) => {
      team.seed = index + 1;
    });
  }
  
  return {
    ...tournament,
    teams: updatedTeams
  };
};
