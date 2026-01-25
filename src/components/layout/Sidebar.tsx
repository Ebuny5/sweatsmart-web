import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  TrendingUp, 
  Hand, 
  CloudRainWind, 
  Users, 
  MessageSquare, 
  Settings,
  Sparkles,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/log-episode', icon: PlusCircle, label: 'Log Episode' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/insights', icon: TrendingUp, label: 'Insights' },
  { path: '/palm-scanner', icon: Hand, label: 'Palm Scanner' },
  { path: '/hyper-ai', icon: Sparkles, label: 'Hyper AI' },
  { path: '/climate', icon: CloudRainWind, label: 'Climate Alert' },
  { path: '/community', icon: Users, label: 'Community' },
  { path: '/contact', icon: MessageSquare, label: 'Feedback' },
  { path: '/settings', icon: Settings, label: 'Settings' },
  { path: '/knowledge-admin', icon: Database, label: 'Knowledge Base' },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-background border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold text-foreground">SweatSmart</h2>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;