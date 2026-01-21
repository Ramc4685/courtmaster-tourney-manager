import type { Profile } from '@/types/entities';
import { UserRole } from '@/types/tournament-enums';

export interface UserCredentials {
  email: string;
  password: string;
}

// Mock users for development
const MOCK_USERS = [
  {
    id: 'demo-admin-1',
    email: 'demoadmin@example.com',
    password: 'demopassword',
    full_name: 'Demo Admin',
    display_name: 'Demo Admin',
    role: UserRole.ADMIN,
    avatar_url: '',
    phone: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-user-1',
    email: 'demo@example.com',
    password: 'password',
    full_name: 'Demo User',
    display_name: 'Demo User',
    role: UserRole.PLAYER,
    avatar_url: '',
    phone: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export class MockAuthService {
  private currentUser: Profile | null = null;
  private users: typeof MOCK_USERS = [...MOCK_USERS];

  async getCurrentUser(): Promise<Profile | null> {
    console.log('[MockAuthService] Getting current user:', this.currentUser?.email);
    return this.currentUser;
  }

  async login(email: string, password: string): Promise<Profile | null> {
    console.log('[MockAuthService] Attempting login for:', email);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = this.users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    this.currentUser = { ...user } as Profile;
    console.log('[MockAuthService] Login successful for:', email);
    return this.currentUser;
  }

  async register(userData: UserCredentials & { name: string }): Promise<Profile | null> {
    console.log('[MockAuthService] Registering user:', userData.email);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if user already exists
    const existingUser = this.users.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    const newUser = {
      id: `user-${Date.now()}`,
      email: userData.email,
      password: userData.password,
      full_name: userData.name,
      display_name: userData.name,
      role: UserRole.PLAYER,
      avatar_url: '',
      phone: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    this.users.push(newUser);
    this.currentUser = { ...newUser } as Profile;
    
    console.log('[MockAuthService] Registration successful for:', userData.email);
    return this.currentUser;
  }

  async logout(): Promise<void> {
    console.log('[MockAuthService] Logging out user:', this.currentUser?.email);
    this.currentUser = null;
  }

  async resetPassword(email: string): Promise<void> {
    console.log('[MockAuthService] Password reset requested for:', email);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    // In a real implementation, this would send a reset email
  }

  async updateUserProfile(user: Partial<Profile>): Promise<Profile | null> {
    console.log('[MockAuthService] Updating profile for:', this.currentUser?.email);
    
    if (!this.currentUser) {
      throw new Error('No authenticated user found');
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Update current user
    this.currentUser = {
      ...this.currentUser,
      ...user,
      updated_at: new Date().toISOString()
    };
    
    // Update in users array
    const userIndex = this.users.findIndex(u => u.id === this.currentUser!.id);
    if (userIndex !== -1) {
      this.users[userIndex] = { ...this.users[userIndex], ...user };
    }
    
    return this.currentUser;
  }

  // Tournament role management (simplified for mock)
  isTournamentAdmin(userId: string, tournamentId: string): boolean {
    return this.currentUser?.role === UserRole.ADMIN;
  }

  hasRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean {
    if (role === 'admin') {
      return this.currentUser?.role === UserRole.ADMIN;
    }
    return true; // For demo purposes, allow all roles
  }

  addTournamentRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean {
    return true; // Mock implementation
  }

  removeTournamentRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean {
    return true; // Mock implementation
  }
}

// Export a singleton instance
export const mockAuthService = new MockAuthService();
