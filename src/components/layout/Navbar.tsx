
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext';
import { useAuth } from '../../context/AuthContext';
import { Bell, Moon, Sun, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  const handleLogout = () => {
    logout();
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user ? (
                <>
                  <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium">{user.Nome}</div>
                    <div className="text-xs text-muted-foreground">{user.Email}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-xs text-muted-foreground cursor-default">
                    UUID: {user.UUID}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs text-muted-foreground cursor-default">
                    Dias restantes: {user.Restam} de {user.Dias}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuLabel>Não autenticado</DropdownMenuLabel>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
