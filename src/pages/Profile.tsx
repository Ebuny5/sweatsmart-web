import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Edit, Calendar, ArrowRight } from "lucide-react";
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
      <div className="space-y-6 px-4 sm:px-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile</h1>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="secondary">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Profile Header Card */}
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary mx-auto mb-4">
              {userInitials}
            </div>
            <h2 className="text-2xl font-bold mb-1">{displayName}</h2>
            <p className="text-muted-foreground mb-4">{user.email}</p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Joined {joinDate}</span>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-1">{episodes.length}</div>
                <div className="text-sm text-muted-foreground">Episodes Logged</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-1">{currentStreak}</div>
                <div className="text-sm text-muted-foreground">Current Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={profileData.display_name}
                    onChange={(e) => setProfileData({...profileData, display_name: e.target.value})}
                    placeholder="Enter your display name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Display Name</div>
                    <div className="font-medium">{profileData.display_name || 'Not set'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Email</div>
                    <div className="font-medium truncate">{user.email}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <button 
              onClick={() => navigate('/settings')}
              className="w-full flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <span>Manage your account preferences</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Profile;
