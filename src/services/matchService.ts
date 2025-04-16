
import { supabase } from '@/lib/supabase';
import { Match, MatchStatus } from '@/types/entities';

export const matchService = {
  async createMatch(match: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .insert({
        tournament_id: match.tournamentId,
        team1_id: match.team1Id,
        team2_id: match.team2Id,
        status: match.status || MatchStatus.SCHEDULED,
        round_number: match.round_number,
        match_number: match.match_number,
        scheduled_time: match.scheduledTime?.toISOString(),
        court_id: match.courtId,
        notes: match.notes
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      tournamentId: data.tournament_id,
      team1Id: data.team1_id,
      team2Id: data.team2_id,
      status: data.status as MatchStatus,
      bracketRound: data.round_number || 0,
      bracketPosition: 0,
      progression: {},
      scheduledTime: data.scheduled_time ? new Date(data.scheduled_time) : undefined,
      startTime: data.start_time ? new Date(data.start_time) : undefined,
      endTime: data.end_time ? new Date(data.end_time) : undefined,
      courtId: data.court_id,
      notes: data.notes,
      scores: data.scores || [],
      stage: 'GROUP_STAGE',
      division: 'OPEN',
      round_number: data.round_number,
      match_number: data.match_number
    };
  },
  
  async listMatches(filter: { tournament_id: string, court_id?: string, status?: MatchStatus }): Promise<Match[]> {
    let query = supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', filter.tournament_id);
      
    if (filter.court_id) {
      query = query.eq('court_id', filter.court_id);
    }
    
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data.map(match => ({
      id: match.id,
      tournamentId: match.tournament_id,
      team1Id: match.team1_id,
      team2Id: match.team2_id,
      status: match.status as MatchStatus,
      bracketRound: match.round_number || 0,
      bracketPosition: 0,
      progression: {},
      scheduledTime: match.scheduled_time ? new Date(match.scheduled_time) : undefined,
      startTime: match.start_time ? new Date(match.start_time) : undefined,
      endTime: match.end_time ? new Date(match.end_time) : undefined,
      courtId: match.court_id,
      notes: match.notes,
      scores: match.scores || [],
      stage: 'GROUP_STAGE',
      division: 'OPEN',
      round_number: match.round_number,
      match_number: match.match_number
    }));
  },
  
  async updateMatch(id: string, match: Partial<Match>): Promise<Match> {
    const payload: any = {};
    
    if (match.scheduledTime !== undefined) payload.scheduled_time = match.scheduledTime?.toISOString();
    if (match.startTime !== undefined) payload.start_time = match.startTime?.toISOString();
    if (match.endTime !== undefined) payload.end_time = match.endTime?.toISOString();
    if (match.status !== undefined) payload.status = match.status;
    if (match.courtId !== undefined) payload.court_id = match.courtId;
    if (match.scores !== undefined) payload.scores = match.scores;
    if (match.notes !== undefined) payload.notes = match.notes;
    
    const { data, error } = await supabase
      .from('matches')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      tournamentId: data.tournament_id,
      team1Id: data.team1_id,
      team2Id: data.team2_id,
      status: data.status as MatchStatus,
      bracketRound: data.round_number || 0,
      bracketPosition: 0,
      progression: {},
      scheduledTime: data.scheduled_time ? new Date(data.scheduled_time) : undefined,
      startTime: data.start_time ? new Date(data.start_time) : undefined,
      endTime: data.end_time ? new Date(data.end_time) : undefined,
      courtId: data.court_id,
      notes: data.notes,
      scores: data.scores || [],
      stage: 'GROUP_STAGE',
      division: 'OPEN',
      round_number: data.round_number,
      match_number: data.match_number
    };
  }
};
