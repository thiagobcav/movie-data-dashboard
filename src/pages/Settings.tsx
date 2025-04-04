
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
import { Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const Settings = () => {
  const config = useConfig();
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
