import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

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

  useEffect(() => {
    // If there's an explicit error coming from the provider/email link, go to login
    if (error || error_description) {
      // Keep a small delay so Supabase can finish any pending URL parsing
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
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      }, 300);
      return () => clearTimeout(t);
    }
  }, [loading, user, type, error, error_description, navigate]);

  return (
    <AppLayout isAuthenticated={false}>
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">
            Finalizing sign-in… Please wait.
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
