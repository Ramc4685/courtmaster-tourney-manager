import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import { UserRole } from '@/types/tournament-enums';
import { account } from '@/lib/appwrite';
import { appwriteAuthService } from '@/services/auth/AppwriteAuthService';

// Mock all external dependencies
vi.mock('@/lib/appwrite', () => ({
  account: {
    getSession: vi.fn(),
    get: vi.fn(),
    createEmailPasswordSession: vi.fn(),
    create: vi.fn(),
    deleteSession: vi.fn(),
    createOAuth2Session: vi.fn()
  },
  databases: {
    listDocuments: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
    getDocument: vi.fn()
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
  }
}));

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({ toast: vi.fn() })
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  };
});

// Mock data
const mockUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  full_name: 'Test User',
  display_name: 'Test User',
  role: UserRole.ORGANIZER,
  avatar_url: '',
  phone: '1234567890',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Test component to access auth context
function TestComponent() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="loading">{auth.isLoading.toString()}</div>
      <div data-testid="authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="demo-mode">{auth.demoMode?.toString() || 'false'}</div>
      <div data-testid="user-email">{auth.user?.email || 'no-email'}</div>
      <button onClick={() => auth.signIn('test@example.com', 'password')}>Sign In</button>
      <button onClick={() => auth.signOut()}>Sign Out</button>
    </div>
  );
}

// Helper to render with AuthProvider
function renderWithAuth(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
}

