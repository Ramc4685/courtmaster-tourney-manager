import React from 'react';
import { Trophy, Calendar, Users, MapPin } from 'lucide-react';

interface TournamentHeaderProps {
  tournament: {
    name: string;
    startDate: string;
    participants?: {length:number};
    location: string;
    status: string;
  };
}

export const TournamentHeader: React.FC<TournamentHeaderProps> = ({ tournament }) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">{tournament.name}</h1>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{tournament.participants?.length || 0} Participants</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{tournament.location}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Trophy className="w-8 h-8" />
          <div className="text-right">
            <div className="text-sm opacity-80">Status</div>
            <div className="font-semibold">{tournament.status}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentHeader;