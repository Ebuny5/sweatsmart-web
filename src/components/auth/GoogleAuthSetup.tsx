
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Settings, Chrome, AlertTriangle, CheckCircle } from "lucide-react";

const GoogleAuthSetup = () => {
  const openSupabaseDocs = () => {
    window.open('https://supabase.com/docs/guides/auth/social-login/auth-google', '_blank');
  };

  const openSupabaseProject = () => {
    window.open('https://supabase.com/dashboard/project/ujbcolxawpzfjkjviwqw/auth/providers', '_blank');
  };

  const openGoogleCloudConsole = () => {
    window.open('https://console.cloud.google.com/apis/credentials', '_blank');
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-900">
          <Settings className="h-5 w-5" />
          Google OAuth Setup Required
          <Badge variant="outline" className="border-yellow-600 text-yellow-800">
            Admin Setup Needed
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Google Sign-In Error:</strong> The provider is not enabled in your Supabase project. Follow the steps below to fix this.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Chrome className="h-4 w-4 mt-0.5 text-blue-600" />
            <div>
              <strong>Step 1:</strong> Go to Google Cloud Console and create OAuth 2.0 credentials for your app
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Settings className="h-4 w-4 mt-0.5 text-gray-600" />
            <div>
              <strong>Step 2:</strong> Add your domain and Supabase callback URL to authorized domains/origins
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 text-green-600" />
            <div>
              <strong>Step 3:</strong> Enable Google provider in Supabase Auth settings and add your Client ID and Secret
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600" />
            <div>
              <strong>Step 4:</strong> Configure site URL and redirect URLs in Supabase Authentication settings
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={openGoogleCloudConsole} variant="outline" size="sm">
            <Chrome className="h-4 w-4 mr-2" />
            Google Cloud Console
          </Button>
          <Button onClick={openSupabaseProject} variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Supabase Auth Settings
          </Button>
          <Button onClick={openSupabaseDocs} variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Setup Guide
          </Button>
        </div>
        
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <strong>Current Status:</strong> Email/password authentication is fully functional. 
            Google Sign-In will work once OAuth is properly configured in both Google Cloud Console and Supabase.
          </AlertDescription>
        </Alert>

        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Important:</strong> Make sure to also configure the Site URL and Redirect URLs in Supabase 
            Authentication → URL Configuration to prevent authentication errors.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default GoogleAuthSetup;
