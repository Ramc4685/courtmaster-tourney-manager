
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Bell,
  HelpCircle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '../ui/button';

const UserMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to login page handled by AuthContext
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserInitials = () => {
    if (!user) return '?';
    
    // Use display_name or full_name to get initials
    const displayName = user.display_name || user.full_name || '';
    if (!displayName) return '?';
    
    // Get initials from name parts
    return displayName
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (!user) {
    return (
      <div className="flex space-x-2">
        <Link to="/login">
          <Button variant="outline">Log in</Button>
        </Link>
        <Link to="/register">
          <Button>Sign up</Button>
        </Link>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url} alt={user.display_name || "User"} />
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden md:inline-block">
            {user.display_name || user.full_name || (user.email ? user.email.split('@')[0] : 'User')}
          </span>
          <ChevronDown size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{user.full_name || user.display_name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link to="/profile">
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
        </Link>
        <Link to="/notifications">
          <DropdownMenuItem>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </DropdownMenuItem>
        </Link>
        <Link to="/settings">
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </Link>
        <Link to="/help">
          <DropdownMenuItem>
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help & Support</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
