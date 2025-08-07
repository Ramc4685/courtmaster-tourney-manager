import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { appwriteAuthService } from '@/services/auth/AppwriteAuthService';
import { AppwriteException } from 'appwrite';

export default function DemoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, isAuthenticated, isLoading: authLoading, sessionChecked } = useAuth();
  const navigate = useNavigate();

  const handleQuickLogin = async () => {
    const demoEmail = 'demoadmin@example.com';
    const demoPassword = 'demopassword';
    
    setIsLoading(true);

    try {
      // First, ensure we're logged out to prevent session conflicts
      try {
        await appwriteAuthService.logout();
        // Add a small delay after logout to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (logoutError) {
        // Ignore logout errors - it's fine if we weren't logged in
        console.log('[DemoPage] Logout before demo login:', logoutError);
      }
      
      // Now try to sign in. This handles the case where the demo user already exists.
      try {
        await signIn(demoEmail, demoPassword);
        toast.success('Welcome back to the demo!');
        navigate('/tournaments');
        return;
      } catch (signInError: any) {
        console.log('[DemoPage] Sign-in error type:', signInError?.type);
        
        // Handle rate limiting explicitly
        if (signInError?.type === 'RATE_LIMIT') {
          toast.error('Too many login attempts. Please wait a moment and try again.');
          return;
        }
        
        // If sign-in fails because the user doesn't exist, then sign them up
        if (signInError?.type === 'INVALID_CREDENTIALS') {
          try {
            // Add a small delay before signup to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            await signUp(demoEmail, demoPassword, 'Demo Admin');
            // The signUp function in AuthContext now handles the subsequent login and navigation
            toast.success('Demo account created. Welcome!');
            return;
          } catch (signUpError: any) {
            console.error('[DemoPage] Demo sign-up error:', signUpError);
            
            // Handle rate limiting for signup
            if (signUpError?.type === 'RATE_LIMIT') {
              toast.error('Too many signup attempts. Please wait a moment and try again.');
              return;
            }
            
            throw signUpError; // Re-throw to be caught by outer catch
          }
        } else {
          // Re-throw other errors
          throw signInError;
        }
      }
    } catch (error: any) {
      // Handle any errors that weren't handled above
      console.error('[DemoPage] An unexpected error occurred during demo login:', error);
      
      // Provide more specific error messages
      if (error?.type === 'RATE_LIMIT') {
        toast.error('Rate limit exceeded. Please wait a few minutes before trying again.');
      } else {
        toast.error(error?.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking session
  if (!sessionChecked || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/tournaments" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          CourtMaster Demo
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Experience CourtMaster with a pre-configured demo account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Demo Access</CardTitle>
            <CardDescription>
              Get instant access to CourtMaster features with our demo account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Try CourtMaster with our demo account to explore all features. No registration required!
              </p>
              
              <Button
                type="button"
                className="w-full"
                onClick={handleQuickLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></div>
                    Accessing Demo...
                  </div>
                ) : (
                  'Access Demo Account'
                )}
              </Button>
              
              <div className="text-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/auth/login')}
                  disabled={isLoading}
                  className="text-sm"
                >
                  Back to Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
