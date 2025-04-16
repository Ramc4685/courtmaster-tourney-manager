import { Tournament, Match, Team, Division } from '@/types';
import { TournamentModel } from '../models/tournament.model';

export interface TournamentService {
  // Tournament CRUD operations
  createTournament(tournament: Tournament): Promise<TournamentModel>;
  getTournament(id: string): Promise<TournamentModel>;
  updateTournament(tournament: Tournament): Promise<TournamentModel>;
  deleteTournament(id: string): Promise<void>;
  
  // Team management
  addTeam(tournamentId: string, team: Team): Promise<Team>;
  removeTeam(tournamentId: string, teamId: string): Promise<void>;
  updateTeamSeed(tournamentId: string, teamId: string, seed: number): Promise<Team>;
  getTeams(tournamentId: string): Promise<Team[]>;
  
  // Division management
  createDivision(tournamentId: string, division: Division): Promise<Division>;
  updateDivision(tournamentId: string, division: Division): Promise<Division>;
  deleteDivision(tournamentId: string, divisionId: string): Promise<void>;
  getDivisions(tournamentId: string): Promise<Division[]>;
  
  // Match management
  createMatch(tournamentId: string, match: Match): Promise<Match>;
  updateMatch(tournamentId: string, match: Match): Promise<Match>;
  deleteMatch(tournamentId: string, matchId: string): Promise<void>;
  getMatches(tournamentId: string): Promise<Match[]>;
  
  // Tournament progression
  startTournament(tournamentId: string): Promise<TournamentModel>;
  advanceStage(tournamentId: string): Promise<TournamentModel>;
  completeTournament(tournamentId: string): Promise<TournamentModel>;
  
  // Bracket generation
  generateBrackets(tournamentId: string): Promise<Match[]>;
  regenerateBrackets(tournamentId: string): Promise<Match[]>;
  
  // Validation
  validateTournament(tournament: Tournament): Promise<boolean>;
  validateMatch(tournamentId: string, match: Match): Promise<boolean>;
  validateTeams(tournamentId: string, teams: Team[]): Promise<boolean>;
} 