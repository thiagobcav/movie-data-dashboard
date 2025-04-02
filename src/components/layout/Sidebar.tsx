
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  X, Menu, Home, Box, FilmIcon, LayoutGrid, Users, 
  Settings, FileWarning, Upload, ImageIcon, Lock, 
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  isMinimized: boolean;
  onToggle: () => void;
  onToggleMinimize: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isMobile, 
  isOpen, 
  isMinimized, 
  onToggle, 
  onToggleMinimize 
}) => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Check if user has premium access
  const isPremium = user?.Premium === true;

  const navItems = [
    { 
      href: '/', 
      label: 'Dashboard', 
      icon: <Home size={18} />
    },
    { 
      href: '/contents', 
      label: 'Conteúdos', 
      icon: <FilmIcon size={18} />
    },
    { 
      href: '/episodes', 
      label: 'Episódios', 
      icon: <Box size={18} /> 
    },
    { 
      href: '/categories', 
      label: 'Categorias', 
      icon: <LayoutGrid size={18} /> 
    },
    { 
      href: '/users', 
      label: 'Usuários', 
      icon: <Users size={18} /> 
    },
    { 
      href: '/promotionals', 
      label: 'Promocionais', 
      icon: <ImageIcon size={18} /> 
    },
    {
      href: isPremium ? '/bulk-upload' : '#',
      label: 'Upload em Massa',
      icon: <Upload size={18} />,
      isPremium: true
    },
    { 
      href: '/settings', 
      label: 'Configurações', 
      icon: <Settings size={18} /> 
    },
  ];

  const duplicateItems = [
    {
      href: isPremium ? '/duplicates/contents' : '#',
      label: 'Conteúdos Duplicados',
      icon: <FileWarning size={18} />,
      isPremium: true
    },
    {
      href: isPremium ? '/duplicates/episodes' : '#',
      label: 'Episódios Duplicados',
      icon: <FileWarning size={18} />,
      isPremium: true
    }
  ];

  // Classes
  const sidebarClasses = cn(
    "fixed inset-y-0 left-0 z-[49] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out",
    isMobile && !isOpen 
      ? "-translate-x-full" 
      : "translate-x-0",
    !isMobile && isMinimized 
      ? "w-16" 
      : "w-64"
  );
  
  const overlayClasses = cn(
    "fixed inset-0 bg-black/50 z-[48] lg:hidden transition-opacity duration-300",
    isMobile && isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
  );
  
  const navItemClasses = "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700";
  const activeItemClasses = "bg-gray-100 dark:bg-gray-700 text-primary";
  const disabledItemClasses = "opacity-75 cursor-not-allowed";

  const handlePremiumItemClick = (e: React.MouseEvent, isPremiumItem: boolean) => {
    if (isPremiumItem && !isPremium) {
      e.preventDefault();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={overlayClasses} 
        onClick={onToggle}
      />
      
      {/* Sidebar */}
      <aside className={sidebarClasses}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!isMinimized && (
            <h2 className="text-xl font-semibold">Painel Admin</h2>
          )}
          
          {isMobile ? (
            <Button variant="ghost" size="icon" onClick={onToggle}>
              <X size={20} />
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onToggleMinimize} 
              className={cn(isMinimized && "mx-auto")}
            >
              {isMinimized ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </Button>
          )}
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => (
            <TooltipProvider key={item.href}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link 
                    to={item.href}
                    className={cn(
                      navItemClasses,
                      location.pathname === item.href && activeItemClasses,
                      item.isPremium && !isPremium && disabledItemClasses,
                      isMinimized && 'justify-center px-2'
                    )}
                    onClick={(e) => handlePremiumItemClick(e, item.isPremium || false)}
                  >
                    {item.icon}
                    {(!isMinimized || isMobile) && (
                      <>
                        <span>{item.label}</span>
                        {item.isPremium && (
                          <>
                            {isPremium ? (
                              <Badge className="ml-auto text-xs bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 px-2 py-1 rounded-full">
                                Premium
                              </Badge>
                            ) : (
                              <Lock size={16} className="ml-auto text-amber-500" />
                            )}
                          </>
                        )}
                      </>
                    )}
                  </Link>
                </TooltipTrigger>
                {(isMinimized && !isMobile) || (item.isPremium && !isPremium) ? (
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                    {item.isPremium && !isPremium && (
                      <p className="text-xs text-amber-500">Recurso Premium</p>
                    )}
                  </TooltipContent>
                ) : null}
              </Tooltip>
            </TooltipProvider>
          ))}
          
          <div className="pt-2 pb-1">
            {(!isMinimized || isMobile) && (
              <p className="px-4 py-2 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
                Manutenção
              </p>
            )}
          </div>
          
          {duplicateItems.map((item) => (
            <TooltipProvider key={item.href}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link 
                    to={item.href}
                    className={cn(
                      navItemClasses,
                      location.pathname === item.href && activeItemClasses,
                      item.isPremium && !isPremium && disabledItemClasses,
                      isMinimized && !isMobile && 'justify-center px-2'
                    )}
                    onClick={(e) => handlePremiumItemClick(e, item.isPremium || false)}
                  >
                    {item.icon}
                    {(!isMinimized || isMobile) && (
                      <>
                        <span>{item.label}</span>
                        {item.isPremium && !isPremium && (
                          <Lock size={16} className="ml-auto text-amber-500" />
                        )}
                      </>
                    )}
                  </Link>
                </TooltipTrigger>
                {(isMinimized && !isMobile) || (item.isPremium && !isPremium) ? (
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                    {item.isPremium && !isPremium && (
                      <p className="text-xs text-amber-500">Recurso Premium</p>
                    )}
                  </TooltipContent>
                ) : null}
              </Tooltip>
            </TooltipProvider>
          ))}
        </nav>
        
        <div className={cn("p-4 border-t border-gray-200 dark:border-gray-700", isMinimized && !isMobile && "flex justify-center")}>
          {!isMinimized || isMobile ? (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                {user?.Nome?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-sm font-medium truncate">{user?.Nome || 'Usuário'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.Premium ? 'Premium' : 'Padrão'}
                </p>
              </div>
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                    {user?.Nome?.charAt(0) || 'U'}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{user?.Nome || 'Usuário'}</p>
                  <p className="text-xs">{user?.Premium ? 'Premium' : 'Padrão'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </aside>
      
      {/* Mobile toggle button */}
      {isMobile && !isOpen && (
        <Button 
          variant="outline" 
          size="icon" 
          className="fixed top-4 left-4 z-50 lg:hidden"
          onClick={onToggle}
        >
          <Menu size={20} />
        </Button>
      )}
    </>
  );
};

export default Sidebar;
