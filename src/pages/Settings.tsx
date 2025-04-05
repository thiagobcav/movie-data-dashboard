import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ConfigPanel from '@/components/dashboard/ConfigPanel';
import LogsPanel from '@/components/dashboard/LogsPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConfig } from '@/context/ConfigContext';
import { createApi } from '@/utils/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ProgressDialog } from '@/components/ui/progress-dialog';
import { toast } from 'sonner';
import logger from '@/utils/logger';
import { Lock, Crown, CheckCircle, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { createPaymentSession } from '@/utils/paymentProxy';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

const Settings = () => {
  const config = useConfig();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("config");
  
  // Estado para o recurso premium de substituição de URLs
  const [sourceUrl, setSourceUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [shouldCancel, setShouldCancel] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [error, setError] = useState({ isError: false, message: "" });
  const [isEpisodesMode, setIsEpisodesMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateUrls = async () => {
    if (!sourceUrl || !targetUrl) {
      toast.error("Preencha as URLs de origem e destino");
      return;
    }
    
    // Reset state
    setIsProcessing(true);
    setIsComplete(false);
    setShouldCancel(false);
    setProgress(0);
    setProcessedCount(0);
    setTotalCount(0);
    setError({ isError: false, message: "" });
    setIsDialogOpen(true);
    
    try {
      const api = createApi({
        apiToken: config.apiToken,
        baseUrl: config.baseUrl,
        tableIds: config.tableIds
      });
      
      const tableType = isEpisodesMode ? 'episodes' : 'contents';
      logger.info(`Iniciando substituição de URLs em ${tableType}: ${sourceUrl} -> ${targetUrl}`);
      
      await api.updateItemUrls(tableType, sourceUrl, targetUrl, {
        onProgress: (processed, total) => {
          setProcessedCount(processed);
          setTotalCount(total);
          setProgress(Math.floor((processed / total) * 100));
        },
        onComplete: (updated) => {
          setUpdatedCount(updated);
          setIsComplete(true);
          setIsProcessing(false);
          logger.info(`Substituição de URLs concluída: ${updated} URLs atualizadas`);
          toast.success(`${updated} URLs atualizadas com sucesso`);
        },
        onError: (err) => {
          setError({ isError: true, message: err.message });
          setIsProcessing(false);
          logger.error("Erro durante substituição de URLs:", err);
        },
        shouldCancel: () => shouldCancel
      });
    } catch (err) {
      setIsProcessing(false);
      setError({ isError: true, message: (err as Error).message });
      logger.error("Erro ao iniciar substituição de URLs:", err);
      toast.error("Erro ao processar URLs", {
        description: (err as Error).message
      });
    }
  };
  
  const handleCancelOperation = () => {
    setShouldCancel(true);
    toast.info("Cancelando operação...");
    logger.info("Operação de substituição de URLs cancelada pelo usuário");
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    if (isComplete || error.isError) {
      setSourceUrl("");
      setTargetUrl("");
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para assinar o plano Premium");
      return;
    }

    setIsLoading(true);
    try {
      const userData = {
        email: user.Email,
        name: user.Nome,
        id: user.UUID
      };

      const response = await createPaymentSession(userData);

      if (response.error) {
        toast.error("Erro ao iniciar o processo de pagamento", {
          description: response.error
        });
        return;
      }

      if (response.init_point) {
        // Redirect to Mercado Pago checkout
        window.location.href = response.init_point;
      } else {
        toast.error("Resposta de pagamento inválida");
      }
    } catch (error) {
      console.error("Erro ao processar assinatura:", error);
      toast.error("Não foi possível processar sua assinatura neste momento");
    } finally {
      setIsLoading(false);
    }
  };

  const isPremium = user?.Premium === true;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações de conexão com o Baserow
          </p>
        </div>

        <Tabs 
          defaultValue="config" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="config">Configurações da API</TabsTrigger>
            <TabsTrigger value="premium">Recursos Premium</TabsTrigger>
            <TabsTrigger value="seja-premium" className="flex items-center gap-1">
              <Crown className="h-4 w-4 text-amber-500" />
              Seja Premium
            </TabsTrigger>
            <TabsTrigger value="logs">Logs do Sistema</TabsTrigger>
          </TabsList>
          
          <TabsContent value="config" className="space-y-4">
            <ConfigPanel />
          </TabsContent>
          
          <TabsContent value="premium" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-amber-500" />
                  <CardTitle>Recursos Premium</CardTitle>
                </div>
                <CardDescription>
                  Funcionalidades avançadas para gerenciamento em massa de conteúdos
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold tracking-tight">Substituição em Massa de URLs</h3>
                  <p className="text-sm text-muted-foreground">
                    Substitua URLs em vários conteúdos de uma vez, mantendo a estrutura específica de cada link.
                  </p>
                  
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch 
                      id="table-mode" 
                      checked={isEpisodesMode}
                      onCheckedChange={setIsEpisodesMode}
                    />
                    <Label htmlFor="table-mode">
                      {isEpisodesMode ? "Substituir URLs de Episódios" : "Substituir URLs de Conteúdos"}
                    </Label>
                  </div>
                  
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label htmlFor="sourceUrl" className="text-sm font-medium">
                        URL Base Atual
                      </label>
                      <Input
                        id="sourceUrl"
                        placeholder="Ex: fhd4.filme.com/seu-id-aqui"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Digite parte da URL que deseja substituir. O sistema encontrará todos os conteúdos que contêm essa parte.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="targetUrl" className="text-sm font-medium">
                        Nova URL Base
                      </label>
                      <Input
                        id="targetUrl"
                        placeholder="Ex: fhd4.filme.com/seu-id-aqui/FHD4"
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Digite a nova parte da URL que substituirá a parte antiga.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-md">
                    <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                      Exemplo de Substituição
                    </h4>
                    <Separator className="my-2 bg-amber-200 dark:bg-amber-800" />
                    <div className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
                      <p>
                        <strong>URL Original:</strong> fhd4.filme.com/seu-id-aqui/tt123456.mp4
                      </p>
                      <p>
                        <strong>Parte a Substituir:</strong> fhd4.filme.com/seu-id-aqui
                      </p>
                      <p>
                        <strong>Nova Parte:</strong> fhd4.filme.com/seu-id-aqui/FHD4
                      </p>
                      <p>
                        <strong>Resultado:</strong> fhd4.filme.com/seu-id-aqui/FHD4/tt123456.mp4
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button
                  onClick={handleUpdateUrls}
                  disabled={!sourceUrl || !targetUrl || isProcessing}
                  className="w-full sm:w-auto"
                >
                  Iniciar Substituição
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="seja-premium" className="space-y-6">
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Crown className="h-6 w-6 text-amber-500" />
                  <CardTitle>Seja Premium</CardTitle>
                </div>
                <CardDescription>
                  Desbloqueie recursos avançados para seu painel de administração
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {isPremium ? (
                  <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-300 font-medium mb-2">
                      <CheckCircle className="h-5 w-5" />
                      <span>Você já é um usuário Premium!</span>
                    </div>
                    <p className="text-green-700 dark:text-green-400 text-sm">
                      Aproveite todos os recursos exclusivos do seu plano.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex flex-col md:flex-row gap-6">
                      <Card className="flex-1 border-gray-200 dark:border-gray-700">
                        <CardHeader>
                          <CardTitle>Plano Padrão</CardTitle>
                          <CardDescription>Seu plano atual</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="text-2xl font-bold">Gratuito</div>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Gerenciamento de conteúdos</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Gerenciamento de episódios</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Gerenciamento de categorias</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <X className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-500">Substituição de URLs em massa</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <X className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-500">Verificação de duplicados</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <X className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-500">Upload em massa</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card className="flex-1 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/50">
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-amber-500" />
                            <CardTitle>Plano Premium</CardTitle>
                          </div>
                          <CardDescription>Recursos exclusivos</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-baseline">
                            <span className="text-2xl font-bold">R$15</span>
                            <span className="text-sm text-muted-foreground ml-1">/mês</span>
                          </div>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Tudo do plano Padrão</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="font-medium">Substituição de URLs em massa</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="font-medium">Verificação de conteúdos duplicados</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="font-medium">Upload em massa</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Suporte prioritário</span>
                            </li>
                          </ul>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            onClick={handleSubscribe}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <span className="animate-spin mr-2">⟳</span>
                                Processando...
                              </>
                            ) : (
                              "Assinar Agora"
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">Por que assinar Premium?</h3>
                      <p className="text-blue-700 dark:text-blue-400 text-sm mb-3">
                        O plano Premium desbloqueia recursos avançados que ajudam a gerenciar seu conteúdo de forma mais eficiente:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                          <h4 className="font-medium text-blue-800 dark:text-blue-300">Substituição de URLs em Massa</h4>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            Atualize rapidamente URLs em vários conteúdos ao mesmo tempo, economizando horas de trabalho manual.
                          </p>
                        </div>
                        <div className="bg-white dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                          <h4 className="font-medium text-blue-800 dark:text-blue-300">Detecção de Conteúdo Duplicado</h4>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            Identifique automaticamente conteúdos e episódios duplicados para manter sua base de dados organizada.
                          </p>
                        </div>
                        <div className="bg-white dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                          <h4 className="font-medium text-blue-800 dark:text-blue-300">Upload em Massa</h4>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            Importe múltiplos conteúdos de uma vez através de arquivos M3U ou de forma automatizada.
                          </p>
                        </div>
                        <div className="bg-white dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                          <h4 className="font-medium text-blue-800 dark:text-blue-300">Suporte Prioritário</h4>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            Receba atendimento prioritário para resolver quaisquer problemas ou dúvidas que surgirem.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {isPremium && (
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes da sua Assinatura</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Plano atual</h3>
                      <p className="flex items-center gap-1">
                        <Crown className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">Premium</span>
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Data de pagamento</h3>
                      <p>{user?.Pagamento || "N/A"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Período</h3>
                      <p>{user?.Dias} dias</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Dias Restantes</h3>
                      <p>{user?.Restam} dias</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <NavigationMenu>
                    <NavigationMenuList>
                      <NavigationMenuItem>
                        <NavigationMenuTrigger className="bg-transparent">Recursos Premium</NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                            <li className="row-span-3">
                              <NavigationMenuLink asChild>
                                <a
                                  className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 p-6 no-underline outline-none focus:shadow-md"
                                  href="/premium-features"
                                >
                                  <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                  <div className="mb-2 mt-4 text-lg font-medium">
                                    Premium Ativo
                                  </div>
                                  <p className="text-sm leading-tight text-amber-900 dark:text-amber-200">
                                    Acesse todos os recursos exclusivos do seu plano Premium.
                                  </p>
                                </a>
                              </NavigationMenuLink>
                            </li>
                            <li>
                              <NavigationMenuLink asChild>
                                <a
                                  className={cn(
                                    "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                  )}
                                  href="/settings?tab=premium"
                                >
                                  <div className="text-sm font-medium leading-none">
                                    Substituição de URLs
                                  </div>
                                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                    Atualize URLs em massa em seus conteúdos.
                                  </p>
                                </a>
                              </NavigationMenuLink>
                            </li>
                            <li>
                              <NavigationMenuLink asChild>
                                <a
                                  className={cn(
                                    "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                  )}
                                  href="/duplicates/contents"
                                >
                                  <div className="text-sm font-medium leading-none">
                                    Conteúdos Duplicados
                                  </div>
                                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                    Encontre e gerencie conteúdos duplicados.
                                  </p>
                                </a>
                              </NavigationMenuLink>
                            </li>
                            <li>
                              <NavigationMenuLink asChild>
                                <a
                                  className={cn(
                                    "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                  )}
                                  href="/bulk-upload"
                                >
                                  <div className="text-sm font-medium leading-none">
                                    Upload em Massa
                                  </div>
                                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                    Importe múltiplos conteúdos de uma vez.
                                  </p>
                                </a>
                              </NavigationMenuLink>
                            </li>
                          </ul>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    </NavigationMenuList>
                  </NavigationMenu>
                </CardFooter>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="logs" className="space-y-4">
            <LogsPanel />
          </TabsContent>
        </Tabs>
      </div>
      
      <ProgressDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="Substituição de URLs"
        progress={progress}
        processedCount={processedCount}
        totalCount={totalCount}
        uploadedCount={{
          total: isComplete ? updatedCount : processedCount,
          movies: 0,
          series: 0,
          tv: 0,
        }}
        duplicatesFound={0}
        isComplete={isComplete}
        onClose={handleCloseDialog}
        isError={error.isError}
        errorMessage={error.message}
      />
    </DashboardLayout>
  );
};

export default Settings;
