import { databases, APPWRITE_DATABASE_ID } from '@/lib/appwrite';
import { TeamEntity, PlayerEntity, teamFromBackend, teamToBackend, playerFromBackend, playerToBackend } from '@/utils/adapters/teamAdapter';
import { COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';

export const teamService = {
  /**
   * Create a single team for a tournament
   * @param team Team data without ID
   * @returns Created team with ID
   */
  async createTeam(team: Omit<TeamEntity, "id">): Promise<TeamEntity> {
    const payload = teamToBackend(team);

    // Create the team document
    const document = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.TEAMS,
      'unique()',
      payload
    );

    const createdTeam = teamFromBackend(document);

    // If team has players, create them
    if (team.players && team.players.length > 0) {
      const createdPlayers = await this.createPlayersForTeam(createdTeam.id, team.players);
      createdTeam.players = createdPlayers;
    }

    return createdTeam;
  },

  /**
   * Bulk create teams for a tournament
   * @param tournamentId Tournament ID
   * @param teams Array of team data
   * @returns Array of created teams
   */
  async createTeamsInBulk(tournamentId: string, teams: Omit<TeamEntity, "id">[]): Promise<TeamEntity[]> {
    const createdTeams: TeamEntity[] = [];

    // Process teams sequentially to ensure proper error handling
    for (const team of teams) {
      // Ensure tournament ID is set
      team.tournamentId = tournamentId;

      const createdTeam = await this.createTeam(team);
      createdTeams.push(createdTeam);
    }

    return createdTeams;
  },

  /**
   * Get all teams for a tournament
   * @param tournamentId Tournament ID
   * @param divisionId Optional division ID to filter teams
   * @returns Array of teams with their players
   */
  async getTeamsByTournament(tournamentId: string, divisionId?: string): Promise<TeamEntity[]> {
    const queries = [Query.equal('tournament_id', tournamentId)];

    if (divisionId) {
      queries.push(Query.equal('division_id', divisionId));
    }

    queries.push(Query.orderAsc('name'));

    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.TEAMS,
      queries
    );

    const teams = response.documents.map(teamFromBackend);

    // Fetch players for each team
    for (const team of teams) {
      const players = await this.getPlayersByTeam(team.id);
      team.players = players;
    }

    return teams;
  },

  /**
   * Get players for a team
   * @param teamId Team ID
   * @returns Array of players
   */
  async getPlayersByTeam(teamId: string): Promise<PlayerEntity[]> {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.PLAYERS,
      [Query.equal('team_id', teamId)]
    );

    return response.documents.map(playerFromBackend);
  },

  /**
   * Create players for a team
   * @param teamId Team ID
   * @param players Array of player data
   * @returns Array of created players
   */
  async createPlayersForTeam(teamId: string, players: Omit<PlayerEntity, "id">[]): Promise<PlayerEntity[]> {
    const createdPlayers: PlayerEntity[] = [];

    // Process players sequentially to ensure proper error handling
    for (const player of players) {
      // Ensure team ID is set
      player.teamId = teamId;

      const payload = playerToBackend(player);

      const document = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.PLAYERS,
        'unique()',
        payload
      );

      createdPlayers.push(playerFromBackend(document));
    }

    return createdPlayers;
  },

  /**
   * Get a single team by ID
   * @param teamId Team ID
   * @param includePlayers Whether to include players
   * @returns Team data
   */
  async getTeam(teamId: string, includePlayers = true): Promise<TeamEntity> {
    const document = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.TEAMS,
      teamId
    );

    const team = teamFromBackend(document);

    if (includePlayers) {
      team.players = await this.getPlayersByTeam(teamId);
    }

    return team;
  },

  /**
   * Update a team
   * @param teamId Team ID
   * @param data Updated team data
   * @returns Updated team
   */
  async updateTeam(teamId: string, data: Partial<TeamEntity>): Promise<TeamEntity> {
    const payload = teamToBackend(data);

    const document = await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.TEAMS,
      teamId,
      payload
    );

    const updatedTeam = teamFromBackend(document);

    // If players are provided, handle player updates
    if (data.players) {
      // First get existing players
      const existingPlayers = await this.getPlayersByTeam(teamId);

      // Create new players, update existing ones based on ID match
      const updatedPlayers = await this.updatePlayersForTeam(teamId, existingPlayers, data.players);
      updatedTeam.players = updatedPlayers;
    } else {
      // If no players provided, fetch current players
      updatedTeam.players = await this.getPlayersByTeam(teamId);
    }

    return updatedTeam;
  },

  /**
   * Update players for a team
   * @param teamId Team ID
   * @param existingPlayers Existing players
   * @param updatedPlayers Updated player data
   * @returns Array of updated players
   */
  async updatePlayersForTeam(teamId: string, existingPlayers: PlayerEntity[], updatedPlayers: Partial<PlayerEntity>[]): Promise<PlayerEntity[]> {
    const result: PlayerEntity[] = [];

    // Create a map of existing players by ID
    const existingPlayersMap = new Map<string, PlayerEntity>();
    for (const player of existingPlayers) {
      existingPlayersMap.set(player.id, player);
    }

    // Process each updated player
    for (const player of updatedPlayers) {
      if (player.id && existingPlayersMap.has(player.id)) {
        // Update existing player
        const updatedPlayer = await this.updatePlayer(player.id, player);
        result.push(updatedPlayer);
        existingPlayersMap.delete(player.id);
      } else {
        // Create new player
        const newPlayer = {
          ...player,
          teamId,
        } as Omit<PlayerEntity, "id">;

        const createdPlayer = await this.createPlayer(newPlayer);
        result.push(createdPlayer);
      }
    }

    // Delete players that were not included in the update
    for (const playerId of existingPlayersMap.keys()) {
      await this.deletePlayer(playerId);
    }

    return result;
  },

  /**
   * Create a single player
   * @param player Player data without ID
   * @returns Created player with ID
   */
  async createPlayer(player: Omit<PlayerEntity, "id">): Promise<PlayerEntity> {
    const payload = playerToBackend(player);

    const document = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.PLAYERS,
      'unique()',
      payload
    );

    return playerFromBackend(document);
  },

  /**
   * Update a player
   * @param playerId Player ID
   * @param data Updated player data
   * @returns Updated player
   */
  async updatePlayer(playerId: string, data: Partial<PlayerEntity>): Promise<PlayerEntity> {
    const payload = playerToBackend(data);

    const document = await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.PLAYERS,
      playerId,
      payload
    );

    return playerFromBackend(document);
  },

  /**
   * Delete a player
   * @param playerId Player ID
   * @returns Promise resolved when deleted
   */
  async deletePlayer(playerId: string): Promise<void> {
    await databases.deleteDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.PLAYERS,
      playerId
    );
  },

  /**
   * Delete a team and its players
   * @param teamId Team ID
   * @returns Promise resolved when deleted
   */
  async deleteTeam(teamId: string): Promise<void> {
    // Get all players for this team
    const players = await this.getPlayersByTeam(teamId);

    // Delete all players first
    for (const player of players) {
      await this.deletePlayer(player.id);
    }

    // Then delete the team
    await databases.deleteDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.TEAMS,
      teamId
    );
  },

  /**
   * Export teams to CSV format
   * @param tournamentId Tournament ID
   * @param divisionId Optional division ID to filter teams
   * @returns CSV string representation of teams data
   */
  async exportTeamsToCSV(tournamentId: string, divisionId?: string): Promise<string> {
    // Get teams with their players
    const teams = await this.getTeamsByTournament(tournamentId, divisionId);

    // Format data for CSV export
    const csvData = teams.flatMap(team => {
      // Handle teams with no players
      if (!team.players || team.players.length === 0) {
        return [{
          team_name: team.name,
          division: team.division || '',
          player_name: '',
          player_email: '',
          player_phone: ''
        }];
      }

      // Generate a row for each player in the team
      return team.players.map(player => ({
        team_name: team.name,
        division: team.division || '',
        player_name: player.name,
        player_email: player.email || '',
        player_phone: player.phone || ''
      }));
    });

    // Return CSV data to be processed by csvUtils
    return JSON.stringify(csvData);
  },

  /**
   * Validate team import data structure
   * @param data Raw imported data
   * @returns Validation result with valid and invalid items
   */
  validateTeamImportData(data: any[]): { valid: any[], invalid: any[] } {
    const valid: any[] = [];
    const invalid: any[] = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const errors = [];

      // Check for required team name
      if (!item.team_name && !item.name) {
        errors.push('Team name is required');
      }

      // Check for at least one player name
      if (!item.player_name && !item.player1_name) {
        errors.push('At least one player name is required');
      }

      if (errors.length > 0) {
        invalid.push({ row: i + 1, data: item, errors });
      } else {
        valid.push(item);
      }
    }

    return { valid, invalid };
  }
};
