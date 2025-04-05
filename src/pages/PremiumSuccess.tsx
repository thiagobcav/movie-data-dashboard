
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const PremiumSuccess = () => {
  const { verifyAccess } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Verify access to update premium status
    verifyAccess().then(success => {
      if (success) {
        toast.success('Sua assinatura Premium foi ativada com sucesso!');
      }
    });
  }, [verifyAccess]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Pagamento Processado com Sucesso</h1>
          <p className="text-muted-foreground">
            Sua assinatura Premium foi ativada
          </p>
        </div>
        
        <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <CardTitle>Pagamento Confirmado</CardTitle>
            </div>
            <CardDescription>
              Seu pagamento foi processado e sua conta foi atualizada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Agora você tem acesso a todos os recursos premium da plataforma:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Substituição de URLs em massa</li>
              <li>Substituição de URLs em episódios</li>
              <li>Verificação de conteúdos duplicados</li>
              <li>Importação em lote</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigate('/premium-features')}
              className="w-full sm:w-auto"
            >
              Ver Recursos Premium
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PremiumSuccess;
