
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LogIn } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, isLoading, enableDemoMode } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoginError(null);
    console.log('[DEBUG] LoginForm: Submitting login form', data.email);
    
    try {
      // Ensure data has required properties by explicitly creating a UserCredentials object
      const credentials = {
        email: data.email,
        password: data.password
      };
      
      console.log('[DEBUG] LoginForm: Calling login function with credentials');
      const success = await login(credentials);
      console.log('[DEBUG] LoginForm: Login result', success);
      
      if (success && onSuccess) {
        console.log('[DEBUG] LoginForm: Login successful, calling onSuccess');
        onSuccess();
      } else if (!success) {
        console.log('[DEBUG] LoginForm: Login failed');
        setLoginError('Invalid email or password. Please try again.');
      }
    } catch (error) {
      console.error('[ERROR] LoginForm: Error during login', error);
      setLoginError(error instanceof Error ? error.message : 'An error occurred during login');
    }
  };

  const handleDemoLogin = async () => {
    setLoginError(null);
    console.log('[DEBUG] LoginForm: Using demo login');
    
    try {
      // Use the demo credentials
      const success = await login({
        email: 'demo@example.com',
        password: 'demo123'
      });
      
      if (success && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('[ERROR] LoginForm: Error during demo login', error);
      setLoginError(error instanceof Error ? error.message : 'An error occurred during demo login');
    }
  };

  const handleAdminDemoLogin = async () => {
    setLoginError(null);
    console.log('[DEBUG] LoginForm: Using admin demo login');
    
    try {
      // Use the admin demo credentials
      const success = await login({
        email: 'admin@example.com',
        password: 'demo123'
      });
      
      if (success && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('[ERROR] LoginForm: Error during admin demo login', error);
      setLoginError(error instanceof Error ? error.message : 'An error occurred during admin demo login');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {loginError && (
          <Alert variant="destructive">
            <AlertDescription>{loginError}</AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="******" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2">⏳</span> Logging in...
            </span>
          ) : (
            <span className="flex items-center">
              <LogIn className="mr-2 h-4 w-4" /> Log In
            </span>
          )}
        </Button>
        
        <div className="flex gap-2 mt-4">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1" 
            onClick={handleDemoLogin}
            disabled={isLoading}
          >
            Demo Login
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1" 
            onClick={handleAdminDemoLogin}
            disabled={isLoading}
          >
            Admin Demo
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default LoginForm;