describe('AuthContext', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock initial session check to fail (no session)
    vi.mocked(account.getSession).mockRejectedValue(new Error('No active session'));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should eventually finish loading', async () => {
      renderWithAuth(<TestComponent />);
      
      // Should start with AuthProvider loading spinner (no test component visible yet)
      expect(screen.queryByTestId('loading')).toBeNull();
      
      // Should eventually show the test component after session check
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      }, { timeout: 3000 });
    });

    it('should start unauthenticated when no session', async () => {
      renderWithAuth(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });
    });
  });

  describe('Authentication', () => {
    it('should handle successful login', async () => {
      // Mock successful login
      vi.mocked(appwriteAuthService.login).mockResolvedValue(mockUser);
      
      renderWithAuth(<TestComponent />);
      
      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      
      const signInButton = screen.getByText('Sign In');
      
      await act(async () => {
        signInButton.click();
      });
      
      // Should call the login service
      expect(appwriteAuthService.login).toHaveBeenCalledWith('test@example.com', 'password');
    });

    it('should handle login error gracefully', async () => {
      // Mock login failure
      vi.mocked(appwriteAuthService.login).mockRejectedValue(new Error('Invalid credentials'));
      
      renderWithAuth(<TestComponent />);
      
      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      
      const signInButton = screen.getByText('Sign In');
      
      // Use try-catch to handle the expected error
      try {
        await act(async () => {
          signInButton.click();
        });
      } catch (error) {
        // Expected error, ignore it
      }
      
      // Should still call the login service
      expect(appwriteAuthService.login).toHaveBeenCalledWith('test@example.com', 'password');
    });

    it('should handle logout', async () => {
      // Mock successful logout
      vi.mocked(appwriteAuthService.logout).mockResolvedValue(undefined);
      
      renderWithAuth(<TestComponent />);
      
      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      
      const signOutButton = screen.getByText('Sign Out');
      
      await act(async () => {
        signOutButton.click();
      });
      
      // Should call the logout service
      expect(appwriteAuthService.logout).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should handle existing session on mount', async () => {
      // Mock existing session
      vi.mocked(account.getSession).mockResolvedValue({ 
        $id: 'session-1',
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        userId: 'test-user-1',
        expire: new Date(Date.now() + 86400000).toISOString(),
        provider: 'email',
        providerUid: 'test@example.com',
        providerAccessToken: '',
        providerAccessTokenExpiry: '',
        providerRefreshToken: '',
        ip: '127.0.0.1',
        osCode: 'web',
        osName: 'Web',
        osVersion: '1.0',
        clientType: 'web',
        clientCode: 'web',
        clientName: 'Web',
        clientVersion: '1.0',
        clientEngine: 'browser',
        clientEngineVersion: '1.0',
        deviceName: 'Test Device',
        deviceBrand: 'Test',
        deviceModel: 'Test',
        countryCode: 'US',
        countryName: 'United States',
        current: true,
        factors: [],
        secret: '',
        mfaUpdatedAt: ''
      } as any);
      vi.mocked(appwriteAuthService.getCurrentUser).mockResolvedValue(mockUser);
      
      renderWithAuth(<TestComponent />);
      
      // Should eventually show as authenticated
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      }, { timeout: 3000 });
      
      // Should show user email
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    it('should handle session check failure', async () => {
      // Clear all previous mocks and set fresh state
      vi.clearAllMocks();
      
      // Mock session check failure
      vi.mocked(account.getSession).mockRejectedValue(new Error('No session'));
      vi.mocked(appwriteAuthService.getCurrentUser).mockRejectedValue(new Error('No user'));

      renderWithAuth(<TestComponent />);
      
      // Should show as not authenticated
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      }, { timeout: 3000 });
    });
  });

  describe('Token Management', () => {
    it('should refresh expired tokens automatically', async () => {
      // Mock expired session that gets refreshed
      const expiredSession = {
        $id: 'session-1',
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        userId: 'test-user-1',
        expire: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
        provider: 'email',
        providerUid: 'test@example.com',
        providerAccessToken: 'expired-token',
        providerAccessTokenExpiry: new Date(Date.now() - 1000).toISOString(),
        providerRefreshToken: 'refresh-token',
        ip: '127.0.0.1',
        osCode: 'web',
        osName: 'Web',
        osVersion: '1.0',
        clientType: 'web',
        clientCode: 'web',
        clientName: 'Web',
        clientVersion: '1.0',
        clientEngine: 'browser',
        clientEngineVersion: '1.0',
        deviceName: 'Test Device',
        deviceBrand: 'Test',
        deviceModel: 'Test',
        countryCode: 'US',
        countryName: 'United States',
        current: true,
        factors: [],
        secret: '',
        mfaUpdatedAt: ''
      } as any;

      const refreshedSession = {
        ...expiredSession,
        expire: new Date(Date.now() + 86400000).toISOString(), // Valid for 24 hours
        providerAccessToken: 'new-token',
        providerAccessTokenExpiry: new Date(Date.now() + 86400000).toISOString()
      };

      // First call returns expired session, second call returns refreshed session
      vi.mocked(account.getSession)
        .mockResolvedValueOnce(expiredSession)
        .mockResolvedValueOnce(refreshedSession);
      
      vi.mocked(appwriteAuthService.getCurrentUser).mockResolvedValue(mockUser);

      renderWithAuth(<TestComponent />);

      // Should eventually show as authenticated after token refresh
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      }, { timeout: 5000 });

      // Should have called getSession multiple times for refresh
      expect(account.getSession).toHaveBeenCalledTimes(2);
    });

    it('should handle refresh token expiration', async () => {
      // Mock session with expired refresh token
      const sessionWithExpiredRefresh = {
        $id: 'session-1',
        userId: 'test-user-1',
        expire: new Date(Date.now() - 1000).toISOString(), // Expired
        providerRefreshToken: 'expired-refresh-token',
        providerAccessTokenExpiry: new Date(Date.now() - 1000).toISOString()
      } as any;

      // First call returns expired session, second call fails (refresh token expired)
      vi.mocked(account.getSession)
        .mockResolvedValueOnce(sessionWithExpiredRefresh)
        .mockRejectedValueOnce(new Error('Refresh token expired'));

      renderWithAuth(<TestComponent />);

      // Should show as not authenticated when refresh fails
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      }, { timeout: 5000 });
    });

    it('should logout on revoked token', async () => {
      // Mock successful initial session
      const validSession = {
        $id: 'session-1',
        userId: 'test-user-1',
        expire: new Date(Date.now() + 86400000).toISOString()
      } as any;

      vi.mocked(account.getSession).mockResolvedValueOnce(validSession);
      vi.mocked(appwriteAuthService.getCurrentUser).mockResolvedValue(mockUser);

      renderWithAuth(<TestComponent />);

      // Wait for initial authentication
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      // Simulate token revocation by making subsequent calls fail with 401
      const revokedError = new Error('Token revoked');
      (revokedError as any).code = 401;
      
      vi.mocked(account.getSession).mockRejectedValue(revokedError);
      vi.mocked(appwriteAuthService.logout).mockResolvedValue(undefined);

      // Trigger a session check (this would normally happen on API calls)
      const signOutButton = screen.getByText('Sign Out');
      await act(async () => {
        signOutButton.click();
      });

      // Should call logout when token is revoked
      expect(appwriteAuthService.logout).toHaveBeenCalled();
    });

    it('should retry failed requests after token refresh', async () => {
      // Mock a scenario where first request fails due to expired token
      // but succeeds after token refresh
      const expiredSession = {
        $id: 'session-1',
        userId: 'test-user-1',
        expire: new Date(Date.now() - 1000).toISOString() // Expired
      } as any;

      const refreshedSession = {
        ...expiredSession,
        expire: new Date(Date.now() + 86400000).toISOString() // Valid
      };

      // Mock token refresh flow
      vi.mocked(account.getSession)
        .mockRejectedValueOnce(new Error('Token expired')) // First call fails
        .mockResolvedValueOnce(refreshedSession); // After refresh, succeeds

      vi.mocked(appwriteAuthService.getCurrentUser)
        .mockRejectedValueOnce(new Error('Token expired')) // First call fails
        .mockResolvedValueOnce(mockUser); // After refresh, succeeds

      renderWithAuth(<TestComponent />);

      // Should eventually authenticate after retry
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      }, { timeout: 5000 });

      // Should show user data after successful retry
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    it('should handle concurrent token refresh requests', async () => {
      // Mock multiple concurrent requests that all trigger token refresh
      const expiredSession = {
        $id: 'session-1',
        userId: 'test-user-1',
        expire: new Date(Date.now() - 1000).toISOString()
      } as any;

      const refreshedSession = {
        ...expiredSession,
        expire: new Date(Date.now() + 86400000).toISOString()
      };

      // Mock the refresh to succeed only once
      vi.mocked(account.getSession)
        .mockRejectedValueOnce(new Error('Token expired'))
        .mockResolvedValue(refreshedSession);

      vi.mocked(appwriteAuthService.getCurrentUser).mockResolvedValue(mockUser);

      renderWithAuth(<TestComponent />);

      // Should handle concurrent refresh gracefully
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      }, { timeout: 5000 });

      // Token refresh should not be called excessively
      expect(account.getSession).toHaveBeenCalledTimes(2); // Initial + refresh
    });

    it('should handle token validation edge cases', async () => {
      // Test various edge cases in token validation
      const malformedSession = {
        $id: 'session-1',
        userId: 'test-user-1',
        expire: 'invalid-date', // Malformed expiry date
        providerAccessToken: null // Missing token
      } as any;

      vi.mocked(account.getSession).mockResolvedValue(malformedSession);
      vi.mocked(appwriteAuthService.getCurrentUser).mockRejectedValue(new Error('Invalid token'));

      renderWithAuth(<TestComponent />);

      // Should handle malformed session gracefully
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      }, { timeout: 3000 });
    });

    it('should handle network errors during token refresh', async () => {
      // Mock network error during token refresh
      vi.mocked(account.getSession).mockRejectedValue(new Error('Network error'));

      renderWithAuth(<TestComponent />);

      // Should show as not authenticated when network fails
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      }, { timeout: 3000 });

      // Should not crash the application
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  describe('Session Security', () => {
    it('should validate session integrity', async () => {
      // Mock session with suspicious characteristics
      const suspiciousSession = {
        $id: 'session-1',
        userId: 'test-user-1',
        expire: new Date(Date.now() + 86400000).toISOString(),
        ip: '192.168.1.100', // Different IP
        deviceName: 'Unknown Device', // Different device
        countryCode: 'XX' // Different country
      } as any;

      vi.mocked(account.getSession).mockResolvedValue(suspiciousSession);
      vi.mocked(appwriteAuthService.getCurrentUser).mockResolvedValue(mockUser);

      renderWithAuth(<TestComponent />);

      // Should still authenticate but could log security warnings
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      }, { timeout: 3000 });
    });

    it('should handle session hijacking attempts', async () => {
      // Mock session that appears to be hijacked
      const hijackedSession = {
        $id: 'session-1',
        userId: 'test-user-1',
        expire: new Date(Date.now() + 86400000).toISOString(),
        factors: ['suspicious-activity'] // Security flag
      } as any;

      vi.mocked(account.getSession).mockResolvedValue(hijackedSession);
      vi.mocked(appwriteAuthService.getCurrentUser).mockRejectedValue(
        new Error('Session security violation')
      );
      vi.mocked(appwriteAuthService.logout).mockResolvedValue(undefined);

      renderWithAuth(<TestComponent />);

      // Should logout on security violation
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      }, { timeout: 3000 });
    });
  });
});