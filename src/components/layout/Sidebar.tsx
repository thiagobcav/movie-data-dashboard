
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Film, 
  Tv, 
  Image, 
  Bookmark, 
  Users, 
  Layers, 
  Server, 
  Settings, 
  Menu, 
  X,
  Home
} from 'lucide-react';

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile, isOpen, onToggle }) => {
  const location = useLocation();
  
  const sidebarItems = [
    { path: '/', icon: <Home size={20} />, label: 'Dashboard' },
    { path: '/contents', icon: <Film size={20} />, label: 'Conteúdos' },
    { path: '/episodes', icon: <Tv size={20} />, label: 'Episódios' },
    { path: '/banners', icon: <Image size={20} />, label: 'Banners' },
    { path: '/categories', icon: <Bookmark size={20} />, label: 'Categorias' },
    { path: '/users', icon: <Users size={20} />, label: 'Usuários' },
    { path: '/sessions', icon: <Layers size={20} />, label: 'Sessões' },
    { path: '/platforms', icon: <Server size={20} />, label: 'Plataformas' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Configurações' },
  ];

  return (
    <>
      {isMobile && (
        <button
          onClick={onToggle}
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-primary text-white"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out 
          ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
          ${!isMobile && 'relative'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold text-center">MediaAdmin</h2>
          </div>

          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-2">
              {sidebarItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `
                      sidebar-item ${isActive ? 'active' : ''}
                    `}
                    onClick={isMobile ? onToggle : undefined}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} MediaAdmin
            </p>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Sidebar;
