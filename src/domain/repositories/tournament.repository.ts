import { Tournament, Match, Team, Division } from '@/types';
import { BaseRepository } from './base.repository';

export interface TournamentRepository extends BaseRepository<Tournament> {
  // Tournament operations
  findById(id: string): Promise<Tournament>;
  findAll(): Promise<Tournament[]>;
  findByOrganizer(organizer_id: string): Promise<Tournament[]>;
  save(tournament: Tournament): Promise<Tournament>;
  update(tournament: Tournament): Promise<Tournament>;
  delete(id: string): Promise<void>;
  
  // Team operations
  addTeam(tournamentId: string, team: Team): Promise<Team>;
  removeTeam(tournamentId: string, teamId: string): Promise<void>;
  updateTeam(tournamentId: string, team: Team): Promise<Team>;
  getTeams(tournamentId: string): Promise<Team[]>;
  
  // Division operations
  addDivision(tournamentId: string, division: Division): Promise<Division>;
  removeDivision(tournamentId: string, divisionId: string): Promise<void>;
  updateDivision(tournamentId: string, division: Division): Promise<Division>;
  getDivisions(tournamentId: string): Promise<Division[]>;
  
  // Match operations
  addMatch(tournamentId: string, match: Match): Promise<Match>;
  removeMatch(tournamentId: string, matchId: string): Promise<void>;
  updateMatch(tournamentId: string, match: Match): Promise<Match>;
  getMatches(tournamentId: string): Promise<Match[]>;
  getMatchesByStage(tournamentId: string, stage: string): Promise<Match[]>;
  
  // Batch operations
  saveMatches(tournamentId: string, matches: Match[]): Promise<Match[]>;
  updateMatches(tournamentId: string, matches: Match[]): Promise<Match[]>;
  
  // Transaction support
  transaction<T>(operation: () => Promise<T>): Promise<T>;
} 