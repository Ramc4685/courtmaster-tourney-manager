import React, { useState, useEffect } from 'react';
import { Court } from '@/types/entities';
import { courtService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, WifiOff, Wrench, CheckCircle2, Play } from 'lucide-react';
import { cn } from "@/lib/utils"; // Assuming you have a utility for class names
import { supabase } from "@/lib/supabase"; // Import supabase client
import { RealtimeChannel } from '@supabase/supabase-js'; // Import type

interface CourtStatusDashboardProps {
  tournamentId: string;
  // Maybe accept courts directly if fetched by a parent?
  // courts?: Court[]; 
}

// Helper to get styling based on status
const getStatusStyle = (status: string) => {
  switch (status.toUpperCase()) {
    case 'AVAILABLE':
      return { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: 'border-green-500', textColor: 'text-green-600', bgColor: 'bg-green-50' };
    case 'IN_USE':
      return { icon: <Play className="h-4 w-4 text-blue-500" />, color: 'border-blue-500', textColor: 'text-blue-600', bgColor: 'bg-blue-50' };
    case 'MAINTENANCE':
      return { icon: <Wrench className="h-4 w-4 text-yellow-500" />, color: 'border-yellow-500', textColor: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    case 'UNAVAILABLE':
    default:
      return { icon: <WifiOff className="h-4 w-4 text-red-500" />, color: 'border-red-500', textColor: 'text-red-600', bgColor: 'bg-red-50' };
  }
};

export const CourtStatusDashboard: React.FC<CourtStatusDashboardProps> = ({ tournamentId }) => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tournamentId) return;
    let channel: RealtimeChannel | null = null;

    const fetchCourts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedCourts = await courtService.listCourts(tournamentId);
        setCourts(fetchedCourts);
      } catch (err) {
        console.error("Failed to fetch courts:", err);
        setError(err instanceof Error ? err.message : 'Failed to load courts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourts();

    // --- Realtime Subscription ---
    const handleCourtUpdate = (payload: any) => {
      console.log('Court update received:', payload);
      const updatedCourt = payload.new.data as Court;
      // Check if the update is for the current tournament
      if (updatedCourt && updatedCourt.tournamentId === tournamentId) {
        setCourts(currentCourts => {
          const existingIndex = currentCourts.findIndex(c => c.id === updatedCourt.id);
          if (existingIndex > -1) {
            // Update existing court
            const newCourts = [...currentCourts];
            newCourts[existingIndex] = updatedCourt;
            return newCourts;
          } else if (payload.eventType === 'INSERT') {
             // Add new court (if applicable for this view)
             return [...currentCourts, updatedCourt];
          } else {
             // Could handle DELETE if needed
             return currentCourts; // No change if not found or wrong event type
          }
        });
      }
    };

    channel = supabase
      .channel('public:court_updates')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'courts' }, 
          handleCourtUpdate
      )
      .subscribe((status, err) => {
         if (status === 'SUBSCRIBED') {
            console.log('Subscribed to court_updates channel!');
         } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Court subscription error:', status, err);
            setError('Realtime connection error for courts.');
         }
      });

    // Cleanup function
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        console.log('Unsubscribed from court_updates channel');
      }
    };
    // --- End Realtime Subscription ---

  }, [tournamentId]);

  if (isLoading) return <div>Loading court statuses...</div>;
  if (error) return <div className="text-red-500">Error loading court statuses: {error}</div>;
  if (courts.length === 0) return <div>No courts found for this tournament. Please configure courts first.</div>;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Court Status Overview</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {courts.sort((a,b) => a.court_number - b.court_number).map((court) => {
          const style = getStatusStyle(court.status);
          return (
            <Card key={court.id} className={cn("border-l-4", style.color, style.bgColor)}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{court.name} (C{court.court_number})</CardTitle>
                  {style.icon}
                </div>
                 <CardDescription>{court.description || 'No description'}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className={cn("text-sm font-medium", style.textColor)}>{court.status}</Badge>
                 {/* Future: Display current match info if IN_USE */}
                 {court.status.toUpperCase() === 'IN_USE' && (
                    <div className="text-xs text-muted-foreground mt-2">Current Match: [Match Info Placeholder]</div>
                 )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
