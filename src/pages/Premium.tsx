import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { CreditCard, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Premium = () => {
  const { user, verifyAccess } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const handlePremiumPayment = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Use the proxy to handle sensitive information and payment processing
      const response = await fetch('https://script.google.com/macros/s/AKfycbymxuIli4v1MHzIr-6vhm2IsRZOoGM2QetJqCGwPhqltBxAMXX-Yp5bbK8esK4GlLLs9g/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createPayment',
          userData: {
            email: user.Email || "cliente@email.com",
            name: user.Nome || "Cliente",
            id: user.UUID
          }
        }),
      });
      
      const data = await response.json();
      
      if (data.init_point) {
        // Redirecionar para o checkout do Mercado Pago
        window.location.href = data.init_point;
      } else {
        toast.error("Erro ao criar pagamento", {
          description: "Não foi possível iniciar o checkout. Tente novamente."
        });
      }
    } catch (error) {
      console.error("Erro na integração com pagamento:", error);
      toast.error("Erro ao processar pagamento", {
        description: "Ocorreu um problema ao conectar com o gateway de pagamento."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Se o usuário já é premium, exibir informações da assinatura
  if (user?.Premium) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Assinatura Premium</h1>
            <p className="text-muted-foreground">
              Sua conta já possui acesso aos recursos premium
            </p>
          </div>
          
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200 dark:border-green-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <CardTitle>Assinatura Ativa</CardTitle>
              </div>
              <CardDescription>
                Você já possui todos os recursos premium ativos em sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">Ativo</span>
                </div>
                
                {user.Pagamento && (
                  <div className="grid grid-cols-2 gap-1">
                    <span className="text-muted-foreground">Última renovação:</span>
                    <span className="font-medium">
                      {format(new Date(user.Pagamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                )}
                
                {user.Dias > 0 && (
                  <div className="grid grid-cols-2 gap-1">
                    <span className="text-muted-foreground">Período da assinatura:</span>
                    <span className="font-medium">{user.Dias} dias</span>
                  </div>
                )}
                
                {user.Restam > 0 && (
                  <div className="grid grid-cols-2 gap-1">
                    <span className="text-muted-foreground">Dias restantes:</span>
                    <span className="font-medium">{user.Restam} dias</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/premium-features')}
              >
                Ver recursos premium
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Assine o Premium</h1>
          <p className="text-muted-foreground">
            Aproveite recursos avançados para gerenciar sua plataforma
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Plano Basic</CardTitle>
              <CardDescription>Acesso às funcionalidades básicas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">Grátis</div>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>Gerenciamento de conteúdos</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>Gerenciamento de episódios</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>Gerenciamento de categorias</span>
                </li>
                <li className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">Sem substituição de URLs</span>
                </li>
                <li className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">Sem verificação de duplicados</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                Plano atual
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="md:col-span-1 border-primary bg-primary/5">
            <CardHeader>
              <CardTitle>Plano Premium</CardTitle>
              <CardDescription>Acesso a todas as funcionalidades</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">R$ 49,90 <span className="text-sm font-normal text-muted-foreground">/mês</span></div>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>Tudo do plano Basic</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>Substituição de URLs em massa</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>Substituição de URLs em episódios</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>Verificação de conteúdos duplicados</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>Importação em lote</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={handlePremiumPayment}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-2"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Assinar com Mercado Pago
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Premium;
