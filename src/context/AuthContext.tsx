
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

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
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
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
