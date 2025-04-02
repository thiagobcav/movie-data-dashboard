
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    // Check if user prefers dark mode
    const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    setDarkMode(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Load sidebar minimized state from localStorage
    const isMinimized = localStorage.getItem('sidebarMinimized') === 'true';
    setMinimized(isMinimized);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', (!darkMode).toString());
    
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  const toggleMinimized = () => {
    const newMinimized = !minimized;
    setMinimized(newMinimized);
    localStorage.setItem('sidebarMinimized', newMinimized.toString());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex">
      <Sidebar 
        isMobile={isMobile} 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar}
        isMinimized={minimized}
        onToggleMinimize={toggleMinimized}
      />
      
      <div className={`flex-1 flex flex-col min-h-screen overflow-hidden ${!isMobile && "transition-all duration-300"} ${!isMobile && minimized ? "ml-16" : ""}`}>
        <Navbar 
          toggleDarkMode={toggleDarkMode} 
          isDarkMode={darkMode} 
        />
        
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
