import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History, CloudRainWind, Sparkles, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Hand, TrendingUp, Users, MessageSquare, Settings } from 'lucide-react';

const primaryItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/log-episode', icon: PlusCircle, label: 'Log' },
  { path: '/climate', icon: CloudRainWind, label: 'Climate' },
  { path: '/hyper-ai', icon: Sparkles, label: 'AI' },
];

const moreItems = [
  { path: '/history', icon: History, label: 'History' },
  { path: '/insights', icon: TrendingUp, label: 'Insights' },
  { path: '/palm-scanner', icon: Hand, label: 'Scanner' },
  { path: '/community', icon: Users, label: 'Community' },
  { path: '/contact', icon: MessageSquare, label: 'Feedback' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

const MobileBottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {primaryItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors min-w-[56px]',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium text-muted-foreground min-w-[56px]">
              <Menu className="h-5 w-5" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-8">
            <div className="grid grid-cols-3 gap-4 pt-4">
              {moreItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-colors',
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'
                    )
                  }
                >
                  <item.icon className="h-6 w-6" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
