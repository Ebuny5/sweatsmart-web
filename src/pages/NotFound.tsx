import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // TEMP: log 404s but do not auto-redirect while we add /climate route
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  const handleGoHome = () => {
    if (user) navigate('/dashboard'); else navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md mx-auto p-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        </div>
        <div className="space-y-3">
          <Button onClick={handleGoHome} className="w-full">{user ? "Go to Dashboard" : "Return to Home"}</Button>
          {user && <Button variant="outline" onClick={() => navigate("/log-episode")} className="w-full">Log New Episode</Button>}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
