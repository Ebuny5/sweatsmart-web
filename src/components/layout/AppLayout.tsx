
import { SidebarProvider } from "@/components/ui/sidebar";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";

interface AppLayoutProps {
  children: React.ReactNode;
  isAuthenticated?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  isAuthenticated,
}) => {
  const { user, loading } = useAuth();
  
  // Use auth context if isAuthenticated is not explicitly provided
  const authenticated = isAuthenticated ?? !!user;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full flex-col">
        <Header isAuthenticated={authenticated} />
        <div className="flex flex-1">
          {authenticated && <Sidebar />}
          <main className="flex-1 container py-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
