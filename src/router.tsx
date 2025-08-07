import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { AuthProvider } from '@/contexts/auth/AuthContext';
import { TournamentProvider } from '@/contexts/tournament/TournamentContext';
import { Layout } from '@/components/layout/Layout';
import LoginPage from '@/pages/auth/LoginPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import AuthCallbackPage from '@/pages/auth/AuthCallbackPage';
import DemoPage from '@/pages/demo/DemoPage';
import Index from '@/pages/Index';
import TournamentListPage from '@/pages/tournaments/TournamentListPage';
import TournamentDetailsPage from '@/pages/TournamentDetail';
import CreateTournamentPage from '@/pages/tournaments/CreateTournamentPage';
import TournamentRegistrationPage from '@/pages/tournament/TournamentRegistration';
import RegistrationManagementPage from '@/pages/tournament/RegistrationManagement';
import ProfilePage from "@/pages/Profile";
import Dashboard from "@/pages/Dashboard"; // Import Dashboard component
import NotFound from "@/pages/NotFound";
import NotificationsPage from "@/pages/NotificationsPage";
import { CheckInPage } from '@/pages/tournament/CheckInPage';
import { useAuth } from './contexts/auth/AuthContext';
import { Navigate } from 'react-router-dom';
import { NotificationProvider } from '@/contexts/notification/NotificationProvider';

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
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/tournaments" replace /> : <>{children}</>;
}

const router = createBrowserRouter([
  {
    element: <AuthProvider><NotificationProvider><Outlet /></NotificationProvider></AuthProvider>,
    children: [
      // Demo page route (public)
      {
        path: '/demo',
        element: <PublicRoute><React.Suspense fallback={<div>Loading...</div>}><DemoPage /></React.Suspense></PublicRoute>,
      },
      {
        path: '/',
        element: <Index />,
      },
      {
        path: '/login',
        element: (
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        ),
      },
      {
        path: '/signup',
        element: (
          <PublicRoute>
            <SignUpPage />
          </PublicRoute>
        ),
      },
      {
        path: '/auth/callback',
        element: <AuthCallbackPage />,
      },
      {
        element: (
          <PrivateRoute>
            <TournamentProvider>
              <Layout>
                <Outlet />
              </Layout>
            </TournamentProvider>
          </PrivateRoute>
        ),
        children: [
          {
            path: '/tournaments',
            element: <TournamentListPage />
          },
          {
            path: '/tournaments/new',
            element: <CreateTournamentPage />
          },
          {
            path: '/tournaments/:id',
            element: <TournamentDetailsPage />
          },
          {
            path: '/tournaments/:id/registration',
            element: <TournamentRegistrationPage />
          },
          {
            path: '/tournaments/:id/registration/manage',
            element: <RegistrationManagementPage />
          },
          {
            path: '/tournaments/:id/check-in',
            element: <CheckInPage />
          },
          {
            path: '/profile',
            element: <ProfilePage />
          },
          {
            path: "/dashboard",
            element: <Dashboard />
          },
          {
            path: "/notifications",
            element: <NotificationsPage />
          }
        ]
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default router;