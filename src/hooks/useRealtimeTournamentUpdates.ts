import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Match } from '@/types/tournament';

interface ScoreUpdate {
  matchId: string;
  setIndex: number;
  team1Score: number;
  team2Score: number;
}

interface WebSocketMessage {
  type: 'SCORE_UPDATE';
  payload: ScoreUpdate;
}

export const useRealtimeScoring = (matchId: string, onScoreUpdate?: (update: ScoreUpdate) => void) => {
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Only connect websocket if we have a match ID
    if (!matchId) return;

    const ws = new WebSocket(`wss://${window.location.host}/ws/match/${matchId}/scoring`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      if (message.type === 'SCORE_UPDATE') {
        onScoreUpdate?.(message.payload);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to scoring updates. Scores may be outdated.',
        variant: 'destructive',
      });
    };

    return () => {
      ws.close();
    };
  }, [matchId, onScoreUpdate]);

  const updateScore = (setIndex: number, team1Score: number, team2Score: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'SCORE_UPDATE',
        payload: {
          matchId,
          setIndex,
          team1Score,
          team2Score
        }
      }));
    }
  };

  return { updateScore };
};