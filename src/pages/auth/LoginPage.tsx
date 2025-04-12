import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(email, password);
      toast.success('Welcome back!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    console.log('[DEBUG] LoginPage: Starting demo login');
    setIsLoading(true);
    try {
      await signIn('demo', 'demo123');
      console.log('[DEBUG] LoginPage: Demo login successful');
      toast.success('Welcome to the demo!');
    } catch (error) {
      console.error('[ERROR] LoginPage: Demo login error:', error);
      toast.error('Failed to sign in with demo account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminDemoLogin = async () => {
    console.log('[DEBUG] LoginPage: Starting admin demo login');
    setIsLoading(true);
    try {
      await signIn('demo-admin', 'demo123');
      console.log('[DEBUG] LoginPage: Admin demo login successful');
      toast.success('Welcome to the admin demo!');
    } catch (error) {
      console.error('[ERROR] LoginPage: Admin demo login error:', error);
      toast.error('Failed to sign in with admin demo account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to CourtMaster
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to="/signup"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account or try the demo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="demo" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="demo">Quick Demo</TabsTrigger>
                <TabsTrigger value="login">Email Login</TabsTrigger>
              </TabsList>

              <TabsContent value="demo" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-4">
                    <Button
                      onClick={handleDemoLogin}
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Loading..." : "Try Player Demo"}
                    </Button>
                    <p className="text-sm text-gray-600">
                      Experience the player view with pre-loaded sample tournaments and registrations. Register for tournaments, manage your matches, and track your performance.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={handleAdminDemoLogin}
                      className="w-full"
                      variant="secondary"
                      disabled={isLoading}
                    >
                      {isLoading ? "Loading..." : "Try Tournament Admin Demo"}
                    </Button>
                    <p className="text-sm text-gray-600">
                      Access tournament management with sample data. Create events, manage registrations, organize brackets, and see how the system works with realistic data.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="login" className="space-y-4 pt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 