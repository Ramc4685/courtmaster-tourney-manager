import { User, UserCredentials } from '@/types/user';
import { TournamentUserRole } from '@/types/user';

// BaseAuthService interface
interface BaseAuthService {
  getCurrentUser(): Promise<User | null>;
  login(credentials: UserCredentials): Promise<User | null>;
  register(userData: UserCredentials & { name: string }): Promise<User | null>;
  logout(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  updateUserProfile(user: Partial<User>): Promise<User | null>;
  isTournamentAdmin(userId: string, tournamentId: string): boolean;
  hasRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean;
  addTournamentRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean;
  removeTournamentRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean;
}

// Mock implementation of AuthService for dev/testing
class MockAuthService implements BaseAuthService {
  private users: User[] = [
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@example.com',
      createdAt: '2023-06-01T00:00:00Z',
      isVerified: true,
      role: 'admin',
    },
    {
      id: '2',
      name: 'Regular User',
      email: 'user@example.com',
      createdAt: '2023-06-02T00:00:00Z',
      isVerified: true,
      role: 'user',
    },
  ];

  private tournamentRoles: TournamentUserRole[] = [
    { userId: '1', tournamentId: 'tournament1', role: 'owner' },
    { userId: '2', tournamentId: 'tournament1', role: 'participant' },
  ];

  private currentUser: User | null = null;

  async getCurrentUser(): Promise<User | null> {
    // In a real app, we would check localStorage or a token
    return this.currentUser;
  }

  async login(credentials: UserCredentials): Promise<User | null> {
    const user = this.users.find(u => u.email === credentials.email);
    if (user) {
      this.currentUser = user;
      localStorage.setItem('mock_current_user', JSON.stringify(user));
      return user;
    }
    return null;
  }

  async register(userData: UserCredentials & { name: string }): Promise<User | null> {
    const newUser: User = {
      id: String(this.users.length + 1),
      name: userData.name,
      email: userData.email,
      createdAt: new Date().toISOString(),
      isVerified: false,
      role: 'user',
    };
    
    this.users.push(newUser);
    this.currentUser = newUser;
    localStorage.setItem('mock_current_user', JSON.stringify(newUser));
    return newUser;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem('mock_current_user');
  }

  async resetPassword(email: string): Promise<void> {
    console.log(`Mock password reset for ${email}`);
  }

  async updateUserProfile(userData: Partial<User>): Promise<User | null> {
    if (!this.currentUser) return null;
    
    const updatedUser = {
      ...this.currentUser,
      ...userData,
    };
    
    this.currentUser = updatedUser;
    localStorage.setItem('mock_current_user', JSON.stringify(updatedUser));
    return updatedUser;
  }

  isTournamentAdmin(userId: string, tournamentId: string): boolean {
    return this.hasRole(userId, tournamentId, 'owner') || 
           this.hasRole(userId, tournamentId, 'admin');
  }

  hasRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean {
    return this.tournamentRoles.some(
      tr => tr.userId === userId && tr.tournamentId === tournamentId && tr.role === role
    );
  }

  addTournamentRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean {
    if (!this.tournamentRoles.some(
      tr => tr.userId === userId && tr.tournamentId === tournamentId && tr.role === role
    )) {
      this.tournamentRoles.push({ userId, tournamentId, role });
      return true;
    }
    return false;
  }

  removeTournamentRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean {
    const initialLength = this.tournamentRoles.length;
    this.tournamentRoles = this.tournamentRoles.filter(
      tr => !(tr.userId === userId && tr.tournamentId === tournamentId && tr.role === role)
    );
    return this.tournamentRoles.length !== initialLength;
  }
}

// Create and export a singleton instance of the service
// const authService = new MockAuthService();
const authService = new AppwriteAuthService();

export { authService };
