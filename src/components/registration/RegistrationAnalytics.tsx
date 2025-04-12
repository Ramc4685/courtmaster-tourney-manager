import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayerRegistrationWithStatus, TeamRegistrationWithStatus, TournamentRegistrationStatus } from '@/types/registration';
import { Division } from '@/types/entities';

interface RegistrationAnalyticsProps {
  playerRegistrations: PlayerRegistrationWithStatus[];
  teamRegistrations: TeamRegistrationWithStatus[];
  divisions: Division[];
}

interface DivisionStats {
  id: string;
  name: string;
  total: number;
  approved: number;
  waitlisted: number;
  capacity: number;
  fillRate: number;
}

export const RegistrationAnalytics: React.FC<RegistrationAnalyticsProps> = ({
  playerRegistrations,
  teamRegistrations,
  divisions,
}) => {
  const getStatusCounts = (registrations: (PlayerRegistrationWithStatus | TeamRegistrationWithStatus)[]) => {
    return registrations.reduce((acc, reg) => {
      acc[reg.status] = (acc[reg.status] || 0) + 1;
      return acc;
    }, {} as Record<TournamentRegistrationStatus, number>);
  };

  const getStatusColor = (status: TournamentRegistrationStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'WAITLIST':
        return 'bg-orange-100 text-orange-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'CHECKED_IN':
        return 'bg-blue-100 text-blue-800';
      case 'WITHDRAWN':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateDivisionStats = (): DivisionStats[] => {
    return divisions.map(division => {
      const divisionRegistrations = [
        ...playerRegistrations.filter(r => r.division_id === division.id),
        ...teamRegistrations.filter(r => r.division_id === division.id),
      ];

      const approved = divisionRegistrations.filter(r => r.status === 'APPROVED').length;
      const waitlisted = divisionRegistrations.filter(r => r.status === 'WAITLIST').length;
      const total = divisionRegistrations.length;
      const capacity = division.capacity || Infinity;
      const fillRate = capacity === Infinity ? 0 : (approved / capacity) * 100;

      return {
        id: division.id,
        name: division.name,
        total,
        approved,
        waitlisted,
        capacity,
        fillRate,
      };
    });
  };

  const playerStatusCounts = getStatusCounts(playerRegistrations);
  const teamStatusCounts = getStatusCounts(teamRegistrations);
  const divisionStats = calculateDivisionStats();

  const totalRegistrations = playerRegistrations.length + teamRegistrations.length;
  const registrationsPerDay = playerRegistrations.concat(teamRegistrations).reduce((acc, reg) => {
    const date = new Date(reg.createdAt).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Registration Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Registrations:</span>
              <span className="font-semibold">{totalRegistrations}</span>
            </div>
            <div className="flex justify-between">
              <span>Individual Players:</span>
              <span className="font-semibold">{playerRegistrations.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Teams:</span>
              <span className="font-semibold">{teamRegistrations.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Players</p>
              {Object.entries(playerStatusCounts).map(([status, count]) => (
                <div key={status} className="flex justify-between text-sm">
                  <span>{status}:</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1 mt-4">
              <p className="text-sm font-medium">Teams</p>
              {Object.entries(teamStatusCounts).map(([status, count]) => (
                <div key={status} className="flex justify-between text-sm">
                  <span>{status}:</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Division Capacity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {divisionStats.map(stat => (
              <div key={stat.id} className="space-y-2">
                <p className="text-sm font-medium">{stat.name}</p>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min(stat.fillRate, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span>{stat.approved} / {stat.capacity === Infinity ? '∞' : stat.capacity}</span>
                  <span>{stat.waitlisted} waitlisted</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Registration Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            {/* Here you would typically use a charting library like recharts or chart.js */}
            <div className="space-y-2">
              {Object.entries(registrationsPerDay).map(([date, count]) => (
                <div key={date} className="flex justify-between text-sm">
                  <span>{date}:</span>
                  <span className="font-semibold">{count} registrations</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 