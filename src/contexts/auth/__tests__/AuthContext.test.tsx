import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import { supabase } from '@/lib/supabase';
import { profileService } from '@/services/api';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

vi.mock('@/services/api', () => ({
  profileService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
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
      <div data-testid="demo-mode">{auth.isDemoMode.toString()}</div>
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
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
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
      const mockUser = { id: 'test-id' };
      const mockProfile = { id: 'test-id', email: 'test@example.com' };
      
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      (profileService.getProfile as any).mockResolvedValue(mockProfile);

      renderWithAuth(<TestComponent />);
      
      await act(async () => {
        const signIn = useAuth().signIn;
        await signIn('test@example.com', 'password');
      });

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      expect(profileService.getProfile).toHaveBeenCalledWith('test-id');
    });

    it('should handle sign in error', async () => {
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid credentials'),
      });

      renderWithAuth(<TestComponent />);
      
      await expect(async () => {
        const signIn = useAuth().signIn;
        await signIn('test@example.com', 'wrong-password');
      }).rejects.toThrow('Invalid credentials');
    });

    it('should handle sign out', async () => {
      (supabase.auth.signOut as any).mockResolvedValue({ error: null });

      renderWithAuth(<TestComponent />);
      
      await act(async () => {
        const signOut = useAuth().signOut;
        await signOut();
      });

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('Profile Management', () => {
    it('should handle profile update', async () => {
      const mockProfile = { 
        id: 'test-id', 
        full_name: 'Updated Name',
        display_name: 'Updated Name'
      };
      (profileService.updateProfile as any).mockResolvedValue(mockProfile);

      renderWithAuth(<TestComponent />);
      
      await act(async () => {
        const updateProfile = useAuth().updateProfile;
        await updateProfile({ 
          full_name: 'Updated Name',
          display_name: 'Updated Name'
        });
      });

      expect(profileService.updateProfile).toHaveBeenCalledWith(expect.any(String), {
        full_name: 'Updated Name',
        display_name: 'Updated Name'
      });
    });
  });

  describe('Auth State Changes', () => {
    it('should handle auth state change to signed in', async () => {
      const mockUser = { id: 'test-id' };
      const mockProfile = { id: 'test-id', email: 'test@example.com' };
      
      let authStateCallback: any;
      (supabase.auth.onAuthStateChange as any).mockImplementation((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });
      
      (profileService.getProfile as any).mockResolvedValue(mockProfile);

      renderWithAuth(<TestComponent />);
      
      await act(async () => {
        await authStateCallback('SIGNED_IN', { user: mockUser });
      });

      expect(profileService.getProfile).toHaveBeenCalledWith('test-id');
    });

    it('should handle auth state change to signed out', async () => {
      let authStateCallback: any;
      (supabase.auth.onAuthStateChange as any).mockImplementation((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      renderWithAuth(<TestComponent />);
      
      await act(async () => {
        await authStateCallback('SIGNED_OUT', null);
      });

      const auth = screen.getByTestId('authenticated');
      expect(auth.textContent).toBe('false');
    });
  });
}); 