
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/card';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

const API_TOKEN = '9HJjNCWkRnJDxwYZHLYG9sHgLEu2Pbar';

const PremiumSuccess = () => {
  const { user, verifyAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(true);
  const [isError, setIsError] = useState(false);
  
  useEffect(() => {
    const activatePremium = async () => {
      if (!user) {
        setIsError(true);
        setIsProcessing(false);
        return;
      }
      
      try {
        // Obter parâmetros da URL
        const params = new URLSearchParams(location.search);
        const paymentStatus = params.get('status');
        const paymentId = params.get('payment_id');
        const externalReference = params.get('external_reference');
        
        // Verificar se os dados correspondem ao usuário atual
        if (externalReference !== user.UUID) {
          throw new Error('Referência de usuário inválida');
        }
        
        // Verificar status do pagamento
        if (paymentStatus !== 'approved') {
          throw new Error('Pagamento não aprovado');
        }
        
        // Atualizar o usuário na API Baserow para torná-lo premium
        const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
        
        // Formatar o filtro para encontrar o usuário pelo UUID
        const encodedFilter = encodeURIComponent(JSON.stringify({
          filter_type: "AND",
          filters: [{
            type: "equal",
            field: "UUID",
            value: user.UUID
          }],
          groups: []
        }));
        
        // Primeiro, obter o ID da linha do usuário
        const userResponse = await fetch(
          `https://api.baserow.io/api/database/rows/table/304448/?user_field_names=true&filters=${encodedFilter}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Token ${API_TOKEN}`
            }
          }
        );
        
        if (!userResponse.ok) {
          throw new Error('Erro ao buscar dados do usuário');
        }
        
        const userData = await userResponse.json();
        
        if (!userData.results || userData.results.length === 0) {
          throw new Error('Usuário não encontrado');
        }
        
        const userId = userData.results[0].id;
        
        // Atualizar o usuário para premium
        const updateResponse = await fetch(
          `https://api.baserow.io/api/database/rows/table/304448/${userId}/?user_field_names=true`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Token ${API_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              Premium: true,
              Pagamento: today
            })
          }
        );
        
        if (!updateResponse.ok) {
          throw new Error('Erro ao atualizar status premium');
        }
        
        // Atualizar os dados do usuário no contexto
        await verifyAccess();
        
        toast.success('Assinatura premium ativada com sucesso!', {
          description: 'Você agora tem acesso a todos os recursos premium.'
        });
        
        setIsProcessing(false);
      } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        setIsError(true);
        setIsProcessing(false);
        toast.error('Erro ao ativar assinatura premium', {
          description: (error as Error).message || 'Tente novamente ou contate o suporte.'
        });
      }
    };
    
    activatePremium();
  }, [user, verifyAccess, location.search]);
  
  if (isProcessing) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto"></div>
            <h2 className="text-2xl font-bold">Processando pagamento</h2>
            <p className="text-muted-foreground">
              Estamos confirmando seu pagamento e ativando sua assinatura premium...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (isError) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-destructive">Falha no processamento</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Não foi possível confirmar seu pagamento. Por favor, tente novamente ou entre em contato com o suporte.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={() => navigate('/premium')} variant="outline">
                Voltar
              </Button>
              <Button onClick={() => navigate('/premium-features')}>
                Recursos Premium
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200 dark:border-green-800">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Pagamento confirmado!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Sua assinatura premium foi ativada com sucesso. Agora você tem acesso a todos os recursos avançados da plataforma.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              className="gap-2"
              onClick={() => navigate('/premium-features')}
            >
              Ver recursos premium
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PremiumSuccess;
