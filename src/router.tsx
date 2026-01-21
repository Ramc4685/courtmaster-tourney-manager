import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';

// Providers (keep synchronous for critical path)
import { AuthProvider } from '@/contexts/auth/AuthContext';
import { TournamentProvider } from '@/contexts/tournament/TournamentContext';
import { NotificationProvider } from '@/contexts/notification/NotificationProvider';
import { RegistrationProvider } from '@/contexts/registration/RegistrationContext';

// Layout components (keep synchronous for critical path)
import { Layout } from '@/components/layout/Layout';
import { FrontDeskLayout } from '@/components/layout/FrontDeskLayout';
import { RouteErrorBoundary } from '@/components/common/ErrorBoundary';
import ChunkErrorBoundary from '@/components/common/ChunkErrorBoundary';
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider';

// Critical loading component
const PageLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    <span className="ml-3 text-lg text-muted-foreground">Loading...</span>
  </div>
);

// Skeleton loading components for better UX
const DashboardSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
      ))}
    </div>
  </div>
);

const TournamentListSkeleton = () => (
  <div className="p-6 space-y-4">
    <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3"></div>
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
    ))}
  </div>
);

// Lazy loaded components with preloading hints
// Core auth pages (high priority)
const LoginPage = React.lazy(() =>
  import('@/pages/auth/LoginPage').then(module => ({ default: module.default }))
);
const SignUpPage = React.lazy(() =>
  import('@/pages/auth/SignUpPage').then(module => ({ default: module.default }))
);
const AuthCallbackPage = React.lazy(() =>
  import('@/pages/auth/AuthCallbackPage').then(module => ({ default: module.default }))
);

// Main pages (high priority)
const Index = React.lazy(() =>
  import('@/pages/Index').then(module => ({ default: module.default }))
);
const Dashboard = React.lazy(() =>
  import('@/pages/Dashboard').then(module => ({ default: module.default }))
);
const ProfilePage = React.lazy(() =>
  import('@/pages/Profile').then(module => ({ default: module.default }))
);
const NotificationsPage = React.lazy(() =>
  import('@/pages/NotificationsPage').then(module => ({ default: module.default }))
);

// Tournament management pages (medium priority)
const TournamentListPage = React.lazy(() =>
  import('@/pages/tournaments/TournamentListPage').then(module => ({ default: module.default }))
);
const TournamentDetailsPage = React.lazy(() =>
  import('@/pages/TournamentDetail').then(module => ({ default: module.default }))
);
const CreateTournamentPage = React.lazy(() =>
  import('@/pages/tournaments/CreateTournamentPage').then(module => ({ default: module.default }))
);
const TournamentRegistrationPage = React.lazy(() =>
  import('@/pages/tournament/TournamentRegistration').then(module => ({ default: module.default }))
);
const RegistrationManagementPage = React.lazy(() =>
  import('@/pages/tournament/RegistrationManagement').then(module => ({ default: module.default }))
);
const CheckInPage = React.lazy(() =>
  import('@/pages/tournament/CheckInPage').then(module => ({ default: module.CheckInPage }))
);
const TournamentTemplatesPage = React.lazy(() =>
  import('@/pages/tournament/TournamentTemplatesPage').then(module => ({ default: module.TournamentTemplatesPage }))
);
const TournamentWizardPage = React.lazy(() =>
  import('@/pages/tournament/TournamentWizardPage').then(module => ({ default: module.TournamentWizardPage }))
);

// Front desk pages (medium priority)
const FrontDeskDashboardPage = React.lazy(() =>
  import('@/pages/frontdesk/FrontDeskDashboardPage').then(module => ({ default: module.FrontDeskDashboardPage }))
);
const AnnouncementsPage = React.lazy(() =>
  import('@/pages/frontdesk/AnnouncementsPage').then(module => ({ default: module.AnnouncementsPage }))
);
const WaiverManagementPage = React.lazy(() =>
  import('@/pages/frontdesk/WaiverManagementPage').then(module => ({ default: module.WaiverManagementPage }))
);

