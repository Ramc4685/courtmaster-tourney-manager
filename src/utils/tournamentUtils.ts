
import { Tournament, Match, Court, Team, MatchStatus, CourtStatus } from "@/types/tournament";

// Generate unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Find match by ID
export const findMatchById = (tournament: Tournament, matchId: string): Match | undefined => {
  return tournament.matches.find(m => m.id === matchId);
};

// Find court by ID
export const findCourtById = (tournament: Tournament, courtId: string): Court | undefined => {
  return tournament.courts.find(c => c.id === courtId);
};

// Find court by number
export const findCourtByNumber = (tournament: Tournament, courtNumber: number): Court | undefined => {
  return tournament.courts.find(c => c.number === courtNumber);
};

// Update a match in tournament
export const updateMatchInTournament = (tournament: Tournament, updatedMatch: Match): Tournament => {
  const updatedMatches = tournament.matches.map(m => 
    m.id === updatedMatch.id ? updatedMatch : m
  );
  
  return {
    ...tournament,
    matches: updatedMatches,
    updatedAt: new Date()
  };
};

// Update a court in tournament
export const updateCourtInTournament = (tournament: Tournament, updatedCourt: Court): Tournament => {
  const updatedCourts = tournament.courts.map(c => 
    c.id === updatedCourt.id ? updatedCourt : c
  );
  
  return {
    ...tournament,
    courts: updatedCourts,
    updatedAt: new Date()
  };
};

// Free up a court
export const freeCourt = (tournament: Tournament, courtNumber: number): Tournament => {
  const courtIndex = tournament.courts.findIndex(c => c.number === courtNumber);
  
  if (courtIndex < 0) return tournament;
  
  const updatedCourts = [...tournament.courts];
  updatedCourts[courtIndex] = {
    ...updatedCourts[courtIndex],
    status: "AVAILABLE" as CourtStatus,
    currentMatch: undefined
  };
  
  return {
    ...tournament,
    courts: updatedCourts,
    updatedAt: new Date()
  };
};

// Sort teams by ranking
export const sortTeamsByRanking = (teams: Team[]): Team[] => {
  return [...teams].sort((a, b) => (a.initialRanking || 999) - (b.initialRanking || 999));
};

// Check if all matches in a stage are completed
export const areAllMatchesInStageCompleted = (tournament: Tournament, stage: string): boolean => {
  const stageMatches = tournament.matches.filter(m => m.stage === stage);
  return stageMatches.every(m => m.status === "COMPLETED");
};

// Find next scheduled match without court
export const findNextScheduledMatch = (tournament: Tournament): Match | undefined => {
  return tournament.matches.find(
    m => m.status === "SCHEDULED" && !m.courtNumber
  );
};
