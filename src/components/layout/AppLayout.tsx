
import { SidebarProvider } from "@/components/ui/sidebar";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  isAuthenticated?: boolean;
  userName?: string;
  userAvatar?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  isAuthenticated = false,
  userName = "",
  userAvatar = "",
}) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full flex-col">
        <Header 
          isAuthenticated={isAuthenticated} 
          userName={userName} 
          userAvatar={userAvatar} 
        />
        <div className="flex flex-1">
          {isAuthenticated && <Sidebar />}
          <main className="flex-1 container py-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
