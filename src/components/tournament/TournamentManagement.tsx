
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, Calendar, Trophy, Clock, 
  Settings, ChevronRight, Bell 
} from 'lucide-react';

export const TournamentManagement = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <h3 className="font-bold">Participants</h3>
              <p className="text-sm text-gray-600">Manage players and teams</p>
            </div>
            <ChevronRight className="ml-auto" />
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <Calendar className="w-8 h-8 text-green-500" />
            <div>
              <h3 className="font-bold">Schedule</h3>
              <p className="text-sm text-gray-600">View and edit matches</p>
            </div>
            <ChevronRight className="ml-auto" />
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <Trophy className="w-8 h-8 text-purple-500" />
            <div>
              <h3 className="font-bold">Results</h3>
              <p className="text-sm text-gray-600">Track scores and rankings</p>
            </div>
            <ChevronRight className="ml-auto" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Upcoming Matches
          </h3>
          <div className="space-y-3">
            {/* Add match list here */}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Recent Updates
          </h3>
          <div className="space-y-3">
            {/* Add updates list here */}
          </div>
        </Card>
      </div>
    </div>
  );
};
