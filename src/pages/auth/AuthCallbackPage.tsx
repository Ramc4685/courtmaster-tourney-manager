import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { account } from '@/lib/appwrite';
import { appwriteAuthService } from '@/services/auth/AppwriteAuthService';
import { toast } from 'sonner';

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if we have a current session
        try {
          const session = await account.getSession('current');
          
          // If we get here, we have a valid session
          // Get the user profile
          const profile = await appwriteAuthService.getCurrentUser();
          
          if (profile) {
            console.log('Authentication successful');
            toast.success('Successfully signed in!');
            // Redirect to tournaments page
            navigate('/tournaments');
            return;
          }
        } catch (sessionError) {
          console.error('Error getting session:', sessionError);
        }
        
        // If we get here, either there's no session or no profile
        console.error('No session found after OAuth callback');
        setError('Authentication failed. Please try again.');
        toast.error('Authentication failed');
        // Redirect to login after a short delay
        setTimeout(() => navigate('/login'), 2000);
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        setError('An unexpected error occurred');
        toast.error('Authentication failed');
        // Redirect to login after a short delay
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {error ? 'Authentication Error' : 'Completing Sign In...'}
        </h2>
        {error ? (
          <p className="mt-2 text-center text-sm text-red-600">{error}</p>
        ) : (
          <div className="mt-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </div>
  );
}