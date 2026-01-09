
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear any old project storage keys on initialization
    const clearOldProjectData = () => {
      const oldProjectKeys = [
        'sb-legjisflxarazydqnztr-auth-token',
        'supabase.auth.token'
      ];
      
      oldProjectKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log('Cleared old project storage:', key);
        }
      });
    };
    
    clearOldProjectData();

    // CRITICAL: Set up auth state listener FIRST before getting session
    // This ensures OAuth callback tokens in URL hash are processed correctly
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        // For OAuth callbacks (SIGNED_IN with session), ensure we update state
        if (event === 'SIGNED_IN' && session) {
          console.log('OAuth/Login detected, setting session');
          setSession(session);
          setUser(session.user);
          setLoading(false);
          return;
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        if (event === 'TOKEN_REFRESHED' && session) {
          console.log('Token refreshed');
          setSession(session);
          setUser(session.user);
          return;
        }
        
        // For INITIAL_SESSION, let getInitialSession handle it
        if (event === 'INITIAL_SESSION') {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    // Get initial session - but don't set loading to false here
    // Let the auth state listener handle the final state
    const getInitialSession = async () => {
      try {
        // Check if there's a hash fragment (OAuth callback)
        const hasOAuthHash = window.location.hash.includes('access_token') || 
                            window.location.hash.includes('refresh_token');
        
        if (hasOAuthHash) {
          // Let onAuthStateChange handle OAuth callback
          console.log('OAuth hash detected, waiting for auth state change...');
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          setSession(null);
          setUser(null);
          setLoading(false);
        } else if (session) {
          console.log('Initial session found:', session.user.id);
          setSession(session);
          setUser(session.user);
          setLoading(false);
        } else {
          console.log('No initial session');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Clear all auth-related storage
      localStorage.removeItem('sb-ujbcolxawpzfjkjviwqw-auth-token');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
