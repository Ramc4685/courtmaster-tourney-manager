
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/auth/AuthContext';
import { Profile } from '@/types/entities';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ProfilePage = () => {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Profile>>({
    full_name: user?.full_name || '',
    display_name: user?.display_name || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserProfile(formData);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Update failed",
        description: "There was an error updating your profile.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.avatar_url || ''} />
              <AvatarFallback>{getInitials(user?.display_name || user?.full_name || 'User')}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{isEditing ? 'Edit Profile' : 'Profile'}</CardTitle>
              <CardDescription>
                {isEditing ? 'Update your profile information' : 'Your personal information'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-muted/50">{user?.full_name}</div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="display_name">Display Name</Label>
                {isEditing ? (
                  <Input
                    id="display_name"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-muted/50">{user?.display_name}</div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="p-2 border rounded-md bg-muted/50">{user?.email}</div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-muted/50">{user?.phone || 'Not provided'}</div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <div className="p-2 border rounded-md bg-muted/50">{user?.role}</div>
              </div>
              {isEditing && (
                <div className="grid gap-2">
                  <Label htmlFor="avatar_url">Avatar URL</Label>
                  <Input
                    id="avatar_url"
                    name="avatar_url"
                    value={formData.avatar_url}
                    onChange={handleChange}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              )}
            </div>
            {isEditing && (
              <div className="flex justify-end mt-4 space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            )}
          </form>
        </CardContent>
        {!isEditing && (
          <CardFooter className="flex justify-end">
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ProfilePage;
