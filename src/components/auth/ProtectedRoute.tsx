import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { UserRole } from '@/types/tournament-enums';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

const ProtectedRoute = ({ children, requiredRoles = [] }: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    } else if (user && requiredRoles.length > 0) {
      // Check if user has required role - need to compare as string values
      const userRole = user.role;
      const hasRequiredRole = requiredRoles.some(role => String(role) === String(userRole));
      
      if (!hasRequiredRole) {
        navigate('/unauthorized');
      }
    }
  }, [user, isLoading, isAuthenticated, navigate, requiredRoles]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
