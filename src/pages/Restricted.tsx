
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Restricted = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
              <AlertTriangle size={32} className="text-red-500 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Acesso Restrito</CardTitle>
          <CardDescription className="text-center">
            Você não tem permissão para acessar este servidor com sua conta atual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Para acessar este servidor, você precisa de uma conta premium.
            Entre em contato com o administrador para mais informações.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            variant="default" 
            className="w-full" 
            onClick={() => navigate('/')}
          >
            Voltar para o Dashboard
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={logout}
          >
            Sair
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Restricted;
