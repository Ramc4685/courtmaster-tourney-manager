
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/contexts/auth/AuthContext';
import { Layout } from '@/components/layout/Layout';
import LoginPage from '@/pages/auth/LoginPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import Home from '@/pages/Home';
import LandingPage from '@/pages/LandingPage'; // Import new landing page
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
  console.log('[DEBUG] PrivateRoute:', { isAuthenticated, isLoading });

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
  console.log('[DEBUG] PublicRoute:', { isAuthenticated, isLoading });

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

      {/* Landing Page Route - public access */}
      <Route path="/" element={<LandingPage />} />

      {/* Home Route */}
      <Route path="/home" element={<Home />} />

      {/* Private Routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout>
              <Outlet />
            </Layout>
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tournaments">
          <Route index element={<TournamentListPage />} />
          <Route path="new" element={<CreateTournamentPage />} />
          <Route path=":id" element={<TournamentDetailsPage />} />
          <Route path=":id/register" element={<TournamentRegistrationPage />} />
          <Route path=":id/registrations" element={<RegistrationManagementPage />} />
          <Route path=":id/check-in" element={<CheckInPage />} />
        </Route>
        <Route path="profile" element={<ProfilePage />} />
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
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}
