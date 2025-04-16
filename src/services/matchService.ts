import { supabase } from '@/lib/supabase';
import { Match, MatchStatus } from '@/types/entities';

export class MatchService {
  async getMatch(id: string): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    // Transform snake_case to camelCase while keeping originals for compatibility
    return this.formatMatchData(data);
  }
  
  async listMatches(filters: { tournament_id?: string, status?: MatchStatus, court_id?: string } = {}): Promise<Match[]> {
    let query = supabase.from('matches').select('*');
    
    // Apply filters
    if (filters.tournament_id) {
      query = query.eq('tournament_id', filters.tournament_id);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.court_id) {
      query = query.eq('court_id', filters.court_id);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transform data
    return data.map(match => this.formatMatchData(match));
  }
  
  async updateMatch(id: string, matchData: Partial<Match>): Promise<Match> {
    // Convert camelCase to snake_case for database
    const payload: any = {};
    
    if (matchData.status !== undefined) payload.status = matchData.status;
    if (matchData.scores !== undefined) payload.scores = matchData.scores;
    if (matchData.courtId !== undefined) payload.court_id = matchData.courtId;
    if (matchData.scheduledTime !== undefined) payload.scheduled_time = matchData.scheduledTime;
    if (matchData.startTime !== undefined) payload.start_time = matchData.startTime;
    if (matchData.endTime !== undefined) payload.end_time = matchData.endTime;
    if (matchData.winner !== undefined) payload.winner = matchData.winner;
    if (matchData.notes !== undefined) payload.notes = matchData.notes;
    
    // Include snake_case properties directly if provided
    if (matchData.court_id !== undefined) payload.court_id = matchData.court_id;
    
    const { data, error } = await supabase
      .from('matches')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    return this.formatMatchData(data);
  }
  
  async createMatch(matchData: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<Match> {
    const payload: any = {
      tournament_id: matchData.tournamentId || matchData.tournament_id,
      division: matchData.division,
      status: matchData.status || MatchStatus.SCHEDULED,
      round_number: matchData.round_number || matchData.bracketRound,
      match_number: matchData.match_number || matchData.matchNumber
    };
    
    if (matchData.courtId) payload.court_id = matchData.courtId;
    if (matchData.scheduledTime) payload.scheduled_time = matchData.scheduledTime;
    if (matchData.scores) payload.scores = matchData.scores;
    if (matchData.team1Id) payload.team1_id = matchData.team1Id;
    if (matchData.team2Id) payload.team2_id = matchData.team2Id;
    
    const { data, error } = await supabase
      .from('matches')
      .insert(payload)
      .select()
      .single();
      
    if (error) throw error;
    
    return this.formatMatchData(data);
  }
  
  async deleteMatch(id: string): Promise<void> {
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }
  
  // Helper method to format match data consistently
  private formatMatchData(data: any): Match {
    return {
      id: data.id,
      tournamentId: data.tournament_id,
      tournament_id: data.tournament_id,
      division: data.division,
      stage: data.stage || '',
      bracketRound: data.round_number,
      round_number: data.round_number,
      bracketPosition: data.bracket_position || 0,
      match_number: data.match_number || '',
      matchNumber: data.match_number || '',
      progression: data.progression || {},
      scores: data.scores || [],
      status: data.status as MatchStatus,
      courtId: data.court_id,
      court_id: data.court_id,
      courtNumber: data.court_number,
      team1Id: data.team1_id,
      team2Id: data.team2_id,
      winner: data.winner,
      loser: data.loser,
      scheduledTime: data.scheduled_time ? new Date(data.scheduled_time) : undefined,
      startTime: data.start_time ? new Date(data.start_time) : undefined,
      endTime: data.end_time ? new Date(data.end_time) : undefined,
      notes: data.notes,
      groupName: data.group_name,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}

export const matchService = new MatchService();
