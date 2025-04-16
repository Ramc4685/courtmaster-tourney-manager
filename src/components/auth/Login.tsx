import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from './LoginForm';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth/AuthContext';
import * as z from 'zod';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginProps {
  onSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { signIn } = useAuth();
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
    } catch (error) {
      console.error('Error with demo login:', error);
      toast({
        title: "Demo Login Failed",
        description: "Could not log in with demo account.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      await signIn(data.email, data.password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log in');
    }
  };

  return (
    <div className="container py-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="demo" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="demo">Quick Demo</TabsTrigger>
              <TabsTrigger value="login">Email Login</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
            </TabsList>
            
            <TabsContent value="demo" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Button 
                  onClick={handleDemoLogin} 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "User Demo Login"}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="login">
              <LoginForm onSuccess={onSuccess} />
            </TabsContent>
            
            <TabsContent value="google">
              <Button className="w-full" disabled>Sign in with Google (Coming Soon)</Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
