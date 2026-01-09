import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [processingOAuth, setProcessingOAuth] = useState(true);

  // Parse hash params coming back from Supabase (OAuth/email confirmation flows)
  const { type, error, error_description } = useMemo(() => {
    const hash = window.location.hash?.replace(/^#/, "") ?? "";
    const params = new URLSearchParams(hash);
    return {
      type: params.get("type") || "",
      error: params.get("error") || "",
      error_description: params.get("error_description") || "",
    };
  }, []);

  // Process OAuth tokens from URL hash
  useEffect(() => {
    const processOAuthCallback = async () => {
      const hash = window.location.hash;
      
      // If there's an access_token in the hash, Supabase needs to process it
      if (hash && (hash.includes('access_token') || hash.includes('refresh_token'))) {
        console.log('Processing OAuth callback...');
        try {
          // Give Supabase time to process the hash and set up the session
          // The onAuthStateChange listener in AuthContext will pick this up
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verify session was established
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('OAuth session established:', session.user.id);
          } else {
            console.log('No session after OAuth callback');
          }
        } catch (err) {
          console.error('Error processing OAuth callback:', err);
        }
      }
      setProcessingOAuth(false);
    };

    processOAuthCallback();
  }, []);

  useEffect(() => {
    // Wait for OAuth processing to complete
    if (processingOAuth) return;

    // If there's an explicit error coming from the provider/email link, go to login
    if (error || error_description) {
      const t = setTimeout(() => {
        navigate("/login", { replace: true });
      }, 800);
      return () => clearTimeout(t);
    }

    // Once auth context finishes loading, decide where to go
    if (!loading) {
      // For recoveries, we should send users to the reset password page
      if (type === "recovery") {
        navigate("/reset-password", { replace: true });
        return;
      }

      // Default: if we have a user, go to dashboard. If not, back to login.
      const t = setTimeout(() => {
        if (user) {
          console.log('Redirecting to dashboard, user:', user.id);
          navigate("/dashboard", { replace: true });
        } else {
          console.log('No user found, redirecting to login');
          navigate("/login", { replace: true });
        }
      }, 300);
      return () => clearTimeout(t);
    }
  }, [loading, user, type, error, error_description, navigate, processingOAuth]);

  return (
    <AppLayout isAuthenticated={false}>
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">
            {processingOAuth ? "Processing sign-in…" : "Finalizing sign-in… Please wait."}
          </p>
          {error_description ? (
            <p className="text-xs text-destructive max-w-sm">
              {error_description}
            </p>
          ) : null}
        </div>
      </div>
    </AppLayout>
  );
};

export default AuthCallback;
