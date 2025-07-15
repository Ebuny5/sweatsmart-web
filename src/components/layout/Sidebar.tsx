
import { cn } from "@/lib/utils";
import { 
  Sidebar as SidebarComponent,
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { 
  Calendar, 
  BarChart2, 
  Plus, 
  Settings, 
  MessageSquare, 
  Thermometer
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: BarChart2,
    },
    {
      title: "Log Episode",
      url: "/log-episode",
      icon: Plus,
    },
    {
      title: "History",
      url: "/history",
      icon: Calendar,
    },
    {
      title: "Insights",
      url: "/insights",
      icon: Thermometer,
    },
    {
      title: "Community",
      url: "/community",
      icon: MessageSquare,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ];
  
  const handleNavigation = (url: string) => {
    try {
      navigate(url);
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = url;
    }
  };
  
  return (
    <>
      <SidebarTrigger className="fixed left-4 top-4 z-50 lg:hidden" />
      <SidebarComponent className="border-r bg-background">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary font-bold px-2 mb-4 text-lg">
              SweatSmart
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className={cn(
                        "w-full justify-start transition-colors duration-200",
                        location.pathname === item.url 
                          ? "bg-primary text-primary-foreground font-medium" 
                          : "hover:bg-muted hover:text-foreground"
                      )}
                      onClick={() => handleNavigation(item.url)}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </SidebarComponent>
    </>
  );
};

export default Sidebar;
