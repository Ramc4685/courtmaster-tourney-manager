import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/auth/AuthContext';
import { Layout } from '@/components/layout/Layout';
import LoginPage from '@/pages/auth/LoginPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import LandingPage from '@/pages/LandingPage';
import DashboardPage from '@/pages/DashboardPage';
import TournamentListPage from '@/pages/tournaments/TournamentListPage';
import TournamentDetailsPage from '@/pages/TournamentDetail';
import CreateTournamentPage from '@/pages/tournaments/CreateTournamentPage';
import TournamentRegistrationPage from '@/pages/tournament/TournamentRegistration';
import RegistrationManagementPage from '@/pages/tournament/RegistrationManagement';
import ProfilePage from '@/pages/Profile';
import NotFound from '@/pages/NotFound';
import { CheckInPage } from '@/pages/tournament/CheckInPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <SignUpPage />
          </PublicRoute>
        }
      />

      {/* Landing Page - Redirect to dashboard if authenticated */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LandingPage />
          )
        }
      />

      {/* Private Routes */}
      <Route
        element={
          <PrivateRoute>
            <Layout>
              <Outlet />
            </Layout>
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tournaments">
          <Route index element={<TournamentListPage />} />
          <Route path="new" element={<CreateTournamentPage />} />
          <Route path=":id" element={<TournamentDetailsPage />} />
          <Route path=":id/register" element={<TournamentRegistrationPage />} />
          <Route path=":id/registrations" element={<RegistrationManagementPage />} />
          <Route path=":id/check-in" element={<CheckInPage />} />
        </Route>
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </Router>
  );
}
