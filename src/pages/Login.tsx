import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RegisterForm from '@/components/auth/RegisterForm';
import { useToast } from '@/hooks/use-toast';
import * as z from 'zod';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleDemoLogin = async () => {
    try {
      setIsLoading(true);
      await signIn('demo@example.com', 'demo123');
      toast({
        title: "Demo Login Successful",
        description: "You are now logged in as a demo user."
      });
      navigate('/tournaments');
    } catch (error) {
      console.error('Error with demo login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminDemoLogin = async () => {
    try {
      setIsLoading(true);
      await signIn('admin@example.com', 'demo123');
      toast({
        title: "Admin Demo Login Successful",
        description: "You are now logged in as an admin demo user."
      });
      navigate('/tournaments');
    } catch (error) {
      console.error('Error with admin demo login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    navigate('/dashboard');
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
        <CardContent className="space-y-6">
          <Tabs defaultValue="demo" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="demo">Quick Demo</TabsTrigger>
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="demo" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4">
                <Button 
                  onClick={handleDemoLogin} 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "User Demo Login"}
                </Button>
                
                <Button 
                  onClick={handleAdminDemoLogin}
                  className="w-full"
                  variant="secondary"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Admin Demo Login"}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="login" className="pt-4">
              <LoginForm onSuccess={handleSuccess} />
            </TabsContent>
            
            <TabsContent value="register" className="pt-4">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
