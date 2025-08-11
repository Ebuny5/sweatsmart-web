
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const NotificationListener = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const { title, body, type } = event.detail;
      
      toast({
        title,
        description: body,
        variant: type === 'destructive' ? 'destructive' : 'default',
        duration: type === 'destructive' ? 8000 : 5000,
      });
    };

    // @ts-ignore
    window.addEventListener('sweatsmart-notification', handleNotification);
    
    return () => {
      // @ts-ignore
      window.removeEventListener('sweatsmart-notification', handleNotification);
    };
  }, [toast]);

  return null;
};

export default NotificationListener;
