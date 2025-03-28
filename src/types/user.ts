
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  isVerified: boolean;
  role: 'admin' | 'user';
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserProfile extends User {
  tournaments: {
    owned: string[];
    administrating: string[];
    participating: string[];
  };
}

export interface TournamentUserRole {
  tournamentId: string;
  userId: string;
  role: 'owner' | 'admin' | 'participant' | 'spectator';
}
