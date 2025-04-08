
export type Team = {
  id: string;
  name: string;
  players: Player[];
  members?: { name: string }[]; // Added members field for backward compatibility
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
