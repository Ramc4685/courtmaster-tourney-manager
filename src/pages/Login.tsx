import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth/AuthContext';

const Login: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/tournaments');
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to CourtMaster</CardTitle>
          <CardDescription>
            Sign in to manage your tournaments and track matches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleSignIn} 
            className="w-full"
            variant="outline"
          >
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
