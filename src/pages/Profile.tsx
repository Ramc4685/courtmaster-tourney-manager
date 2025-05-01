import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';

const ProfilePage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  // State now uses fullName to match the database schema
  const [fullName, setFullName] = useState(''); 
  const [email, setEmail] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (user) {
      // Use full_name from the user profile object
      setFullName(user.full_name || ''); 
      // Email is not directly in the profiles table, get it from the auth user if available (might need adjustment in AuthContext if not passed)
      // For now, assuming AuthContext provides it somehow or it's read-only from initial auth
      // Let's try getting it from user.email if AuthContext adds it, otherwise keep it potentially blank/read-only
      setEmail(user.email || ''); // Assuming user object might have email from auth.users
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) {
      toast.error('You must be logged in to update your profile.');
      return;
    }
    try {
      // Send full_name matching the database column
      await updateUserProfile({ full_name: fullName }); 
      toast.success('Profile updated successfully!');
      setIsEditMode(false);
    } catch (error: any) {
      console.error('[ProfilePage] Update error:', error); // Add console log
      toast.error(error.message || 'Failed to update profile.');
    }
  };

  if (!user) {
    // Display a more informative loading state or redirect
    return (
      <Layout>
        <div className="container mx-auto py-8 text-center">Loading profile...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatar_url || ''} alt={user?.full_name || 'Avatar'} />
                {/* Use first letter of full_name for fallback */}
                <AvatarFallback>{user?.full_name?.charAt(0).toUpperCase() || '?'}</AvatarFallback> 
              </Avatar>
            </div>
            <Tabs defaultValue="account" className="space-y-4">
              <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                {/* <TabsTrigger value="security">Security</TabsTrigger> */}
              </TabsList>
              <TabsContent value="account" className="space-y-4">
                <div className="space-y-2">
                  <div className="space-y-1">
                    {/* Label updated to Full Name */}
                    <Label htmlFor="fullName">Full Name</Label> 
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={!isEditMode}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    {/* Email is generally not updatable via profile, disable it */}
                    <Input id="email" value={email} disabled /> 
                  </div>
                </div>
                <div className="flex justify-end">
                  {isEditMode ? (
                    <div className="space-x-2">
                      <Button variant="ghost" onClick={() => {
                        // Reset fields to original values on cancel
                        setFullName(user.full_name || '');
                        setIsEditMode(false);
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateProfile}>Save</Button>
                    </div>
                  ) : (
                    <Button onClick={() => setIsEditMode(true)}>Edit Profile</Button>
                  )}
                </div>
              </TabsContent>
              {/* <TabsContent value="security">
                <div className="space-y-2">
                  <p>Security settings content</p>
                </div>
              </TabsContent> */}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProfilePage;

