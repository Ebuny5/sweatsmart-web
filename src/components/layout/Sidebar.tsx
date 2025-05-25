
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  
  return (
    <>
      <SidebarTrigger className="fixed left-4 top-4 z-40 lg:hidden" />
      <SidebarComponent>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary font-semibold px-2">
              SweatSense
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className={cn(
                        location.pathname === item.url ? "bg-sidebar-accent" : ""
                      )}
                      onClick={() => navigate(item.url)}
                    >
                      <item.icon className="h-5 w-5" />
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
