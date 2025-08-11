
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const NotificationListener = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const { title, body, type } = event.detail;
      
      console.log('🔔 NotificationListener: Received notification:', { title, body, type });
      
      toast({
        title,
        description: body,
        variant: type === 'destructive' ? 'destructive' : 'default',
        duration: type === 'destructive' ? 8000 : 5000,
      });
    };

    console.log('🔔 NotificationListener: Setting up event listener');
    
    // @ts-ignore
    window.addEventListener('sweatsmart-notification', handleNotification);
    
    return () => {
      console.log('🔔 NotificationListener: Cleaning up event listener');
      // @ts-ignore
      window.removeEventListener('sweatsmart-notification', handleNotification);
    };
  }, [toast]);

  return null;
};

export default NotificationListener;
