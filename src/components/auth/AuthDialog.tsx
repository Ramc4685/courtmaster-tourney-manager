
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface AuthDialogProps {
  children?: React.ReactNode;
  defaultTab?: 'demo' | 'login' | 'register';
  buttonClassName?: string;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onAuthSuccess?: () => void;
}

const AuthDialog: React.FC<AuthDialogProps> = ({
  children,
  defaultTab = 'demo',
  onAuthSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const { user, login, enableDemoMode } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSuccess = () => {
    setOpen(false);
    if (onAuthSuccess) {
      onAuthSuccess();
    }
  };
  
  const handleDemoLogin = async () => {
    try {
      setIsLoading(true);
      enableDemoMode(true);
      const success = await login({
        email: 'demo@example.com',
        password: 'demo123'
      });
      
      if (success) {
        toast({
          title: "Demo Login Successful",
          description: "You are now logged in as a demo user."
        });
        handleSuccess();
      }
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
      const success = await login({
        email: 'admin@example.com',
        password: 'demo123'
      });
      
      if (success) {
        toast({
          title: "Admin Demo Login Successful",
          description: "You are now logged in as an admin demo user."
        });
        handleSuccess();
      }
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
  
  // If user is already authenticated, don't show the dialog
  if (user) {
    return <>{children}</>;
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to CourtMaster</DialogTitle>
          <DialogDescription>
            Sign in to your account or create a new one to get started.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={defaultTab} className="w-full">
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
          
          <TabsContent value="login" className="mt-4">
            <LoginForm onSuccess={handleSuccess} />
          </TabsContent>
          
          <TabsContent value="register" className="mt-4">
            <RegisterForm onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
