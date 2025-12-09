
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedAvatar, EnhancedAvatarImage, EnhancedAvatarFallback } from "@/components/ui/enhanced-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Camera, Calendar, Mail, User, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useEpisodes } from "@/hooks/useEpisodes";

const Profile = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { episodes } = useEpisodes();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profileData, setProfileData] = useState({
    display_name: profile?.display_name || "",
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        display_name: profile.display_name || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      console.log('Saving profile data:', profileData);
      
      const success = await updateProfile({
        display_name: profileData.display_name,
      });

      if (success) {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
        setIsEditing(false);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to profile data
    setProfileData({
      display_name: profile?.display_name || "",
    });
  };

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const displayName = profileData.display_name || user.email || 'User';
  const userInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  });

  // Calculate streak (consecutive days with episodes)
  const calculateStreak = () => {
    if (episodes.length === 0) return 0;
    
    const today = new Date();
    const sortedEpisodes = [...episodes].sort((a, b) => b.datetime.getTime() - a.datetime.getTime());
    
    let streak = 0;
    let currentDate = new Date(today);
    
    for (const episode of sortedEpisodes) {
      const episodeDate = new Date(episode.datetime);
      const daysDiff = Math.floor((currentDate.getTime() - episodeDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= streak + 1) {
        streak = daysDiff + 1;
        currentDate = episodeDate;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const currentStreak = calculateStreak();

  return (
    <AppLayout>
      <div className="space-y-4 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Profile</h1>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2 w-full sm:w-auto">
              <User className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                     <EnhancedAvatar size="xl" className="mx-auto">
                       <EnhancedAvatarImage src="" alt={displayName} />
                       <EnhancedAvatarFallback 
                         initials={userInitials}
                         size="xl"
                       />
                     </EnhancedAvatar>
                    {isEditing && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full p-0"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg sm:text-xl">{displayName}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-1 text-sm">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{user.email}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span>Joined {joinDate}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Episodes Logged</span>
                  <Badge variant="secondary" className="font-medium">{episodes.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Streak</span>
                  <Badge variant="outline" className="font-medium">{currentStreak} days</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Personal Information</CardTitle>
                <CardDescription className="text-sm">
                  {isEditing ? "Update your personal details" : "Your personal information"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Display Name</Label>
                      <Input
                        id="name"
                        value={profileData.display_name}
                        onChange={(e) => setProfileData({...profileData, display_name: e.target.value})}
                        placeholder="Enter your display name"
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user.email || ''}
                        disabled
                        className="bg-muted w-full"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-4">
                      <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button variant="outline" onClick={handleCancel} disabled={isSaving} className="w-full sm:w-auto">
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Display Name</Label>
                        <p className="mt-1 text-sm sm:text-base">{profileData.display_name || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p className="mt-1 text-sm sm:text-base truncate">{user.email}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Account Settings</CardTitle>
                <CardDescription className="text-sm">
                  Manage your account preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Go to Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
