
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Settings = () => {
  const { toast } = useToast();
  
  // Profile settings
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Notification settings
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [weeklyReportEnabled, setWeeklyReportEnabled] = useState(true);
  const [triggerAlertsEnabled, setTriggerAlertsEnabled] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  
  // Privacy settings
  const [dataSharing, setDataSharing] = useState(false);
  const [anonymousSharing, setAnonymousSharing] = useState(true);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  
  // Password settings
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated successfully.",
    });
    
    setIsSavingProfile(false);
  };
  
  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingNotifications(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Notification preferences saved",
      description: "Your notification settings have been updated.",
    });
    
    setIsSavingNotifications(false);
  };
  
  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrivacy(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Privacy settings updated",
      description: "Your privacy preferences have been saved.",
    });
    
    setIsSavingPrivacy(false);
  };
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Your new password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSavingPassword(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully.",
    });
    
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsSavingPassword(false);
  };
  
  const handleExportData = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Data export initiated",
      description: "Your data export is being prepared and will be emailed to you.",
    });
  };
  
  return (
    <AppLayout isAuthenticated={true} userName="John Doe">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account preferences and settings
          </p>
        </div>
        
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <form onSubmit={handleSaveProfile}>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSavingProfile}>
                    {isSavingProfile ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <form onSubmit={handleSaveNotifications}>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Configure how and when you want to be notified
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Daily Logging Reminder</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive a daily reminder to log your symptoms
                      </p>
                    </div>
                    <Switch
                      checked={reminderEnabled}
                      onCheckedChange={setReminderEnabled}
                    />
                  </div>
                  
                  {reminderEnabled && (
                    <div className="space-y-2 ml-6">
                      <Label htmlFor="reminderTime">Reminder Time</Label>
                      <Input
                        id="reminderTime"
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="w-[150px]"
                      />
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Weekly Summary Report</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive a weekly email with insights and statistics
                      </p>
                    </div>
                    <Switch
                      checked={weeklyReportEnabled}
                      onCheckedChange={setWeeklyReportEnabled}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Trigger Alert Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get alerts when known triggers are detected (e.g., weather changes)
                      </p>
                    </div>
                    <Switch
                      checked={triggerAlertsEnabled}
                      onCheckedChange={setTriggerAlertsEnabled}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSavingNotifications}>
                    {isSavingNotifications ? "Saving..." : "Save Preferences"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="privacy">
            <Card>
              <form onSubmit={handleSavePrivacy}>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>
                    Control how your data is used and shared
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Share Data for Research</Label>
                      <p className="text-sm text-muted-foreground">
                        Contribute your anonymized data to help improve hyperhidrosis research
                      </p>
                    </div>
                    <Switch
                      checked={dataSharing}
                      onCheckedChange={setDataSharing}
                    />
                  </div>
                  
                  {dataSharing && (
                    <div className="flex items-center justify-between ml-6">
                      <div className="space-y-1">
                        <Label>Anonymous Sharing Only</Label>
                        <p className="text-sm text-muted-foreground">
                          Your personal information will never be shared
                        </p>
                      </div>
                      <Switch
                        checked={anonymousSharing}
                        onCheckedChange={setAnonymousSharing}
                      />
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleExportData}
                    >
                      Export My Data
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      Request a copy of all your data in a downloadable format
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSavingPrivacy}>
                    {isSavingPrivacy ? "Saving..." : "Save Privacy Settings"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <form onSubmit={handleChangePassword}>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your password and account security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col items-start space-y-4">
                  <Button type="submit" disabled={isSavingPassword}>
                    {isSavingPassword ? "Updating..." : "Change Password"}
                  </Button>
                  
                  <Separator className="my-4 w-full" />
                  
                  <div>
                    <Button variant="destructive" type="button">
                      Delete Account
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      Permanently delete your account and all your data
                    </p>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
