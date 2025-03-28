
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createApi } from '@/utils/api';
import { formatDate } from '@/utils/formatters';

interface User {
  id: number;
  Nome: string;
  Email: string;
  UID: string;
  Ativo: boolean;
  Premium: boolean;
  Servidor: string;
  Pagamento: string;
  Hoje: string;
  Dias: number;
  Restantes: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (uid: string) => Promise<boolean>;
  logout: () => void;
  calculateRemainingDays: (paymentDate: string, totalDays: number) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Calculate remaining days
  const calculateRemainingDays = (paymentDate: string, totalDays: number): string => {
    if (!paymentDate || !totalDays) return '0 Dias';
    
    try {
      // Parse payment date
      const paymentDateObj = new Date(paymentDate);
      const today = new Date();
      
      // Calculate days passed
      const differenceInTime = today.getTime() - paymentDateObj.getTime();
      const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
      
      // Calculate remaining days
      const remainingDays = Math.max(0, totalDays - differenceInDays);
      
      return `${remainingDays} Dias`;
    } catch (error) {
      console.error('Error calculating remaining days:', error);
      return '0 Dias';
    }
  };

  // Check for stored auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('auth-user');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('auth-user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (uid: string): Promise<boolean> => {
    if (!uid.trim()) {
      toast.error('Por favor, insira uma chave de assinatura');
      return false;
    }

    setIsLoading(true);

    try {
      const api = createApi({
        apiToken: 'WCLaVXyfPFvPmK7PTtSDUjcYKTZY3bbl',
        baseUrl: 'https://api.baserow.io/api',
        tableIds: {
          users: '304448',
          contents: '',
          episodes: '',
          banners: '',
          categories: '',
          sessions: '',
          platforms: '',
        },
      });

      // Get all users to find the one with matching UID
      const response = await api.getTableRows('users', 1, 100);
      
      const foundUser = response.results.find((user: any) => user.UID === uid);
      
      if (!foundUser) {
        toast.error('Chave de assinatura inválida');
        setIsLoading(false);
        return false;
      }

      // Check if user is active
      if (!foundUser.Ativo) {
        toast.error('Conta desativada. Entre em contato com o administrador.');
        setIsLoading(false);
        return false;
      }

      // Calculate remaining days
      const remaining = calculateRemainingDays(foundUser.Pagamento, foundUser.Dias);
      const remainingDays = parseInt(remaining);
      
      // Check if subscription has expired
      if (isNaN(remainingDays) || remainingDays < 1) {
        toast.error('Sua assinatura expirou. Entre em contato com o administrador.');
        setIsLoading(false);
        return false;
      }

      // Add the remaining days calculation to the user object
      const userWithRemaining = {
        ...foundUser,
        Restantes: remaining
      };

      // Save user to state and localStorage
      setUser(userWithRemaining);
      localStorage.setItem('auth-user', JSON.stringify(userWithRemaining));
      
      toast.success(`Bem-vindo, ${foundUser.Nome}`);
      navigate('/');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao fazer login. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth-user');
    navigate('/login');
    toast.info('Sessão encerrada');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    calculateRemainingDays
  };

  return (
    <AuthContext.Provider value={value}>
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
