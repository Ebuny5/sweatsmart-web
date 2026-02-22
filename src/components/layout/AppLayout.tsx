import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import Header from "./Header";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationPermissionModal } from "@/components/NotificationPermissionModal";

interface AppLayoutProps {
  children: React.ReactNode;
  isAuthenticated?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  isAuthenticated,
}) => {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  
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
          {authenticated && !isMobile && <Sidebar />}
          <main className={`flex-1 ${isMobile ? 'px-4 py-4 pb-20' : 'container py-6'}`}>
            {children}
          </main>
        </div>
        {authenticated && isMobile && <MobileBottomNav />}
        {/* Show notification permission popup after login */}
        {authenticated && <NotificationPermissionModal />}
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
