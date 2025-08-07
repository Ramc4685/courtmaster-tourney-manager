import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import { account, databases } from '@/lib/appwrite';
import { appwriteAuthService } from '@/services/auth/AppwriteAuthService';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/appwrite', () => ({
  account: {
    getSession: vi.fn(),
    get: vi.fn(),
    createEmailPasswordSession: vi.fn(),
    create: vi.fn(),
    deleteSession: vi.fn()
  },
  databases: {
    listDocuments: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
  },
  client: {
    subscribe: vi.fn(() => vi.fn())
  }
}));

vi.mock('@/services/auth/AppwriteAuthService', () => ({
  appwriteAuthService: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUserProfile: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Test component to access auth context
function TestComponent() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="loading">{auth.isLoading.toString()}</div>
      <div data-testid="authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="demo-mode">{auth.demoMode.toString()}</div>
      <button onClick={() => auth.signIn('test@example.com', 'password')}>Sign In</button>
      <button onClick={() => auth.signOut()}>Sign Out</button>
    </div>
  );
}

function renderWithAuth(ui: React.ReactNode) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock initial session check
    (account.getSession as any).mockRejectedValue(new Error('No active session'));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start with loading state', () => {
      renderWithAuth(<TestComponent />);
      expect(screen.getByTestId('loading').textContent).toBe('true');
    });

    it('should finish loading after session check', async () => {
      renderWithAuth(<TestComponent />);
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });
  });

  describe('Demo Mode', () => {
    it('should handle demo user login', async () => {
      renderWithAuth(<TestComponent />);
      const auth = screen.getByTestId('demo-mode');
      
      await act(async () => {
        const signIn = useAuth().signIn;
        await signIn('demo@example.com', 'demo123');
      });

      expect(auth.textContent).toBe('true');
    });

    it('should handle demo admin login', async () => {
      renderWithAuth(<TestComponent />);
      const auth = screen.getByTestId('demo-mode');
      
      await act(async () => {
        const signIn = useAuth().signIn;
        await signIn('admin@example.com', 'demo123');
      });

      expect(auth.textContent).toBe('true');
    });
  });

  describe('Authentication', () => {
    it('should handle successful sign in', async () => {
      const mockUser = { $id: 'test-id', email: 'test@example.com', name: 'Test User', $createdAt: '2023-01-01' };
      const mockProfile = { id: 'test-id', email: 'test@example.com', full_name: 'Test User' };
      
      // Mock successful login
      (account.createEmailPasswordSession as any).mockResolvedValue({});
      (account.get as any).mockResolvedValue(mockUser);
      (appwriteAuthService.login as any).mockResolvedValue(mockProfile);

      renderWithAuth(<TestComponent />);
      
      await act(async () => {
        const signIn = useAuth().signIn;
        await signIn('test@example.com', 'password');
      });

      expect(appwriteAuthService.login).toHaveBeenCalledWith('test@example.com', 'password');
    });

    it('should handle sign in error', async () => {
      // Mock login failure
      (appwriteAuthService.login as any).mockRejectedValue(
        new Error('Invalid credentials')
      );

      renderWithAuth(<TestComponent />);
      
      await expect(async () => {
        const signIn = useAuth().signIn;
        await signIn('test@example.com', 'wrong-password');
      }).rejects.toThrow('Invalid credentials');
    });

    it('should handle sign out', async () => {
      (appwriteAuthService.logout as any).mockResolvedValue(undefined);

      renderWithAuth(<TestComponent />);
      
      await act(async () => {
        const signOut = useAuth().signOut;
        await signOut();
      });

      expect(appwriteAuthService.logout).toHaveBeenCalled();
    });
  });

  describe('Profile Management', () => {
    it('should handle profile update', async () => {
      const mockProfile = { 
        id: 'test-id', 
        userId: 'test-id',
        full_name: 'Updated Name',
        username: 'updated_user'
      };
      (appwriteAuthService.updateUserProfile as any).mockResolvedValue(mockProfile);

      renderWithAuth(<TestComponent />);
      
      await act(async () => {
        const updateUserProfile = useAuth().updateUserProfile;
        await updateUserProfile({ 
          full_name: 'Updated Name',
          username: 'updated_user'
        });
      });

      expect(appwriteAuthService.updateUserProfile).toHaveBeenCalledWith({
        full_name: 'Updated Name',
        username: 'updated_user'
      });
    });
  });

  describe('Session Handling', () => {
    it('should handle session change', async () => {
      const mockUser = { $id: 'test-id', email: 'test@example.com', name: 'Test User' };
      const mockProfile = { id: 'test-id', email: 'test@example.com', full_name: 'Test User' };
      
      // Mock Appwrite account session
      (account.getSession as any).mockResolvedValue({ userId: 'test-id' });
      (account.get as any).mockResolvedValue(mockUser);
      (appwriteAuthService.getCurrentUser as any).mockResolvedValue(mockProfile);

      renderWithAuth(<TestComponent />);
      
      expect(appwriteAuthService.getCurrentUser).toHaveBeenCalled();
    });

    it('should handle session removal', async () => {
      // Mock session absence
      (account.getSession as any).mockRejectedValue(new Error('No session'));

      renderWithAuth(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });
    });
  });
});