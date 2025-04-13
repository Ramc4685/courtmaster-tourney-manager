
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminDashboard: React.FC = () => {
  return (
    <Card className="border shadow-md">
      <CardHeader className="border-b flex justify-between items-center">
        <CardTitle className="text-xl">Admin Dashboard</CardTitle>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard label="Active Tournaments" value="4" />
          <StatCard label="Upcoming Matches" value="8" />
          <StatCard label="Courts In Use" value="5" />
          <StatCard label="Registered Players" value="129" />
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Upcoming Matches</h3>
          <div className="space-y-2">
            <MatchRow 
              players="Jones vs Smith/Lee" 
              startTime="12:30 PM" 
              endTime="12:00 PM" 
            />
            <MatchRow 
              players="Smith/Lee vs. Davis Ade" 
              startTime="12:30 PM" 
              endTime="12:30 PM" 
            />
            <MatchRow 
              players="Miller/Jones vs. Taylor Harris" 
              startTime="1:30 PM" 
              endTime="1:30 PM" 
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3">Tournament Overview</h3>
          <div className="h-40 border rounded p-4 flex items-end justify-around">
            <div className="bg-blue-500 w-12 h-[25%]"></div>
            <div className="bg-blue-500 w-12 h-[45%]"></div>
            <div className="bg-blue-500 w-12 h-[65%]"></div>
            <div className="bg-blue-500 w-12 h-[75%]"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper components
const StatCard: React.FC<{label: string; value: string}> = ({ label, value }) => {
  return (
    <div className="bg-white border rounded-lg p-4 text-center">
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
};

const MatchRow: React.FC<{players: string; startTime: string; endTime: string}> = ({ 
  players, 
  startTime, 
  endTime 
}) => {
  return (
    <div className="flex justify-between border-b pb-2">
      <div>{players}</div>
      <div className="flex gap-4">
        <div>{startTime}</div>
        <div>{endTime}</div>
      </div>
    </div>
  );
};

export default AdminDashboard;
