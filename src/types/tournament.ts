export type Player = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  // New fields
  createdAt?: Date;
  updatedAt?: Date;
  created_by?: string; // User ID
  updated_by?: string; // User ID
};

export type Team = {
  id: string;
  name: string;
  players: Player[];
  seed?: number; // For tournament seeding
  initialRanking?: number; // Initial ranking (#1-#38)
  category?: TournamentCategory; // The category this team belongs to
  // New fields
  createdAt?: Date;
  updatedAt?: Date;
  created_by?: string; // User ID
  updated_by?: string; // User ID
  status?: string; // e.g., "Active", "Inactive"
};

export type Division = "DIVISION_1" | "DIVISION_2" | "DIVISION_3" | "QUALIFIER_DIV1" | "QUALIFIER_DIV2" | "GROUP_DIV3" | "INITIAL";

export type TournamentStage = "INITIAL_ROUND" | "DIVISION_PLACEMENT" | "PLAYOFF_KNOCKOUT" | "GROUP_STAGE" | "ELIMINATION_ROUND" | "COMPLETED";

export type MatchStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type MatchScore = {
  team1Score: number;
  team2Score: number;
};

export type AuditLog = {
  timestamp: Date;
  user_id: string;
  action: string;
  details?: Record<string, any>;
};

export type Match = {
  id: string;
  matchNumber?: string;  // New field: Unique match number for easy reference
  tournamentId: string;
  team1: Team;
  team2: Team;
  scores: MatchScore[];
  division: Division;
  stage: TournamentStage;
  courtNumber?: number;
  scheduledTime?: Date;
  endTime?: Date;  // New field: When the match ended
  scorerName?: string;  // New field: Who entered the scores
  status: MatchStatus;
  winner?: Team;
  loser?: Team;
  bracketRound?: number;
  bracketPosition?: number;
  nextMatchId?: string;
  groupName?: string;
  updatedAt?: Date;
  category: TournamentCategory;
  createdAt?: Date;
  created_by?: string;
  updated_by?: string;
  auditLogs?: AuditLog[];  // New field: Log of all changes to the match
};

export type CourtStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE";

export type Court = {
  id: string;
  name: string;
  number: number;
  status: CourtStatus;
  currentMatch?: Match;
  // New fields
  createdAt?: Date;
  updatedAt?: Date;
  created_by?: string; // User ID
  updated_by?: string; // User ID
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

// Category and TournamentCategory types to match your proposed schema
export type Category = {
  id: string;
  name: string;
  description?: string;
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
  // Link to main category
  category_id?: string; // Foreign key referencing the main sport category
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
  
  // New fields
  created_by?: string; // User ID
  updated_by?: string; // User ID
  tournament_category_id?: string; // ID of the tournament category
  
  // Categories
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

// New type for tournament registration
export type TournamentRegistration = {
  tournamentId: string;
  teamId?: string;
  playerId?: string;
  registrationDate: Date;
  seed?: number;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
};

// Groups for group stage formats
export type Group = {
  id: string;
  name: string;
  teamIds: string[];
  matches?: string[]; // IDs of matches in this group
};

// New type for standalone matches (not part of a tournament)
export type StandaloneMatch = {
  id: string;
  matchNumber?: string; // Add matchNumber field
  team1: Team;
  team2: Team;
  scores: MatchScore[];
  courtNumber?: number;
  courtName?: string; 
  scheduledTime?: Date;
  status: MatchStatus;
  winner?: Team;
  loser?: Team;
  category?: TournamentCategory;
  categoryName?: string;
  tournamentName?: string;
  createdAt: Date;
  updatedAt?: Date;
  created_by?: string;
  updated_by?: string;
  isPublic?: boolean;
  shareCode?: string;
  endTime?: Date;       // Adding the endTime property
  scorerName?: string;  // Adding the scorerName property
  auditLogs?: AuditLog[]; // Adding the auditLogs property
};

// Type to distinguish between scoring sources
export type ScorerType = "TOURNAMENT" | "STANDALONE";

// Helper type for isMatchOfType guard function
export interface MatchCommon {
  id: string;
  team1: Team;
  team2: Team;
  scores: MatchScore[];
  status: MatchStatus;
}

// Type guard to check if a match is a standalone match
export function isStandaloneMatch(match: Match | StandaloneMatch): match is StandaloneMatch {
  return !('tournamentId' in match);
}
