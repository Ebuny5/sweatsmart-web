
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Settings, Chrome, AlertTriangle } from "lucide-react";

const GoogleAuthSetup = () => {
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-900">
          <Settings className="h-5 w-5" />
          Google OAuth Setup Required
          <Badge variant="outline" className="border-yellow-600 text-yellow-800">
            Admin Action Needed
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Important:</strong> Google Sign-In requires additional configuration in your Supabase project.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Chrome className="h-4 w-4 mt-0.5 text-blue-600" />
            <div>
              <strong>Step 1:</strong> Create Google Cloud Console project and configure OAuth consent screen
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Settings className="h-4 w-4 mt-0.5 text-gray-600" />
            <div>
              <strong>Step 2:</strong> Create OAuth 2.0 Client ID with your domain settings
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 text-green-600" />
            <div>
              <strong>Step 3:</strong> Add Client ID and Secret to Supabase Auth providers
            </div>
          </div>
        </div>
        
        <Alert>
          <AlertDescription>
            Until Google OAuth is configured, users can still register and login with email/password.
            The Google Sign-In button will show an error message when clicked.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default GoogleAuthSetup;
