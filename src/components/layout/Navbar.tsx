
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext';
import { Bell, Moon, Sun, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  toggleDarkMode: () => void;
  isDarkMode: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleDarkMode, isDarkMode }) => {
  const location = useLocation();
  const { apiToken } = useConfig();

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

          <Button variant="ghost" size="icon" className="rounded-full">
            <User size={18} />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
