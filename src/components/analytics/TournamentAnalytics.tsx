
import React from 'react';
import LineChart from './LineChart';
import BarChart from './BarChart';

interface TournamentAnalyticsProps {
  tournamentId: string;
  className?: string;
}

const TournamentAnalytics: React.FC<TournamentAnalyticsProps> = ({ 
  tournamentId, 
  className = "" 
}) => {
  // Mock data for charts
  const registrationsData = [12, 24, 36, 42, 48, 50];
  const completedMatchesData = [0, 5, 15, 25, 35, 48];
  const matchDurationData = [32, 28, 35, 30, 38, 25];
  const playerParticipationData = [28, 32, 36, 38, 32, 34];

  return (
    <div className={`space-y-8 ${className}`}>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tournament Analytics</h2>
        <p className="text-muted-foreground">
          Key metrics and insights for tournament ID: {tournamentId}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-col space-y-2">
            <p className="text-sm text-muted-foreground">Total Players</p>
            <p className="text-2xl font-bold">96</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-col space-y-2">
            <p className="text-sm text-muted-foreground">Total Matches</p>
            <p className="text-2xl font-bold">64</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-col space-y-2">
            <p className="text-sm text-muted-foreground">Completed Matches</p>
            <p className="text-2xl font-bold">48</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-col space-y-2">
            <p className="text-sm text-muted-foreground">Avg Match Time</p>
            <p className="text-2xl font-bold">34 min</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <LineChart 
          data={registrationsData} 
          className="w-full" 
          lines={[{ label: "Registrations Over Time", color: "#0ea5e9" }]}
        />
        <LineChart 
          data={completedMatchesData} 
          className="w-full" 
          lines={[{ label: "Completed Matches", color: "#10b981" }]}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BarChart 
          data={matchDurationData} 
          className="w-full" 
          bars={[{ label: "Average Match Durations", color: "#8b5cf6" }]}
        />
        <BarChart 
          data={playerParticipationData} 
          className="w-full" 
          bars={[{ label: "Player Participation", color: "#f59e0b" }]}
        />
      </div>
    </div>
  );
};

export default TournamentAnalytics;
