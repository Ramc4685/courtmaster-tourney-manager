import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trophy, Medal, Star, Calendar, MapPin, Settings, User, Bell, Shield, Link } from 'lucide-react';
import { format } from 'date-fns';

interface ProfileTabProps {
  user: Profile;
  onUpdate: (data: Partial<Profile>) => Promise<void>;
}

const PersonalInfoTab: React.FC<ProfileTabProps> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    display_name: user.display_name || '',
    phone: user.phone || '',
    birthdate: user.player_details.birthdate || '',
    gender: user.player_details.gender || '',
    skill_level: user.player_details.skill_level || 'beginner',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate({
      full_name: formData.full_name,
      display_name: formData.display_name,
      phone: formData.phone,
      player_details: {
        ...user.player_details,
        birthdate: formData.birthdate,
        gender: formData.gender,
        skill_level: formData.skill_level,
      },
    });
    setIsEditing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Personal Information</h3>
        <Button
          type={isEditing ? "submit" : "button"}
          onClick={() => !isEditing && setIsEditing(true)}
          variant={isEditing ? "default" : "outline"}
        >
          {isEditing ? "Save Changes" : "Edit Profile"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            disabled={!isEditing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="display_name">Display Name</Label>
          <Input
            id="display_name"
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            disabled={!isEditing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={!isEditing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthdate">Birthdate</Label>
          <Input
            id="birthdate"
            type="date"
            value={formData.birthdate}
            onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
            disabled={!isEditing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <select
            id="gender"
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={formData.gender || ''}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            disabled={!isEditing}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="skill_level">Skill Level</Label>
          <select
            id="skill_level"
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={formData.skill_level}
            onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
            disabled={!isEditing}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>
      </div>
    </form>
  );
};

const StatsTab: React.FC<ProfileTabProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
              Tournament Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.player_stats.tournaments_won}</div>
            <p className="text-sm text-muted-foreground">
              out of {user.player_stats.tournaments_played} played
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Medal className="h-4 w-4 mr-2 text-blue-500" />
              Match Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.player_stats.matches_won}</div>
            <p className="text-sm text-muted-foreground">
              out of {user.player_stats.matches_played} played
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Star className="h-4 w-4 mr-2 text-purple-500" />
              Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.player_stats.rating}</div>
            <p className="text-sm text-muted-foreground">
              Rank #{user.player_stats.ranking || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Recent Achievements</h3>
        {user.player_details.achievements.length > 0 ? (
          <div className="space-y-2">
            {user.player_details.achievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Medal className="h-4 w-4 text-yellow-500" />
                <span>{achievement}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No achievements yet</p>
        )}
      </div>
    </div>
  );
};

const PreferencesTab: React.FC<ProfileTabProps> = ({ user, onUpdate }) => {
  const handleNotificationChange = async (key: string, value: boolean) => {
    await onUpdate({
      preferences: {
        ...user.preferences,
        notifications: {
          ...user.preferences.notifications,
          [key]: value,
        },
      },
    });
  };

  const handlePrivacyChange = async (key: string, value: boolean) => {
    await onUpdate({
      preferences: {
        ...user.preferences,
        privacy: {
          ...user.preferences.privacy,
          [key]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium flex items-center mb-4">
          <Bell className="h-4 w-4 mr-2" /> Notification Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email_notifications">Email Notifications</Label>
            <Switch
              id="email_notifications"
              checked={user.preferences.notifications.email}
              onCheckedChange={(checked) => handleNotificationChange('email', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="push_notifications">Push Notifications</Label>
            <Switch
              id="push_notifications"
              checked={user.preferences.notifications.push}
              onCheckedChange={(checked) => handleNotificationChange('push', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="tournament_updates">Tournament Updates</Label>
            <Switch
              id="tournament_updates"
              checked={user.preferences.notifications.tournament_updates}
              onCheckedChange={(checked) => handleNotificationChange('tournament_updates', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="match_reminders">Match Reminders</Label>
            <Switch
              id="match_reminders"
              checked={user.preferences.notifications.match_reminders}
              onCheckedChange={(checked) => handleNotificationChange('match_reminders', checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium flex items-center mb-4">
          <Shield className="h-4 w-4 mr-2" /> Privacy Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="show_profile">Show Profile</Label>
            <Switch
              id="show_profile"
              checked={user.preferences.privacy.show_profile}
              onCheckedChange={(checked) => handlePrivacyChange('show_profile', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="show_stats">Show Statistics</Label>
            <Switch
              id="show_stats"
              checked={user.preferences.privacy.show_stats}
              onCheckedChange={(checked) => handlePrivacyChange('show_stats', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="show_history">Show Match History</Label>
            <Switch
              id="show_history"
              checked={user.preferences.privacy.show_history}
              onCheckedChange={(checked) => handlePrivacyChange('show_history', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const SocialTab: React.FC<ProfileTabProps> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user.social_links);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate({ social_links: formData });
    setIsEditing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Social Links</h3>
        <Button
          type={isEditing ? "submit" : "button"}
          onClick={() => !isEditing && setIsEditing(true)}
          variant={isEditing ? "default" : "outline"}
        >
          {isEditing ? "Save Changes" : "Edit Links"}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="facebook">Facebook</Label>
          <div className="flex items-center space-x-2">
            <Link className="h-4 w-4 text-blue-600" />
            <Input
              id="facebook"
              value={formData.facebook || ''}
              onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
              disabled={!isEditing}
              placeholder="Facebook profile URL"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitter">Twitter</Label>
          <div className="flex items-center space-x-2">
            <Link className="h-4 w-4 text-blue-400" />
            <Input
              id="twitter"
              value={formData.twitter || ''}
              onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
              disabled={!isEditing}
              placeholder="Twitter profile URL"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram</Label>
          <div className="flex items-center space-x-2">
            <Link className="h-4 w-4 text-pink-600" />
            <Input
              id="instagram"
              value={formData.instagram || ''}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              disabled={!isEditing}
              placeholder="Instagram profile URL"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Personal Website</Label>
          <div className="flex items-center space-x-2">
            <Link className="h-4 w-4" />
            <Input
              id="website"
              value={formData.website || ''}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              disabled={!isEditing}
              placeholder="Website URL"
            />
          </div>
        </div>
      </div>
    </form>
  );
};

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  if (!user) {
    return null;
  }

  const handleProfileUpdate = async (data: Partial<Profile>) => {
    try {
      await updateProfile(data);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center space-x-4 mb-6">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user.avatar_url || undefined} />
          <AvatarFallback>
            {user.display_name?.charAt(0) || user.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{user.display_name || user.full_name}</h1>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="outline">{user.role}</Badge>
            <Badge variant="outline" className="bg-court-green text-white">
              {user.player_details.skill_level}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal" className="flex items-center">
            <User className="h-4 w-4 mr-2" /> Personal Info
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center">
            <Trophy className="h-4 w-4 mr-2" /> Statistics
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" /> Preferences
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center">
            <Link className="h-4 w-4 mr-2" /> Social
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <PersonalInfoTab user={user} onUpdate={handleProfileUpdate} />
        </TabsContent>

        <TabsContent value="stats">
          <StatsTab user={user} onUpdate={handleProfileUpdate} />
        </TabsContent>

        <TabsContent value="preferences">
          <PreferencesTab user={user} onUpdate={handleProfileUpdate} />
        </TabsContent>

        <TabsContent value="social">
          <SocialTab user={user} onUpdate={handleProfileUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 