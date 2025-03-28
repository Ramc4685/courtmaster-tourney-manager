
import { User, UserCredentials, UserProfile } from '@/types/user';
import { toast } from '@/hooks/use-toast';

// Simulate storage in localStorage for demo purposes
// In a real app, this would be replaced with API calls to a backend
class AuthService {
  private readonly STORAGE_KEY = 'courtmaster_auth';
  private readonly USERS_KEY = 'courtmaster_users';

  constructor() {
    // Initialize some sample users if none exist
    if (!this.getAllUsers().length) {
      this.initializeUsers();
    }
  }

  private initializeUsers() {
    const sampleUsers = [
      {
        id: '1',
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123', // In real app, this would be hashed
        createdAt: new Date().toISOString(),
        isVerified: true,
        role: 'admin',
        tournaments: {
          owned: [],
          administrating: [],
          participating: []
        }
      },
      {
        id: '2',
        name: 'Test User',
        email: 'user@example.com',
        password: 'user123', // In real app, this would be hashed
        createdAt: new Date().toISOString(),
        isVerified: true,
        role: 'user',
        tournaments: {
          owned: [],
          administrating: [],
          participating: []
        }
      }
    ];

    localStorage.setItem(this.USERS_KEY, JSON.stringify(sampleUsers));
    console.log('[DEBUG] AuthService: Initialized sample users');
  }

