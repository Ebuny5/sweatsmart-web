
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Camera, Calendar, Mail, User, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, withRetry } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [profileData, setProfileData] = useState({
    display_name: "",
  });

  // Fetch profile data on load
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching profile for user:', user.id);
        
        const { data, error } = await withRetry(async () => {
          return await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
        });

        if (error) {
          console.error('Error fetching profile:', error);
          // Create profile if it doesn't exist
          if (error.code === 'PGRST116') {
            console.log('Profile not found, creating one...');
            const { data: newProfile, error: createError } = await withRetry(async () => {
              return await supabase
                .from('profiles')
                .insert({
                  user_id: user.id,
                  display_name: user.email?.split('@')[0] || ''
                })
                .select()
                .single();
            });

            if (createError) {
              console.error('Error creating profile:', createError);
              toast({
                title: "Error",
                description: "Failed to create profile. Please refresh the page.",
                variant: "destructive",
              });
            } else {
              setProfileData({
                display_name: newProfile.display_name || "",
              });
            }
          }
        } else if (data) {
          console.log('Profile loaded:', data);
          setProfileData({
            display_name: data.display_name || "",
          });
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        toast({
          title: "Error",
          description: "Failed to load profile. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      console.log('Saving profile data:', profileData);
      
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            display_name: profileData.display_name,
          })
          .select()
          .single();
      });

      if (error) {
        console.error('Error saving profile:', error);
        throw error;
      }

      console.log('Profile saved successfully:', data);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
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
    // Reset to original data - we'll fetch fresh data
    if (user) {
      fetchProfile();
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
      });

      if (!error && data) {
        setProfileData({
          display_name: data.display_name || "",
        });
      }
    } catch (error) {
      console.error('Error refetching profile:', error);
    }
  };

  if (loading) {
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile</h1>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                     <Avatar className="h-24 w-24">
                       <AvatarImage src="" alt={displayName} />
                       <AvatarFallback className="text-lg">
                         {userInitials}
                       </AvatarFallback>
                     </Avatar>
                    {isEditing && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <CardTitle>{displayName}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  Joined {joinDate}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Episodes Logged</span>
                  <Badge variant="secondary">0</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Streak</span>
                  <Badge variant="outline">0 days</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  {isEditing ? "Update your personal details" : "Your personal information"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
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
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Display Name</Label>
                        <p className="mt-1">{profileData.display_name || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p className="mt-1">{user.email}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
