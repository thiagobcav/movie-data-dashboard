
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, verifyAccess, logout } = useAuth();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (isAuthenticated) {
        setIsVerifying(true);
        const accessVerified = await verifyAccess();
        
        if (!accessVerified) {
          toast.error('Seu acesso expirou ou foi desativado');
          logout();
          setHasAccess(false);
        } else {
          setHasAccess(true);
        }
        
        setIsVerifying(false);
      } else {
        setIsVerifying(false);
      }
    }
    
    checkAccess();
  }, [isAuthenticated, location.pathname]);

  if (isVerifying) {
    // Show loading or nothing while verifying
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <span className="mt-2 text-sm text-muted-foreground">Verificando acesso...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasAccess) {
    // Redirect to login page, but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