  private getAllUsers(): any[] {
    const usersJson = localStorage.getItem(this.USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  }

  private saveUser(user: any): void {
    const users = this.getAllUsers();
    const existingUserIndex = users.findIndex(u => u.id === user.id);
    
    if (existingUserIndex >= 0) {
      users[existingUserIndex] = user;
    } else {
      users.push(user);
    }
    
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  async login(credentials: UserCredentials): Promise<User | null> {
    console.log('[DEBUG] AuthService: Attempting login for:', credentials.email);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const users = this.getAllUsers();
      const user = users.find(u => 
        u.email === credentials.email && 
        u.password === credentials.password
      );
      
      if (user) {
        console.log('[DEBUG] AuthService: Login successful');
        // Remove password before storing in session
        const { password, ...userWithoutPassword } = user;
        
        // Store in localStorage (in real app, this would be a JWT token)
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userWithoutPassword));
        
        return userWithoutPassword as User;
      } else {
        console.log('[DEBUG] AuthService: Login failed - invalid credentials');
        return null;
      }
    } catch (error) {
      console.error('[ERROR] AuthService: Login failed', error);
      throw new Error('Login failed. Please try again later.');
    }
  }

  async register(userData: UserCredentials & { name: string }): Promise<User | null> {
    console.log('[DEBUG] AuthService: Attempting registration for:', userData.email);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const users = this.getAllUsers();
      
      // Check if user already exists
      if (users.some(u => u.email === userData.email)) {
        console.log('[DEBUG] AuthService: Registration failed - email already exists');
        return null;
      }
      
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        password: userData.password, // In real app, this would be hashed
        createdAt: new Date().toISOString(),
        isVerified: false, // Would require email verification in real app
        role: 'user' as const,
        tournaments: {
          owned: [],
          administrating: [],
          participating: []
        }
      };
      
      // Save the user
      this.saveUser(newUser);
      
      // For demo, auto-verify the user
      this.verifyUser(newUser.id);
      
      console.log('[DEBUG] AuthService: Registration successful');
      
      // Remove password before returning
      const { password, ...userWithoutPassword } = newUser;
      return userWithoutPassword as User;
    } catch (error) {
      console.error('[ERROR] AuthService: Registration failed', error);
      throw new Error('Registration failed. Please try again later.');
    }
  }

  verifyUser(userId: string): boolean {
    console.log('[DEBUG] AuthService: Verifying user:', userId);
    
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex >= 0) {
      users[userIndex].isVerified = true;
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      console.log('[DEBUG] AuthService: User verified successfully');
      return true;
    }
    
    console.log('[DEBUG] AuthService: User verification failed - user not found');
    return false;
  }

  getCurrentUser(): User | null {
    const userJson = localStorage.getItem(this.STORAGE_KEY);
    if (!userJson) {
      console.log('[DEBUG] AuthService: No current user found');
      return null;
    }
    
    try {
      const user = JSON.parse(userJson);
      console.log('[DEBUG] AuthService: Current user retrieved:', user.email);
      return user;
    } catch (error) {
      console.error('[ERROR] AuthService: Error parsing user data', error);
      return null;
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    console.log('[DEBUG] AuthService: Getting profile for user:', userId);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const users = this.getAllUsers();
      const user = users.find(u => u.id === userId);
      
      if (user) {
        console.log('[DEBUG] AuthService: User profile retrieved');
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword as UserProfile;
      }
      
      console.log('[DEBUG] AuthService: User profile not found');
      return null;
    } catch (error) {
      console.error('[ERROR] AuthService: Error fetching user profile', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  logout(): void {
    console.log('[DEBUG] AuthService: Logging out user');
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Tournament role management functions
  addTournamentRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean {
    console.log(`[DEBUG] AuthService: Adding role '${role}' for user ${userId} in tournament ${tournamentId}`);
    
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex < 0) {
      console.log('[DEBUG] AuthService: Role assignment failed - user not found');
      return false;
    }
    
    const user = users[userIndex];
    
    // Add tournament ID to the appropriate role array
    switch (role) {
      case 'owner':
        if (!user.tournaments.owned.includes(tournamentId)) {
          user.tournaments.owned.push(tournamentId);
        }
        break;
      case 'admin':
        if (!user.tournaments.administrating.includes(tournamentId)) {
          user.tournaments.administrating.push(tournamentId);
        }
        break;
      case 'participant':
        if (!user.tournaments.participating.includes(tournamentId)) {
          user.tournaments.participating.push(tournamentId);
        }
        break;
    }
    
    // Update the user
    this.saveUser(user);
    console.log('[DEBUG] AuthService: Role assigned successfully');
    return true;
  }

  removeTournamentRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean {
    console.log(`[DEBUG] AuthService: Removing role '${role}' for user ${userId} in tournament ${tournamentId}`);
    
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex < 0) {
      console.log('[DEBUG] AuthService: Role removal failed - user not found');
      return false;
    }
    
    const user = users[userIndex];
    
    // Remove tournament ID from the appropriate role array
    switch (role) {
      case 'owner':
        user.tournaments.owned = user.tournaments.owned.filter(id => id !== tournamentId);
        break;
      case 'admin':
        user.tournaments.administrating = user.tournaments.administrating.filter(id => id !== tournamentId);
        break;
      case 'participant':
        user.tournaments.participating = user.tournaments.participating.filter(id => id !== tournamentId);
        break;
    }
    
    // Update the user
    this.saveUser(user);
    console.log('[DEBUG] AuthService: Role removed successfully');
    return true;
  }

  hasRole(userId: string, tournamentId: string, role: 'owner' | 'admin' | 'participant'): boolean {
    console.log(`[DEBUG] AuthService: Checking if user ${userId} has role '${role}' in tournament ${tournamentId}`);
    
    const users = this.getAllUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      console.log('[DEBUG] AuthService: Role check failed - user not found');
      return false;
    }
    
    // Check if user has the specified role
    let hasRole = false;
    switch (role) {
      case 'owner':
        hasRole = user.tournaments.owned.includes(tournamentId);
        break;
      case 'admin':
        hasRole = user.tournaments.administrating.includes(tournamentId);
        break;
      case 'participant':
        hasRole = user.tournaments.participating.includes(tournamentId);
        break;
    }
    
    console.log(`[DEBUG] AuthService: User ${userId} ${hasRole ? 'has' : 'does not have'} role '${role}' in tournament ${tournamentId}`);
    return hasRole;
  }

  isTournamentAdmin(userId: string, tournamentId: string): boolean {
    console.log(`[DEBUG] AuthService: Checking if user ${userId} is admin of tournament ${tournamentId}`);
    const isOwner = this.hasRole(userId, tournamentId, 'owner');
    const isAdmin = this.hasRole(userId, tournamentId, 'admin');
    return isOwner || isAdmin;
  }
}

export const authService = new AuthService();
