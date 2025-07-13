
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

interface HeaderProps {
  isAuthenticated?: boolean;
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  
  const handleLogin = () => {
    navigate('/login');
  };
  
  const handleRegister = () => {
    navigate('/register');
  };
  
  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };
  
  const userName = profile?.display_name || user?.email || '';
  const userInitials = userName
    ? userName.split(' ').map(name => name[0]).join('').toUpperCase()
    : '?';
    
  return (
    <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer ml-12 lg:ml-0" onClick={() => navigate(user ? '/dashboard' : '/')}>
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white text-lg font-bold">S</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">SweatSmart</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src="" alt={userName} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleLogin}>
                Login
              </Button>
              <Button onClick={handleRegister}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
