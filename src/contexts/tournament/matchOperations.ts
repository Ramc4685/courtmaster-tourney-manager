import { Tournament, Match, Team, Court, MatchStatus, Division, TournamentStage, TournamentFormat, TournamentCategory, StandaloneMatch } from "@/types/tournament";
import { generateId, findMatchById, updateMatchInTournament } from "@/utils/tournamentUtils";
import { addMatchAuditLog, addScoringAuditInfo } from "@/utils/matchAuditUtils";

/**
 * Creates a new tournament
 */
export const createNewTournament = (
  tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">,
  tournaments: Tournament[]
): { tournament: Tournament; tournaments: Tournament[] } => {
  const tournament: Tournament = {
    id: generateId(),
    ...tournamentData,
    matches: [],
    currentStage: "INITIAL_ROUND",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const updatedTournaments = [...tournaments, tournament];
  return { tournament, tournaments: updatedTournaments };
};

/**
 * Deletes a tournament
 */
export const deleteTournament = (
  tournamentId: string,
  tournaments: Tournament[],
  currentTournament: Tournament | null
): { tournaments: Tournament[]; currentTournament: Tournament | null } => {
  const updatedTournaments = tournaments.filter(t => t.id !== tournamentId);
  let updatedCurrentTournament = currentTournament;

  if (currentTournament?.id === tournamentId) {
    updatedCurrentTournament = null;
  }

  return { tournaments: updatedTournaments, currentTournament: updatedCurrentTournament };
};

/**
 * Adds a team to a tournament
 */
export const addTeamToTournament = (team: Team, tournament: Tournament): Tournament => {
  const updatedTournament = {
    ...tournament,
    teams: [...tournament.teams, team],
    updatedAt: new Date()
  };
  return updatedTournament;
};

/**
 * Imports teams to a tournament
 */
export const importTeamsToTournament = (teams: Team[], tournament: Tournament): Tournament => {
  const updatedTournament = {
    ...tournament,
    teams: [...tournament.teams, ...teams],
    updatedAt: new Date()
  };
  return updatedTournament;
};

/**
 * Moves a team to a different division
 */
export const moveTeamToDivision = (teamId: string, fromDivision: Division, toDivision: Division, tournament: Tournament): Tournament => {
  // Find the team
  const team = tournament.teams.find(t => t.id === teamId);
  if (!team) return tournament;

  // Update the team's division
  const updatedTeam = { ...team, division: toDivision };

  // Update the tournament's teams
  const updatedTeams = tournament.teams.map(t => t.id === teamId ? updatedTeam : t);

  // Update the tournament
  const updatedTournament = {
    ...tournament,
    teams: updatedTeams,
    updatedAt: new Date()
  };

  return updatedTournament;
};

/**
 * Schedules a match in a tournament
 */
export const scheduleMatchInTournament = (
  team1Id: string,
  team2Id: string,
  scheduledTime: Date,
  tournament: Tournament,
  courtId?: string,
  categoryId?: string
): Tournament => {
  // Find teams
  const team1 = tournament.teams.find(t => t.id === team1Id);
  const team2 = tournament.teams.find(t => t.id === team2Id);

  if (!team1 || !team2) {
    console.error("Team not found");
    return tournament;
  }

  // Find category if provided
  let category = tournament.categories[0]; // Default to first category
  if (categoryId) {
    const foundCategory = tournament.categories.find(c => c.id === categoryId);
    if (foundCategory) category = foundCategory;
  }

  // Create the match
  const newMatch: Match = {
    id: generateId(),
    tournamentId: tournament.id,
    team1,
    team2,
    scores: [],
    division: "INITIAL",
    stage: tournament.currentStage,
    scheduledTime,
    status: "SCHEDULED",
    category
  };

  // Assign court if provided
  if (courtId) {
    const court = tournament.courts.find(c => c.id === courtId);
    if (court) {
      newMatch.courtNumber = court.number;
    }
  }

  // Update tournament with new match
  const updatedTournament = {
    ...tournament,
    matches: [...tournament.matches, newMatch],
    updatedAt: new Date()
  };

  return updatedTournament;
};

/**
 * Updates match score in a tournament
 */
export const updateMatchScoreInTournament = (
  matchId: string,
  setIndex: number,
  team1Score: number,
  team2Score: number,
  tournament: Tournament,
  scorerName?: string
): Tournament => {
  const match = findMatchById(tournament, matchId);
  if (!match) return tournament;

  // Create a copy of the scores array
  const updatedScores = [...match.scores];

  // Add empty sets if needed
  while (updatedScores.length <= setIndex) {
    updatedScores.push({ team1Score: 0, team2Score: 0 });
  }

  // Update the score for the specified set
  updatedScores[setIndex] = { team1Score, team2Score };

  const updatedMatch = {
    ...match,
    scores: updatedScores,
    updatedAt: new Date()
  };

  const auditedMatch = addScoringAuditInfo(updatedMatch, scorerName || "Unknown Scorer");
  const updatedTournament = updateMatchInTournament(tournament, auditedMatch);
  return updatedTournament;
};

/**
 * Updates match status in a tournament
 */
export const updateMatchStatusInTournament = (
  matchId: string,
  status: MatchStatus,
  tournament: Tournament
): Tournament => {
  const match = findMatchById(tournament, matchId);
  if (!match) return tournament;

  const updatedMatch = { ...match, status, updatedAt: new Date() };
  const auditedMatch = addMatchAuditLog(updatedMatch, `Match status updated to ${status}`);
  const updatedTournament = updateMatchInTournament(tournament, auditedMatch);
  return updatedTournament;
};

/**
 * Completes a match in a tournament
 */
export const completeMatchInTournament = (
  matchId: string,
  tournament: Tournament,
  scorerName?: string
): Tournament => {
  const match = findMatchById(tournament, matchId);
  if (!match) return tournament;

  const updatedMatch = { ...match, status: "COMPLETED", updatedAt: new Date() };
  const auditedMatch = addScoringAuditInfo(updatedMatch, scorerName || "Unknown Scorer");
  const updatedTournament = updateMatchInTournament(tournament, auditedMatch);
  return updatedTournament;
};

/**
 * Generates a multi-stage tournament
 */
export const generateMultiStageTournament = (tournament: Tournament): Tournament => {
  // Implementation would go here
  console.log("Generating multi-stage tournament");
  return tournament;
};

const isStandardMatch = (match: Match | StandaloneMatch): match is Match => {
  return 'tournamentId' in match && 'division' in match && 'stage' in match;
};
