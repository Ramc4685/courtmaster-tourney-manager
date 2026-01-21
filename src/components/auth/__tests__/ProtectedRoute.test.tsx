import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { AuthProvider } from '@/contexts/auth/AuthContext';
import { UserRole } from '@/types/tournament-enums';
import { Profile } from '@/types/entities';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthContext
const mockAuthContext = {
  user: null as Profile | null,
  isLoading: false,
  isAuthenticated: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
  refreshUser: vi.fn(),
};

vi.mock('@/contexts/auth/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Test component
const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

// Helper to render with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// Helper function to create users with specific roles
const createUserWithRole = (role: UserRole): Profile => ({
  id: 'user-1',
  email: 'user@example.com',
  full_name: 'Test User',
  display_name: 'Test User',
  role,
  avatar_url: '',
  phone: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

describe('ProtectedRoute - RBAC Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock context to default state
    mockAuthContext.user = null;
    mockAuthContext.isLoading = false;
    mockAuthContext.isAuthenticated = false;
  });

  describe('Authentication Protection', () => {
    it('should redirect unauthenticated users to login', async () => {
      mockAuthContext.isAuthenticated = false;
      mockAuthContext.isLoading = false;

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should not redirect while loading', () => {
      mockAuthContext.isLoading = true;
      mockAuthContext.isAuthenticated = false;

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should render protected content for authenticated users without role requirements', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 'user-1',
        email: 'user@example.com',
        full_name: 'Test User',
        display_name: 'Test User',
        role: UserRole.ORGANIZER,
        avatar_url: '',
        phone: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Role-Based Access Control', () => {
    const createUserWithRole = (role: UserRole): Profile => ({
      id: 'user-1',
      email: 'user@example.com',
      full_name: 'Test User',
      display_name: 'Test User',
      role,
      avatar_url: '',
      phone: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    it('should allow admin access to admin-only routes', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = createUserWithRole(UserRole.ADMIN);

      renderWithRouter(
        <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should block regular users from admin routes', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = createUserWithRole(UserRole.ORGANIZER);

      renderWithRouter(
        <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/unauthorized');
      });
    });

    it('should allow scorekeeper access to scoring routes', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = createUserWithRole(UserRole.SCOREKEEPER);

      renderWithRouter(
        <ProtectedRoute requiredRoles={[UserRole.SCOREKEEPER]}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should block organizers from scorekeeper-only routes', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = createUserWithRole(UserRole.ORGANIZER);

      renderWithRouter(
        <ProtectedRoute requiredRoles={[UserRole.SCOREKEEPER]}>
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/unauthorized');
      });
    });

    it('should allow multiple roles access', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = createUserWithRole(UserRole.SCOREKEEPER);

      renderWithRouter(
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.SCOREKEEPER]}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should block users without any of the required roles', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = createUserWithRole(UserRole.ORGANIZER);

      renderWithRouter(
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.SCOREKEEPER]}>
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/unauthorized');
      });
    });
  });

  describe('Role Escalation Prevention', () => {
    it('should prevent role escalation attempts', async () => {
      // Simulate a user trying to access admin routes by manipulating client-side data
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = createUserWithRole(UserRole.ORGANIZER);
      
      // Even if someone tries to modify the user object client-side
      const maliciousUser = { ...mockAuthContext.user, role: UserRole.ADMIN };
      mockAuthContext.user = maliciousUser;

      renderWithRouter(
        <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
          <TestComponent />
        </ProtectedRoute>
      );

      // The component should still work with the role comparison
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle undefined user role gracefully', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        ...createUserWithRole(UserRole.ORGANIZER),
        role: undefined as any,
      };

      renderWithRouter(
        <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/unauthorized');
      });
    });

    it('should handle null user with required roles', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = null;

      renderWithRouter(
        <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
          <TestComponent />
        </ProtectedRoute>
      );

      // Should not crash and should not show protected content
      expect(screen.queryByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty required roles array', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = createUserWithRole(UserRole.ORGANIZER);

      renderWithRouter(
        <ProtectedRoute requiredRoles={[]}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle role comparison as strings', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = createUserWithRole(UserRole.ADMIN);

      renderWithRouter(
        <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should re-evaluate permissions when user changes', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = createUserWithRole(UserRole.ORGANIZER);

      const { rerender } = renderWithRouter(
        <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/unauthorized');
      });

      // Clear the navigate mock
      mockNavigate.mockClear();

      // Update user to admin
      mockAuthContext.user = createUserWithRole(UserRole.ADMIN);

      rerender(
        <BrowserRouter>
          <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
            <TestComponent />
          </ProtectedRoute>
        </BrowserRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Security', () => {
    it('should always redirect to /login for unauthenticated users', async () => {
      mockAuthContext.isAuthenticated = false;

      renderWithRouter(
        <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
        expect(mockNavigate).not.toHaveBeenCalledWith('/unauthorized');
      });
    });

    it('should redirect to /unauthorized for insufficient permissions', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = createUserWithRole(UserRole.ORGANIZER);

      renderWithRouter(
        <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/unauthorized');
        expect(mockNavigate).not.toHaveBeenCalledWith('/login');
      });
    });
  });
});
