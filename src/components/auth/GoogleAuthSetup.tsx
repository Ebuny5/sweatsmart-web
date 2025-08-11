
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
            <strong>Professional Setup Required:</strong> Google Sign-In needs configuration in your Supabase project for production use.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Chrome className="h-4 w-4 mt-0.5 text-blue-600" />
            <div>
              <strong>Step 1:</strong> Create Google Cloud Console project and configure OAuth consent screen with your app details
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Settings className="h-4 w-4 mt-0.5 text-gray-600" />
            <div>
              <strong>Step 2:</strong> Generate OAuth 2.0 Client ID with authorized domains (your production domain)
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 text-green-600" />
            <div>
              <strong>Step 3:</strong> Add Client ID and Secret to your Supabase project's Auth providers
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={openSupabaseDocs} variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Setup Guide
          </Button>
          <Button onClick={openSupabaseProject} variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Auth Settings
          </Button>
        </div>
        
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <strong>Current Status:</strong> Email/password authentication is fully functional. 
            Google Sign-In will be enabled once OAuth is configured in your Supabase project.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default GoogleAuthSetup;
