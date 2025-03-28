
import { Tournament, Team, Court, CourtStatus, TournamentFormat, TournamentStatus, TournamentStage, ScoringSettings } from "@/types/tournament";
import { getDefaultScoringSettings } from "./matchUtils";

// Sample data generation helper
export const createSampleData = (): Tournament => {
  // Sample teams - 38 teams for the specific tournament format
  const teams: Team[] = Array.from({ length: 38 }, (_, i) => ({
    id: `team${i + 1}`,
    name: `Team ${i + 1}`,
    players: [
      { id: `p${i}a`, name: `Player ${i + 1}A` },
      { id: `p${i}b`, name: `Player ${i + 1}B` }
    ],
    initialRanking: i + 1
  }));

  // Sample courts - 5 courts as specified
  const courts: Court[] = Array.from({ length: 5 }, (_, i) => ({
    id: `court${i + 1}`,
    name: `Court ${i + 1}`,
    number: i + 1,
    status: "AVAILABLE" as CourtStatus
  }));

  // Create sample tournament with badminton scoring settings
  return {
    id: "sampleTournament",
    name: "38-Team Multi-Stage Tournament",
    description: "Multi-stage tournament with 38 teams progressing through divisions",
    format: "MULTI_STAGE" as TournamentFormat,
    status: "PUBLISHED" as TournamentStatus,
    currentStage: "INITIAL_ROUND" as TournamentStage,
    teams,
    matches: [],
    courts,
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    createdAt: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(),
    divisionProgression: true,
    autoAssignCourts: true,
    scoringSettings: getDefaultScoringSettings() // Add default badminton scoring settings
  };
};
