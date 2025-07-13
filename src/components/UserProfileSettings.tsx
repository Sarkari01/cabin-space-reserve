import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Camera, Save, User, Phone, Mail, MapPin, Bell, Moon, Sun, Monitor } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/hooks/useUserSettings";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const UserProfileSettings = () => {
  const { user, userProfile, userRole } = useAuth();
  const { settings, loading, updateSettings, updateAvatar, updateNotificationPreferences, updateTheme } = useUserSettings();
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: userProfile?.full_name || '',
    phone: userProfile?.phone || '',
    bio: settings?.bio || '',
    location: settings?.location || '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file || !user) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-avatars')
        .getPublicUrl(filePath);

      await updateAvatar(data.publicUrl);
      
      toast({
        title: "Success",
        description: "Profile picture updated successfully"
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Update profile in auth profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Update settings
      await updateSettings({
        bio: formData.bio,
        location: formData.location
      });

      setEditMode(false);
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Manage your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={settings?.avatar_url} />
                <AvatarFallback className="text-lg">
                  {userProfile?.full_name ? getInitials(userProfile.full_name) : <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                <Camera className="h-4 w-4 text-primary-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{userProfile?.full_name || 'User'}</h3>
              <Badge variant="outline" className="capitalize">
                {userRole}
              </Badge>
              <p className="text-sm text-muted-foreground flex items-center">
                <Mail className="h-3 w-3 mr-1" />
                {user?.email}
              </p>
            </div>
          </div>

          <Separator />

          {/* Profile Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                disabled={!editMode}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!editMode}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                disabled={!editMode}
                placeholder="Enter your location"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed here
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              disabled={!editMode}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3">
            {editMode ? (
              <>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditMode(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Email Notifications</div>
              <div className="text-xs text-muted-foreground">
                Receive notifications via email
              </div>
            </div>
            <Switch
              checked={settings?.email_notifications}
              onCheckedChange={(checked) => updateNotificationPreferences(checked, settings?.push_notifications || false)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Push Notifications</div>
              <div className="text-xs text-muted-foreground">
                Receive push notifications in your browser
              </div>
            </div>
            <Switch
              checked={settings?.push_notifications}
              onCheckedChange={(checked) => updateNotificationPreferences(settings?.email_notifications || false, checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Theme Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>Theme</Label>
            <div className="flex space-x-3">
              <Button
                variant={settings?.theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateTheme('light')}
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={settings?.theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateTheme('dark')}
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
              <Button
                variant={settings?.theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateTheme('system')}
              >
                <Monitor className="h-4 w-4 mr-2" />
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            View your account details and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Account Created:</span>
              <div className="font-medium">
                {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Last Updated:</span>
              <div className="font-medium">
                {userProfile?.updated_at ? new Date(userProfile.updated_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Phone Verified:</span>
              <div className="font-medium">
                <Badge variant={settings?.phone_verified ? 'default' : 'secondary'}>
                  {settings?.phone_verified ? 'Verified' : 'Not Verified'}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Account Status:</span>
              <div className="font-medium">
                <Badge variant="default">Active</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfileSettings;