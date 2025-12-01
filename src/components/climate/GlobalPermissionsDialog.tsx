import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Bell, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

type PermissionStatus = 'prompt' | 'granted' | 'denied';

export const GlobalPermissionsDialog = () => {
  const [open, setOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState<PermissionStatus>('prompt');
  const [notificationStatus, setNotificationStatus] = useState<PermissionStatus>('prompt');
  const [hasChecked, setHasChecked] = useState(false);

  const checkPermissions = async () => {
    // Check notification permission
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission as PermissionStatus);
    }

    // Check location permission
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setLocationStatus(result.state as PermissionStatus);
      } catch {
        setLocationStatus('prompt');
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      await checkPermissions();
      setHasChecked(true);
      
      // Show dialog if permissions not granted and user hasn't dismissed it today
      const dismissedToday = localStorage.getItem('permissions-dismissed-date');
      const today = new Date().toDateString();
      
      if (dismissedToday !== today && (locationStatus !== 'granted' || notificationStatus !== 'granted')) {
        setOpen(true);
      }
    }, 2000); // Show 2 seconds after login

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hasChecked && (locationStatus !== 'granted' || notificationStatus !== 'granted')) {
      setOpen(true);
    }
  }, [locationStatus, notificationStatus, hasChecked]);

  const handleRequestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationStatus('granted');
        // After location granted, prompt for notifications
        if (notificationStatus === 'prompt') {
          setTimeout(() => handleRequestNotification(), 500);
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('denied');
        }
      }
    );
  };

  const handleRequestNotification = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission as PermissionStatus);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('permissions-dismissed-date', new Date().toDateString());
    setOpen(false);
  };

  const allGranted = locationStatus === 'granted' && notificationStatus === 'granted';
  const anyBlocked = locationStatus === 'denied' || notificationStatus === 'denied';

  if (allGranted) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md bg-gray-900 text-white border-cyan-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-400">
            🌡️ Enable Climate Alerts
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-base">
            Get real-time alerts when weather conditions trigger your hyperhidrosis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Location Permission */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <MapPin className={`w-6 h-6 ${locationStatus === 'granted' ? 'text-green-400' : 'text-blue-400'}`} />
                <div>
                  <h3 className="font-semibold">Location Access</h3>
                  <p className="text-xs text-gray-400">Get weather for your area</p>
                </div>
              </div>
              {locationStatus === 'granted' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
              {locationStatus === 'denied' && <XCircle className="w-5 h-5 text-red-400" />}
            </div>
            {locationStatus === 'prompt' && (
              <Button 
                onClick={handleRequestLocation}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Enable Location
              </Button>
            )}
            {locationStatus === 'denied' && (
              <p className="text-xs text-red-300">Blocked - Click 🔒 in address bar to allow</p>
            )}
          </div>

          {/* Notification Permission */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Bell className={`w-6 h-6 ${notificationStatus === 'granted' ? 'text-green-400' : 'text-yellow-400'}`} />
                <div>
                  <h3 className="font-semibold">Push Notifications</h3>
                  <p className="text-xs text-gray-400">Receive climate alerts</p>
                </div>
              </div>
              {notificationStatus === 'granted' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
              {notificationStatus === 'denied' && <XCircle className="w-5 h-5 text-red-400" />}
            </div>
            {notificationStatus === 'prompt' && (
              <Button 
                onClick={handleRequestNotification}
                disabled={locationStatus !== 'granted'}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white disabled:bg-gray-600"
              >
                Enable Notifications
              </Button>
            )}
            {notificationStatus === 'denied' && (
              <p className="text-xs text-red-300">Blocked - Click 🔒 in address bar to allow</p>
            )}
          </div>

          {/* Help section for blocked permissions */}
          {anyBlocked && (
            <div className="bg-red-900/30 border border-red-700/50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-300 mb-2 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Permissions Blocked?
              </h4>
              <ol className="text-xs text-red-200 space-y-1 mb-3">
                <li>1. Click the 🔒 lock icon in your address bar</li>
                <li>2. Find "Location" and "Notifications"</li>
                <li>3. Change both to "Allow"</li>
                <li>4. Refresh this page</li>
              </ol>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                className="w-full border-red-500 text-red-300 hover:bg-red-950"
              >
                Refresh Page
              </Button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-6">
            <Button 
              onClick={handleDismiss}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Maybe Later
            </Button>
            {allGranted && (
              <Button 
                onClick={() => setOpen(false)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Done ✓
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
