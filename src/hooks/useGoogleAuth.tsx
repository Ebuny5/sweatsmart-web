
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://www.sweatsmart.guru/auth/callback',
        },
      });

      if (error) {
        // Show helpful error message about Google OAuth setup
        toast({
          title: "Google Sign-In Setup Required",
          description: "Google OAuth needs to be configured in your Supabase project. Please contact support or use email/password login.",
          variant: "destructive",
        });
        console.error('Google OAuth error:', error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in with Google. Please try again or use email/password.",
        variant: "destructive",
      });
      console.error('Google OAuth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signInWithGoogle,
    isLoading,
  };
};