// Demo and other pages (low priority)
const DemoPage = React.lazy(() =>
  import('@/pages/demo/DemoPage').then(module => ({ default: module.default }))
);
const NotFound = React.lazy(() =>
  import('@/pages/NotFound').then(module => ({ default: module.default }))
);

// Enhanced preloading with route grouping and error handling
const preloadCriticalRoutes = () => {
  if (typeof window !== 'undefined') {
    // Preload critical routes immediately after initial render
    setTimeout(() => {
      Promise.all([
        import('@/pages/Dashboard'),
        import('@/pages/tournaments/TournamentListPage'),
        import('@/pages/Profile'),
      ]).catch(error => {
        console.warn('Failed to preload critical routes:', error);
      });
    }, 500);

    // Preload secondary routes after critical ones
    setTimeout(() => {
      Promise.all([
        import('@/pages/tournaments/CreateTournamentPage'),
        import('@/pages/tournament/TournamentRegistration'),
        import('@/pages/NotificationsPage'),
      ]).catch(error => {
        console.warn('Failed to preload secondary routes:', error);
      });
    }, 2000);

    // Preload front desk routes for staff users
    setTimeout(() => {
      Promise.all([
        import('@/pages/frontdesk/FrontDeskDashboardPage'),
        import('@/pages/tournament/CheckInPage'),
      ]).catch(error => {
        console.warn('Failed to preload front desk routes:', error);
      });
    }, 3000);
  }
};

// Enhanced route prefetching based on user navigation patterns
const prefetchRouteOnHover = (routePath: string) => {
  const prefetchMap: Record<string, () => Promise<any>> = {
    '/dashboard': () => import('@/pages/Dashboard'),
    '/tournaments': () => import('@/pages/tournaments/TournamentListPage'),
    '/tournaments/new': () => import('@/pages/tournaments/CreateTournamentPage'),
    '/profile': () => import('@/pages/Profile'),
    '/notifications': () => import('@/pages/NotificationsPage'),
  };

  const prefetchFn = prefetchMap[routePath];
  if (prefetchFn) {
    prefetchFn().catch(error => {
      console.warn(`Failed to prefetch route ${routePath}:`, error);
    });
  }
};

// Call preload function
preloadCriticalRoutes();

// Export prefetch function for use in navigation components
export { prefetchRouteOnHover };

// Utilities
import { useAuth } from './contexts/auth/AuthContext';
import { Navigate } from 'react-router-dom';

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

