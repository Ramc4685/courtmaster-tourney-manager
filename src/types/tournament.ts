export type Player = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

export type Team = {
  id: string;
  name: string;
  players: Player[];
  seed?: number; // For tournament seeding
  initialRanking?: number; // Initial ranking (#1-#38)
  category?: TournamentCategory; // The category this team belongs to
};

export type Division = "DIVISION_1" | "DIVISION_2" | "DIVISION_3" | "QUALIFIER_DIV1" | "QUALIFIER_DIV2" | "GROUP_DIV3" | "INITIAL";

export type TournamentStage = "INITIAL_ROUND" | "DIVISION_PLACEMENT" | "PLAYOFF_KNOCKOUT" | "GROUP_STAGE" | "ELIMINATION_ROUND" | "COMPLETED";

export type MatchStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type MatchScore = {
  team1Score: number;
  team2Score: number;
};

export type Match = {
  id: string;
  tournamentId: string;
  team1: Team;
  team2: Team;
  scores: MatchScore[];
  division: Division;
  stage: TournamentStage;
  courtNumber?: number;
  scheduledTime?: Date;
  status: MatchStatus;
  winner?: Team;
  loser?: Team;
  bracketRound?: number; // The round in the bracket (1, 2, 3, etc.)
  bracketPosition?: number; // Position within the round
  nextMatchId?: string; // ID of the next match (for advancement)
  groupName?: string; // For group matches (e.g., "Group A")
  updatedAt?: Date; // Added updatedAt field for tracking when the match was last updated
  category: TournamentCategory; // The category this match belongs to
};

export type CourtStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE";

export type Court = {
  id: string;
  name: string;
  number: number;
  status: CourtStatus;
  currentMatch?: Match;
};

export type TournamentFormat = 
  | "SINGLE_ELIMINATION" 
  | "DOUBLE_ELIMINATION" 
  | "ROUND_ROBIN" 
  | "SWISS"
  | "GROUP_KNOCKOUT" 
  | "MULTI_STAGE";

export type TournamentStatus = "DRAFT" | "PUBLISHED" | "IN_PROGRESS" | "COMPLETED";

// Updated scoring settings to include maxTwoPointLeadScore
export type ScoringSettings = {
  maxPoints: number;
  maxSets: number;
  requireTwoPointLead: boolean;
  maxTwoPointLeadScore?: number; // Maximum score for a win when using two-point lead rule
};

// Updated TournamentCategory with description, format, and addDemoData fields
export type TournamentCategory = {
  id: string;
  name: string;
  type: CategoryType;
  isCustom?: boolean;
  customName?: string; // Only used for custom categories
  description?: string; // New field for custom category description
  format?: TournamentFormat; // Format specific to this category
  addDemoData?: boolean; // Flag to indicate if demo data should be loaded for this category
  scoringSettings?: ScoringSettings; // Add support for category-specific scoring settings
};

// Standard badminton category types
export type CategoryType = 
  | "MENS_SINGLES" 
  | "WOMENS_SINGLES" 
  | "MENS_DOUBLES" 
  | "WOMENS_DOUBLES" 
  | "MIXED_DOUBLES"
  | "CUSTOM";

export type Tournament = {
  id: string;
  name: string;
  description?: string;
  format: TournamentFormat;
  status: TournamentStatus;
  currentStage: TournamentStage;
  teams: Team[];
  matches: Match[];
  courts: Court[];
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  divisionProgression?: boolean; // Whether to use the division progression system
  autoAssignCourts?: boolean; // Whether to automatically assign available courts to scheduled matches
  scoringSettings?: ScoringSettings; // Added scoring settings
  
  // New property for categories
  categories: TournamentCategory[];
  
  // Format-specific configuration
  formatConfig?: {
    groupCount?: number;             // For GROUP_KNOCKOUT - number of groups
    teamsPerGroup?: number;          // For GROUP_KNOCKOUT - max teams per group
    advancingTeamsPerGroup?: number; // For GROUP_KNOCKOUT - teams advancing from each group
    swissRounds?: number;            // For SWISS - number of rounds to play
    consolationRounds?: boolean;     // For SINGLE_ELIMINATION - whether to play consolation matches
  };
  
  // Properties for future Firebase/external database integration
  ownerId?: string; // For user authentication and ownership
  isPublic?: boolean; // Whether the tournament is publicly visible
  metadata?: Record<string, any>; // For custom metadata and future extensibility
};

// Groups for group stage formats
export type Group = {
  id: string;
  name: string;
  teamIds: string[];
  matches?: string[]; // IDs of matches in this group
};
