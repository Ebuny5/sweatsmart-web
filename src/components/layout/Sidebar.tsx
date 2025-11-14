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
  Activity,
  Menu,
  MessageCircle,
  Camera,
  CloudRain
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: BarChart2 },
    { title: "Log Episode", url: "/log-episode", icon: Plus },
    { title: "History", url: "/history", icon: Calendar },
    { title: "Insights", url: "/insights", icon: Activity },
    { title: "Climate Alerts", url: "/climate-alert", icon: CloudRain },
    { title: "Palm Scanner", url: "/palm-scanner", icon: Camera },
    { title: "Community", url: "/community", icon: MessageSquare },
    {
      title: "Feedback",
      url: "https://docs.google.com/forms/d/e/1FAIpQLSfHBkUOMxFhB03UyfpnrEQk5VlszVUFN2n-TqjRwJ1ehqSeTw/viewform",
      icon: MessageCircle,
      external: true,
    },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  const handleNavigation = (url: string, external?: boolean) => {
    if (external) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      navigate(url);
    } catch (error) {
      window.location.href = url;
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="fixed left-4 top-4 z-50 lg:hidden h-10 w-10 p-0 bg-background/80 backdrop-blur-sm border border-border shadow-sm hover:bg-accent"
        onClick={() => {
          const trigger = document.querySelector('[data-sidebar="trigger"]') as HTMLButtonElement;
          if (trigger) trigger.click();
        }}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle Menu</span>
      </Button>

      <SidebarComponent className="border-r bg-background">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary font-bold px-2 mb-6 text-lg">
              SweatSmart
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className={cn(
                        "w-full justify-start transition-all duration-200 cursor-pointer h-11 px-3",
                        location.pathname === item.url
                          ? "bg-primary text-primary-foreground font-medium shadow-sm"
                          : "hover:bg-muted hover:text-foreground"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleNavigation(item.url, item.external);
                      }}
                      asChild={false}
                    >
                      <div className="flex items-center w-full gap-3">
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="flex-1 text-sm font-medium">{item.title}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </SidebarComponent>

      <SidebarTrigger className="hidden" />
    </>
  );
};

export default Sidebar;
