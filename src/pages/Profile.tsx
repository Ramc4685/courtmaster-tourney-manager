
import React from 'react';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth/AuthContext';
import PageHeader from '@/components/shared/PageHeader';
import { Edit, User } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  
  // Redirect to home if not logged in
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <PageHeader 
          title="User Profile" 
          description="Manage your profile information" 
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
                  <p className="text-base">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
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
                    <p className="text-gray-500 italic">
                      You haven't created any tournaments yet.
                    </p>
                    <Button className="mt-4">
                      Create Tournament
                    </Button>
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
                    <Button variant="outline" className="mt-4">
                      Browse Tournaments
                    </Button>
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
