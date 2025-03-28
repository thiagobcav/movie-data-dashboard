
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext';
import { useAuth } from '../../context/AuthContext';
import { Bell, Moon, Sun, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  toggleDarkMode: () => void;
  isDarkMode: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleDarkMode, isDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { apiToken } = useConfig();
  const { user, logout } = useAuth();

  // Map of routes to their display names
  const routeTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/contents': 'Conteúdos',
    '/episodes': 'Episódios',
    '/banners': 'Banners',
    '/categories': 'Categorias',
    '/users': 'Usuários',
    '/sessions': 'Sessões',
    '/platforms': 'Plataformas',
    '/settings': 'Configurações',
  };

  const currentTitle = routeTitles[location.pathname] || 'Página não encontrada';

  // Determine remaining days badge color
  const getRemainingDaysBadgeClass = () => {
    if (!user) return '';
    
    const days = parseInt(user.Restantes);
    
    if (isNaN(days)) {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    } else if (days <= 5) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    } else if (days <= 15) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    } else {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <h1 className="text-xl font-semibold">{currentTitle}</h1>

        <div className="flex items-center space-x-4">
          {!apiToken && (
            <div className="hidden sm:block bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 px-3 py-1 rounded-full text-xs font-medium animate-pulse">
              Configure seu token API nas configurações
            </div>
          )}

          {user && (
            <Badge className={getRemainingDaysBadgeClass()}>
              {user.Restantes}
            </Badge>
          )}

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleDarkMode}
            className="rounded-full"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </Button>

          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell size={18} />
          </Button>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <span className="font-medium">{user.Nome}</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <span className="text-sm text-muted-foreground">{user.Email}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-500 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