// Wrapper component to access auth context for onboarding
function AuthenticatedWrapper() {
  const { user } = useAuth();
  return (
    <OnboardingProvider userRole={user?.role}>
      <Outlet />
    </OnboardingProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <AuthProvider><NotificationProvider><AuthenticatedWrapper /></NotificationProvider></AuthProvider>,
    children: [
      // Public routes
      {
        path: '/',
        element: (
          <Suspense fallback={<PageLoadingSpinner />}>
            <Index />
          </Suspense>
        ),
      },
      {
        path: '/demo',
        element: (
          <PublicRoute>
            <Suspense fallback={<PageLoadingSpinner />}>
              <DemoPage />
            </Suspense>
          </PublicRoute>
        ),
      },
      {
        path: '/login',
        element: (
          <PublicRoute>
            <Suspense fallback={<PageLoadingSpinner />}>
              <LoginPage />
            </Suspense>
          </PublicRoute>
        ),
      },
      {
        path: '/signup',
        element: (
          <PublicRoute>
            <Suspense fallback={<PageLoadingSpinner />}>
              <SignUpPage />
            </Suspense>
          </PublicRoute>
        ),
      },
      {
        path: '/auth/callback',
        element: (
          <Suspense fallback={<PageLoadingSpinner />}>
            <AuthCallbackPage />
          </Suspense>
        ),
      },
      
      // Main authenticated routes with standard layout
      {
        element: (
          <PrivateRoute>
            <TournamentProvider>
              <RegistrationProvider>
                <Layout>
                  <Outlet />
                </Layout>
              </RegistrationProvider>
            </TournamentProvider>
          </PrivateRoute>
        ),
        children: [
          // Dashboard and profile
          {
            path: '/dashboard',
            element: (
              <Suspense fallback={<DashboardSkeleton />}>
                <Dashboard />
              </Suspense>
            )
          },
          {
            path: '/profile',
            element: (
              <Suspense fallback={<PageLoadingSpinner />}>
                <ProfilePage />
              </Suspense>
            )
          },
          {
            path: '/notifications',
            element: (
              <Suspense fallback={<PageLoadingSpinner />}>
                <NotificationsPage />
              </Suspense>
            )
          },

          // Tournament management
          {
            path: '/tournaments',
            element: (
              <ChunkErrorBoundary route="tournaments">
                <Suspense fallback={<TournamentListSkeleton />}>
                  <TournamentListPage />
                </Suspense>
              </ChunkErrorBoundary>
            )
          },
          {
            path: '/tournaments/new',
            element: (
              <ChunkErrorBoundary route="create-tournament">
                <Suspense fallback={<PageLoadingSpinner />}>
                  <CreateTournamentPage />
                </Suspense>
              </ChunkErrorBoundary>
            )
          },
          {
            path: '/tournaments/templates',
            element: (
              <Suspense fallback={<PageLoadingSpinner />}>
                <TournamentTemplatesPage />
              </Suspense>
            )
          },
          {
            path: '/tournaments/wizard',
            element: (
              <Suspense fallback={<PageLoadingSpinner />}>
                <TournamentWizardPage />
              </Suspense>
            )
          },
          {
            path: '/tournaments/:id',
            element: (
              <Suspense fallback={<PageLoadingSpinner />}>
                <TournamentDetailsPage />
              </Suspense>
            )
          },

          // Registration management
          {
            path: '/tournaments/:id/registration',
            element: (
              <Suspense fallback={<PageLoadingSpinner />}>
                <TournamentRegistrationPage />
              </Suspense>
            )
          },
          {
            path: '/tournaments/:id/registration/manage',
            element: (
              <Suspense fallback={<PageLoadingSpinner />}>
                <RegistrationManagementPage />
              </Suspense>
            )
          },
          
          // Match and scheduling
          // {
          //   path: '/tournaments/:id/schedule',
          //   element: <MatchSchedulePage />
          // },
          // {
          //   path: '/tournaments/:id/matches/:matchId/score',
          //   element: <ScoreEntryPage />
          // },
          // {
          //   path: '/tournaments/:id/courts',
          //   element: <CourtAssignmentPage />
          // },
          
          // Analytics
          // {
          //   path: '/tournaments/:id/analytics',
          //   element: <AnalyticsDashboardPage />
          // }
        ]
      },
      
      // Front desk specific layout and routes
      {
        element: (
          <PrivateRoute>
            <TournamentProvider>
              <RegistrationProvider>
                <FrontDeskLayout>
                  <Outlet />
                </FrontDeskLayout>
              </RegistrationProvider>
            </TournamentProvider>
          </PrivateRoute>
        ),
        children: [
          {
            path: '/frontdesk/:id',
            element: (
              <Suspense fallback={<DashboardSkeleton />}>
                <FrontDeskDashboardPage />
              </Suspense>
            )
          },
          {
            path: '/frontdesk/:id/check-in',
            element: (
              <Suspense fallback={<PageLoadingSpinner />}>
                <CheckInPage />
              </Suspense>
            )
          },
          {
            path: '/frontdesk/:id/announcements',
            element: (
              <Suspense fallback={<PageLoadingSpinner />}>
                <AnnouncementsPage />
              </Suspense>
            )
          },
          {
            path: '/frontdesk/:id/waivers',
            element: (
              <Suspense fallback={<PageLoadingSpinner />}>
                <WaiverManagementPage />
              </Suspense>
            )
          },
          // {
          //   path: '/frontdesk/:id/courts',
          //   element: <CourtAssignmentPage />
          // }
        ]
      },
      
      // Fallback route
      {
        path: '*',
        element: (
          <Suspense fallback={<PageLoadingSpinner />}>
            <NotFound />
          </Suspense>
        )
      }
    ]
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default router;