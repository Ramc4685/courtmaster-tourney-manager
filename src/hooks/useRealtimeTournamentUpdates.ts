import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { TournamentMatch, TournamentStatus } from '@/types/tournament';

interface WebSocketMessage {
  type: 'SCORE_UPDATE' | 'MATCH_STATUS' | 'TOURNAMENT_STATUS';
  payload: any;
}

export const useRealtimeTournamentUpdates = (tournamentId: string) => {
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const ws = new WebSocket(`wss://${window.location.host}/ws/tournament/${tournamentId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'SCORE_UPDATE':
          // Handle score update
          break;
        case 'MATCH_STATUS':
          // Handle match status change
          break;
        case 'TOURNAMENT_STATUS':
          // Handle tournament status change
          break;
      }
    };

    return () => {
      ws.close();
    };
  }, [tournamentId]);

  const sendUpdate = (type: WebSocketMessage['type'], payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  return { sendUpdate };
};