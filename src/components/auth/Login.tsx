
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from './LoginForm';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth/AuthContext';

const Login = () => {
  const { login, enableDemoMode } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDemoLogin = async () => {
    try {
      setIsLoading(true);
      enableDemoMode(true);
      await login('demo@example.com', 'demo123');
      
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

  const handleAdminDemoLogin = async () => {
    try {
      setIsLoading(true);
      enableDemoMode(true);
      await login('admin@example.com', 'demo123');
      
      toast({
        title: "Admin Demo Login Successful",
        description: "You are now logged in as an admin demo user."
      });
    } catch (error) {
      console.error('Error with admin demo login:', error);
      toast({
        title: "Admin Demo Login Failed",
        description: "Could not log in with admin demo account.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
            
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            
            <TabsContent value="google">
              <Button className="w-full">Sign in with Google</Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
