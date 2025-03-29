
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'sonner';

interface User {
  Nome: string;
  Email: string;
  UUID: string;
  Ativo: boolean;
  Premium: boolean;
  Pagamento: string;
  Dias: number;
  Restantes: string;
  Restam: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (uuid: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  verifyAccess: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatRemainingDays = (remainingText: string, totalDays: number): number => {
    if (!remainingText) return 0;
    
    try {
      // Parse days from "587 days 19:32:15.493125" format
      const daysMatch = remainingText.match(/(\d+) days?/);
      if (daysMatch && daysMatch[1]) {
        // Calculate remaining days as totalDays minus the days from remainingText
        const daysFromText = parseInt(daysMatch[1]);
        return Math.max(0, totalDays - daysFromText);
      }
      return 0;
    } catch (error) {
      console.error('Error parsing remaining days:', error);
      return 0;
    }
  };

  const verifyAccess = async (): Promise<boolean> => {
    const storedUser = localStorage.getItem('auth_user');
    if (!storedUser) return false;

    try {
      const userData = JSON.parse(storedUser);
      
      // Verify user is still active and has remaining days
      const encodedFilter = encodeURIComponent(JSON.stringify({
        filter_type: "AND",
        filters: [{
          type: "equal",
          field: "UUID",
          value: userData.UUID
        }],
        groups: []
      }));
      
      const response = await fetch(
        `https://api.baserow.io/api/database/rows/table/304448/?user_field_names=true&filters=${encodedFilter}`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Token 9HJjNCWkRnJDxwYZHLYG9sHgLEu2Pbar'
          }
        }
      );
      
      if (!response.ok) {
        console.error('Failed to verify access', await response.json());
        return false;
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        console.error('User no longer exists in the database');
        return false;
      }
      
      const updatedUserData = data.results[0];
      
      // Check if user is still active
      if (!updatedUserData.Ativo) {
        console.error('User is no longer active');
        return false;
      }
      
      // Calculate remaining days
      const remainingDays = formatRemainingDays(updatedUserData.Restantes, updatedUserData.Dias);
      
      if (remainingDays <= 0) {
        console.error('Subscription has expired');
        return false;
      }
      
      // Update the user data in localStorage with the latest data
      const formattedUser = {
        ...updatedUserData,
        Restam: remainingDays
      };
      
      setUser(formattedUser);
      localStorage.setItem('auth_user', JSON.stringify(formattedUser));
      
      return true;
    } catch (error) {
      console.error('Error verifying access:', error);
      return false;
    }
  };
  
  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        
        // Verify access immediately when app loads
        verifyAccess().then(hasAccess => {
          if (!hasAccess) {
            toast.error('Seu acesso expirou ou foi desativado');
            logout();
          }
        });
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('auth_user');
      }
    }
    
    // Set up periodic access verification (every 15 minutes)
    const intervalId = setInterval(() => {
      if (isAuthenticated) {
        verifyAccess().then(hasAccess => {
          if (!hasAccess) {
            toast.error('Seu acesso expirou ou foi desativado');
            logout();
          }
        });
      }
    }, 15 * 60 * 1000); // 15 minutes
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);
  
  const login = async (uuid: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Format the filter value with proper encoding
      const encodedFilter = encodeURIComponent(JSON.stringify({
        filter_type: "AND",
        filters: [{
          type: "equal",
          field: "UUID",
          value: uuid
        }],
        groups: []
      }));
      
      const response = await fetch(
        `https://api.baserow.io/api/database/rows/table/304448/?user_field_names=true&filters=${encodedFilter}`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Token 9HJjNCWkRnJDxwYZHLYG9sHgLEu2Pbar'
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        toast.error('Chave de acesso inválida');
        return false;
      }
      
      const userData = data.results[0];
      
      // Check if user is active
      if (!userData.Ativo) {
        toast.error('Usuário não está ativo');
        return false;
      }
      
      // Calculate remaining days (Dias - Restantes)
      const remainingDays = formatRemainingDays(userData.Restantes, userData.Dias);
      const formattedUser = {
        ...userData,
        Restam: remainingDays
      };
      
      if (remainingDays <= 0) {
        toast.error('Sua assinatura expirou');
        return false;
      }
      
      // Save user to state and localStorage
      setUser(formattedUser);
      setIsAuthenticated(true);
      localStorage.setItem('auth_user', JSON.stringify(formattedUser));
      
      toast.success(`Bem-vindo, ${userData.Nome}`);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error(`Erro no login: ${(error as Error).message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('auth_user');
    toast.info('Você saiu do sistema');
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading, verifyAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
