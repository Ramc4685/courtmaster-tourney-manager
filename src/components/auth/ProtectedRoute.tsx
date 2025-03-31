
import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import Layout from '@/components/layout/Layout';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRole?: 'admin' | 'user';
  withLayout?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  withLayout = true,
}) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Redirect to home if not logged in, remember the page they tried to access
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // If a specific role is required and user doesn't have it, redirect to home
    return <Navigate to="/" replace />;
  }

  // Use children if provided, otherwise render Outlet for nested routes
  const content = children || <Outlet />;

  // Wrap in Layout if withLayout is true
  if (withLayout) {
    return <>{content}</>;
  }

  return <>{content}</>;
};

export default ProtectedRoute;
