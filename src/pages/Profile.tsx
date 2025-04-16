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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    try {
      await updateUserProfile({ name });
      toast.success('Profile updated successfully!');
      setIsEditMode(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile.');
    }
  };

  if (!user) {
    return <div>Loading...</div>;
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
                <AvatarImage src={user?.avatar_url || ''} alt={user?.name || 'Avatar'} />
                <AvatarFallback>{user?.name?.charAt(0) || '?'}</AvatarFallback>
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
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isEditMode}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={email} disabled />
                  </div>
                </div>
                <div className="flex justify-end">
                  {isEditMode ? (
                    <div className="space-x-2">
                      <Button variant="ghost" onClick={() => setIsEditMode(false)}>
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
