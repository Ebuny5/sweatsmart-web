
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Globe, Code, Bug } from "lucide-react";

const MobileDebugInfo = () => {
  const isMobileApp = window.location.href.includes('lovableproject.com') ||
                      window.location.href.includes('median.co') ||
                      navigator.userAgent.includes('wv') ||
                      navigator.userAgent.includes('median') ||
                      window.matchMedia('(display-mode: standalone)').matches ||
                      // @ts-ignore
                      window.median !== undefined ||
                      // @ts-ignore
                      window.Capacitor !== undefined;

  const debugInfo = {
    userAgent: navigator.userAgent,
    url: window.location.href,
    displayMode: window.matchMedia('(display-mode: standalone)').matches,
    // @ts-ignore
    hasMedian: window.median !== undefined,
    // @ts-ignore
    hasCapacitor: window.Capacitor !== undefined,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    isMobileApp
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Bug className="h-5 w-5" />
          Debug Information
          {isMobileApp ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Smartphone className="h-3 w-3 mr-1" />
              Mobile App
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Globe className="h-3 w-3 mr-1" />
              Web App
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <strong>Environment:</strong>
            <br />
            <code className="text-xs bg-white p-1 rounded">
              {isMobileApp ? 'Mobile APK' : 'Web Browser'}
            </code>
          </div>
          <div>
            <strong>Viewport:</strong>
            <br />
            <code className="text-xs bg-white p-1 rounded">
              {debugInfo.viewport.width} × {debugInfo.viewport.height}
            </code>
          </div>
          <div>
            <strong>Display Mode:</strong>
            <br />
            <code className="text-xs bg-white p-1 rounded">
              {debugInfo.displayMode ? 'Standalone' : 'Browser'}
            </code>
          </div>
          <div>
            <strong>URL Contains:</strong>
            <br />
            <code className="text-xs bg-white p-1 rounded">
              {debugInfo.url.includes('median.co') ? 'median.co' : 
               debugInfo.url.includes('lovableproject.com') ? 'lovableproject.com' : 
               'other'}
            </code>
          </div>
        </div>
        <div>
          <strong>User Agent:</strong>
          <br />
          <code className="text-xs bg-white p-1 rounded block break-all">
            {debugInfo.userAgent}
          </code>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileDebugInfo;
