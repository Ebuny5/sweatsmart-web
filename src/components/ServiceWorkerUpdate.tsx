import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const ServiceWorkerUpdate = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Check for service worker updates
      const checkForUpdates = async () => {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            setRegistration(reg);
            
            // Check for waiting service worker (new version available)
            if (reg.waiting) {
              setShowUpdatePrompt(true);
            }

            // Listen for new service worker installing
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New version available
                    setShowUpdatePrompt(true);
                  }
                });
              }
            });
          }

          // Listen for controller change (new SW activated)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('New service worker activated, reloading...');
            window.location.reload();
          });
        } catch (error) {
          console.error('Error checking for SW updates:', error);
        }
      };

      checkForUpdates();

      // Check for updates periodically (every 5 minutes)
      const interval = setInterval(() => {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg) {
            reg.update();
          }
        });
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-primary text-primary-foreground p-4 rounded-lg shadow-lg">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin-slow" />
          <div className="flex-1">
            <p className="font-medium">Update Available</p>
            <p className="text-sm opacity-90">A new version of SweatSmart is ready.</p>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={handleUpdate}
          >
            Update Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceWorkerUpdate;
