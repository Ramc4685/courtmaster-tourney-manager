import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import { UserRole } from '@/types/tournament-enums';
import { account } from '@/lib/appwrite';
import { appwriteAuthService } from '@/services/auth/AppwriteAuthService';

// Mock dependencies
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

function TokenTestComponent() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="loading">{auth.isLoading.toString()}</div>
      <div data-testid="user-email">{auth.user?.email || 'no-email'}</div>
    </div>
  );
}

function renderWithAuth(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
}

describe('Token Refresh Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(account.getSession).mockRejectedValue(new Error('No active session'));
  });

  describe('Expired Token Handling', () => {
    it('should handle expired token gracefully', async () => {
      const expiredSession = {
        $id: 'session-1',
        userId: 'test-user-1',
        expire: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
        provider: 'email',
        current: true
      } as any;

      vi.mocked(account.getSession).mockResolvedValue(expiredSession);
      vi.mocked(appwriteAuthService.getCurrentUser).mockRejectedValue(
        new Error('Token expired')
      );

      renderWithAuth(<TokenTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      }, { timeout: 3000 });
    });

    it('should handle token refresh success', async () => {
      const validSession = {
        $id: 'session-1',
        userId: 'test-user-1',
        expire: new Date(Date.now() + 86400000).toISOString(), // Valid for 24 hours
        provider: 'email',
        current: true
      } as any;

      vi.mocked(account.getSession).mockResolvedValue(validSession);
      vi.mocked(appwriteAuthService.getCurrentUser).mockResolvedValue(mockUser);

      renderWithAuth(<TokenTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      }, { timeout: 3000 });

      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
  });

  describe('Refresh Token Expiration', () => {
    it('should handle refresh token expiration', async () => {
      const sessionError = new Error('Refresh token expired');
      (sessionError as any).code = 401;

      vi.mocked(account.getSession).mockRejectedValue(sessionError);

      renderWithAuth(<TokenTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      }, { timeout: 3000 });
    });
  });
});
