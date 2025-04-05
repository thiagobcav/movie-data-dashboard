
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const PremiumSuccess = () => {
  const { verifyAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationComplete, setVerificationComplete] = useState(false);

  useEffect(() => {
    const verifyPaymentAndAccess = async () => {
      setIsVerifying(true);
      try {
        // Get payment information from query parameters
        const urlParams = new URLSearchParams(location.search);
        const paymentId = urlParams.get('payment_id');
        const paymentStatus = urlParams.get('status');
        
        if (paymentId && paymentStatus === 'approved') {
          // Verify access to update premium status
          const success = await verifyAccess();
          
          if (success) {
            toast.success('Sua assinatura Premium foi ativada com sucesso!');
            setVerificationComplete(true);
          } else {
            toast.error('Houve um problema ao ativar sua assinatura Premium.');
            // Navigate to premium page after a delay
            setTimeout(() => navigate('/premium'), 3000);
          }
        } else if (paymentStatus === 'pending') {
          toast.info('Seu pagamento está pendente de aprovação.');
          setVerificationComplete(true);
        } else if (paymentStatus === 'failure') {
          toast.error('O pagamento falhou. Por favor, tente novamente.');
          // Navigate to premium page after a delay
          setTimeout(() => navigate('/premium'), 3000);
        } else {
          // Verify access in case the user is returning to this page
          await verifyAccess();
          setVerificationComplete(true);
        }
      } catch (error) {
        console.error('Verification error:', error);
        toast.error('Ocorreu um erro ao verificar seu pagamento.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPaymentAndAccess();
  }, [verifyAccess, navigate, location.search]);

  if (isVerifying) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Verificando seu pagamento...</p>
        </div>
      </DashboardLayout>
    );
  }

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
              <li>Suporte prioritário</li>
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
