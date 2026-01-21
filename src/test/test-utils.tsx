import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider, AuthContextType } from '@/contexts/auth/AuthContext';
import { Profile, UserRole } from '@/types/entities';

// Mock user profiles for testing
export const mockUser: Profile = {
  id: 'test-user-1',
  email: 'test@example.com',
  full_name: 'Test User',
  display_name: 'Test User',
  role: UserRole.PLAYER,
  avatar_url: '',
  phone: '1234567890',
  preferences: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const mockAdminUser: Profile = {
  ...mockUser,
  id: 'admin-user-1',
  email: 'admin@example.com',
  full_name: 'Admin User',
  display_name: 'Admin User',
  role: UserRole.ADMIN
};

export const mockDemoUser: Profile = {
  ...mockUser,
  id: 'demo-user-1',
  email: 'demo@example.com',
  full_name: 'Demo User',
  display_name: 'Demo User'
};

// Mock auth context values
export const createMockAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  sessionChecked: true,
  demoMode: false,
  signIn: vi.fn().mockResolvedValue(null),
  signInWithGoogle: vi.fn().mockResolvedValue(undefined),
  signInWithApple: vi.fn().mockResolvedValue(undefined),
  signUp: vi.fn().mockResolvedValue(undefined),
  signOut: vi.fn().mockResolvedValue(undefined),
  updateUserProfile: vi.fn().mockResolvedValue(undefined),
  refreshSession: vi.fn().mockResolvedValue(undefined),
  clearError: vi.fn(),
  register: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
  ...overrides
});

// Mock AuthProvider for testing
interface MockAuthProviderProps {
  children: React.ReactNode;
  authValue?: Partial<AuthContextType>;
}

export const MockAuthProvider: React.FC<MockAuthProviderProps> = ({ 
  children, 
  authValue = {} 
}) => {
  const mockContext = createMockAuthContext(authValue);
  
  // Create a simple mock provider that provides the context
  const AuthContext = React.createContext<AuthContextType | null>(null);
  
  return (
    <AuthContext.Provider value={mockContext}>
      <div data-testid="mock-auth-provider">
        {children}
      </div>
    </AuthContext.Provider>
  );
};

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authValue?: Partial<AuthContextType>;
  initialEntries?: string[];
}

export function renderWithProviders(
  ui: ReactElement,
  {
    authValue = {},
    initialEntries = ['/'],
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <MockAuthProvider authValue={authValue}>
          {children}
        </MockAuthProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Helper to render with authenticated user
export function renderWithAuth(
  ui: ReactElement,
  user: Profile = mockUser,
  options: CustomRenderOptions = {}
) {
  return renderWithProviders(ui, {
    ...options,
    authValue: {
      user,
      isAuthenticated: true,
      sessionChecked: true,
      isLoading: false,
      ...options.authValue
    }
  });
}

// Helper to render with demo mode
export function renderWithDemoMode(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  return renderWithProviders(ui, {
    ...options,
    authValue: {
      demoMode: true,
      isAuthenticated: true,
      sessionChecked: true,
      isLoading: false,
      user: mockDemoUser,
      ...options.authValue
    }
  });
}

// Helper to render with loading state
export function renderWithLoading(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  return renderWithProviders(ui, {
    ...options,
    authValue: {
      isLoading: true,
      sessionChecked: false,
      isAuthenticated: false,
      user: null,
      ...options.authValue
    }
  });
}

// Mock implementations for common services
export const mockAppwriteAuthService = {
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  updateUserProfile: vi.fn(),
};

export const mockAccount = {
  getSession: vi.fn(),
  get: vi.fn(),
  createEmailPasswordSession: vi.fn(),
  create: vi.fn(),
  deleteSession: vi.fn(),
  createOAuth2Session: vi.fn()
};

export const mockDatabases = {
  listDocuments: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
  getDocument: vi.fn()
};

// Setup function to configure common mocks
export function setupMocks() {
  // Mock react-router-dom
  vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
      ...actual,
      useNavigate: () => vi.fn(),
      useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
      useParams: () => ({}),
    };
  });

  // Mock Appwrite
  vi.mock('@/lib/appwrite', () => ({
    account: mockAccount,
    databases: mockDatabases,
    client: {
      subscribe: vi.fn(() => vi.fn())
    }
  }));

  // Mock auth service
  vi.mock('@/services/auth/AppwriteAuthService', () => ({
    appwriteAuthService: mockAppwriteAuthService
  }));

  // Mock toast
  vi.mock('@/components/ui/use-toast', () => ({
    toast: vi.fn(),
    useToast: () => ({
      toast: vi.fn()
    })
  }));

  // Mock useAuth hook
  vi.mock('@/contexts/auth/AuthContext', async () => {
    const actual = await vi.importActual('@/contexts/auth/AuthContext');
    return {
      ...actual,
      useAuth: vi.fn()
    };
  });
}

// Cleanup function
export function cleanupMocks() {
  vi.clearAllMocks();
  vi.resetAllMocks();
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
