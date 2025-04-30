import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/auth/AuthContext';
import { Layout } from '@/components/layout/Layout';
import LoginPage from '@/pages/auth/LoginPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import Index from '@/pages/Index';
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

  return !isAuthenticated ? <>{children}</> : <Navigate to="/tournaments" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
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

      {/* Protected Routes */}
      <Route
        path="/tournaments"
        element={
          <PrivateRoute>
            <Layout>
              <TournamentListPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/tournaments/new"
        element={
          <PrivateRoute>
            <Layout>
              <CreateTournamentPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/tournaments/:id"
        element={
          <PrivateRoute>
            <Layout>
              <TournamentDetailsPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/tournaments/:id/registration"
        element={
          <PrivateRoute>
            <Layout>
              <TournamentRegistrationPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/tournaments/:id/registration/manage"
        element={
          <PrivateRoute>
            <Layout>
              <RegistrationManagementPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/tournaments/:id/check-in"
        element={
          <PrivateRoute>
            <Layout>
              <CheckInPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </PrivateRoute>
        }
      />

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
        <Toaster />
      </AuthProvider>
    </Router>
  );
}
