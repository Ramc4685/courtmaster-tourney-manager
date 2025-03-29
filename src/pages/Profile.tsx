
import React, { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth/AuthContext';
import PageHeader from '@/components/shared/PageHeader';
import { Edit, User, Trophy, Settings, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Subscription {
  id: string;
  plan: string;
  status: string;
  data_retention_days: number;
  max_tournaments: number;
  max_players_per_tournament: number;
  custom_branding: boolean;
  advanced_analytics: boolean;
  started_at: string;
  current_period_end: string | null;
}

interface Tournament {
  id: string;
  data: any;
  created_at: string;
  user_id: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [userTournaments, setUserTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);
  
  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      // Fetch subscription data
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subscriptionError);
        toast({
          title: "Error",
          description: "Failed to load subscription data",
          variant: "destructive",
        });
      } else if (subscriptionData) {
        setSubscription(subscriptionData as Subscription);
      }
      
      // Fetch user's tournaments
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (tournamentsError) {
        console.error('Error fetching tournaments:', tournamentsError);
        toast({
          title: "Error",
          description: "Failed to load tournament data",
          variant: "destructive",
        });
      } else if (tournamentsData) {
        setUserTournaments(tournamentsData as Tournament[]);
      }
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Helper to capitalize plan name
  const formatPlanName = (plan: string) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };
  
  // Redirect to home if not logged in
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <PageHeader 
          title="User Profile" 
          description="Manage your profile information and subscription" 
          icon={<User className="h-6 w-6 text-court-green" />}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Manage your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-base">{user.name}</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-base">{user.email}</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-gray-500">Account created</p>
                  <p className="text-base">{formatDate(user.createdAt)}</p>
                </div>
                {user.role === 'admin' && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Role</p>
                      <Badge>Administrator</Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {subscription && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Subscription</CardTitle>
                  <CardDescription>Your current plan details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Plan</p>
                    <div className="flex items-center space-x-2">
                      <Badge className={subscription.plan === 'free' ? 'bg-gray-500' : 'bg-court-green'}>
                        {formatPlanName(subscription.plan)}
                      </Badge>
                      <p className="text-sm">{subscription.status === 'active' ? '(Active)' : subscription.status}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Data retention</p>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <p className="text-base">{subscription.data_retention_days} days</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tournament limit</p>
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 mr-2 text-gray-500" />
                      <p className="text-base">{subscription.max_tournaments} tournaments</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Players per tournament</p>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <p className="text-base">{subscription.max_players_per_tournament} players</p>
                    </div>
                  </div>
                  {subscription.plan !== 'free' && subscription.current_period_end && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Renewal date</p>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <p className="text-base">{formatDate(subscription.current_period_end)}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
                {subscription.plan === 'free' && (
                  <CardFooter>
                    <Button className="w-full" disabled>
                      Upgrade Plan
                      <span className="text-xs ml-2">(Coming Soon)</span>
                    </Button>
                  </CardFooter>
                )}
              </Card>
            )}
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Activity</CardTitle>
                <CardDescription>Your tournaments and participation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Your Tournaments</h3>
                    
                    {isLoading ? (
                      <p className="text-gray-500">Loading tournaments...</p>
                    ) : userTournaments.length > 0 ? (
                      <div className="space-y-3">
                        {userTournaments.slice(0, 3).map(tournament => (
                          <div key={tournament.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                            <div>
                              <p className="font-medium">{JSON.parse(tournament.data as any).name || 'Unnamed Tournament'}</p>
                              <p className="text-sm text-gray-500">Created: {formatDate(tournament.created_at)}</p>
                            </div>
                            <Link to={`/tournaments/${tournament.id}`}>
                              <Button variant="outline" size="sm">View</Button>
                            </Link>
                          </div>
                        ))}
                        
                        {userTournaments.length > 3 && (
                          <p className="text-sm text-gray-500 text-center mt-2">
                            + {userTournaments.length - 3} more tournaments
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        You haven't created any tournaments yet.
                      </p>
                    )}
                    
                    <Link to="/tournaments/create">
                      <Button className="mt-4">
                        Create Tournament
                      </Button>
                    </Link>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Administrator</h3>
                    <p className="text-gray-500 italic">
                      You aren't an administrator for any tournaments.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Participant</h3>
                    <p className="text-gray-500 italic">
                      You aren't participating in any tournaments.
                    </p>
                    <Link to="/tournaments">
                      <Button variant="outline" className="mt-4">
                        Browse Tournaments
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
