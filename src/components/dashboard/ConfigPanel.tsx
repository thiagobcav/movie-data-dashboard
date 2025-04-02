
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useConfig, TableIds } from '@/context/ConfigContext';
import { encrypt, decrypt } from '@/utils/encryption';
import { toast } from 'sonner';
import { LockIcon, RefreshCcw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getLogs, clearLogs, LogEntry } from '@/utils/api';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BadgeExtended } from '@/components/ui/badge-extended';

const ConfigPanel = () => {
  const { config, updateConfig } = useConfig();
  const { user } = useAuth();
  const [apiToken, setApiToken] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [tableIds, setTableIds] = useState<TableIds>({
    contents: '',
    episodes: '',
    banners: '',
    categories: '',
    users: '',
    sessions: '',
    platforms: '',
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState('general');

  // Load stored configuration on component mount
  useEffect(() => {
    if (config) {
      setApiToken(config.apiToken || '');
      setBaseUrl(config.baseUrl || '');
      setTableIds(config.tableIds || {
        contents: '',
        episodes: '',
        banners: '',
        categories: '',
        users: '',
        sessions: '',
        platforms: '',
      });
    }
  }, [config]);

  const handleSaveConfig = () => {
    const newConfig = {
      apiToken,
      baseUrl,
      tableIds,
    };
    
    // Update the global config
    updateConfig(newConfig);
    
    toast.success('Configurações salvas com sucesso');
  };

  const handleTableIdChange = (
    key: keyof TableIds,
    value: string
  ) => {
    setTableIds((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Masked API token for display
  const maskedToken = apiToken ? 
    apiToken.substring(0, 4) + '•'.repeat(Math.max(0, apiToken.length - 8)) + apiToken.substring(apiToken.length - 4) 
    : '';

  // Refresh logs
  const refreshLogs = () => {
    setLogs(getLogs());
  };

  // Clear all logs
  const handleClearLogs = () => {
    clearLogs();
    setLogs([]);
    toast.success('Logs limpos com sucesso');
  };

  // Load logs when accessing the logs tab
  useEffect(() => {
    if (activeTab === 'logs') {
      refreshLogs();
    }
  }, [activeTab]);

  // Get background color for log type
  const getLogBadgeVariant = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'destructive';
      case 'warning': return 'warning';
      case 'success': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <Tabs defaultValue="general" onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="general">Configurações Gerais</TabsTrigger>
        <TabsTrigger value="logs">Logs do Sistema</TabsTrigger>
      </TabsList>
      
      <TabsContent value="general">
        <Card>
          <CardHeader>
            <CardTitle>Configurações da API</CardTitle>
            <CardDescription>
              Configure sua conexão com o Baserow para gerenciar seus dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <LockIcon size={16} className="text-amber-500" />
                <label htmlFor="apiToken" className="text-sm font-medium">
                  Token da API (Protegido)
                </label>
              </div>
              <Input
                id="apiToken"
                type="password"
                placeholder="Token de autenticação para acessar a API"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
              />
              {maskedToken && (
                <p className="text-xs text-muted-foreground">
                  Token atual: {maskedToken}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <LockIcon size={16} className="text-amber-500" />
                <label htmlFor="baseUrl" className="text-sm font-medium">
                  URL da API (Protegido)
                </label>
              </div>
              <Input
                id="baseUrl"
                type="url"
                placeholder="URL base da API (ex: https://api.baserow.io/api)"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-medium">IDs das Tabelas</h3>
              <p className="text-xs text-muted-foreground">
                Configure os IDs das tabelas utilizadas no sistema
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="contentsTableId" className="text-sm font-medium">
                    Tabela de Conteúdos
                  </label>
                  <Input
                    id="contentsTableId"
                    placeholder="ID da tabela de conteúdos"
                    value={tableIds.contents}
                    onChange={(e) => handleTableIdChange('contents', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="episodesTableId" className="text-sm font-medium">
                    Tabela de Episódios
                  </label>
                  <Input
                    id="episodesTableId"
                    placeholder="ID da tabela de episódios"
                    value={tableIds.episodes}
                    onChange={(e) => handleTableIdChange('episodes', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="bannersTableId" className="text-sm font-medium">
                    Tabela de Banners
                  </label>
                  <Input
                    id="bannersTableId"
                    placeholder="ID da tabela de banners"
                    value={tableIds.banners}
                    onChange={(e) => handleTableIdChange('banners', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="categoriesTableId" className="text-sm font-medium">
                    Tabela de Categorias
                  </label>
                  <Input
                    id="categoriesTableId"
                    placeholder="ID da tabela de categorias"
                    value={tableIds.categories}
                    onChange={(e) => handleTableIdChange('categories', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="usersTableId" className="text-sm font-medium">
                    Tabela de Usuários
                  </label>
                  <Input
                    id="usersTableId"
                    placeholder="ID da tabela de usuários"
                    value={tableIds.users}
                    onChange={(e) => handleTableIdChange('users', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="sessionsTableId" className="text-sm font-medium">
                    Tabela de Sessões
                  </label>
                  <Input
                    id="sessionsTableId"
                    placeholder="ID da tabela de sessões"
                    value={tableIds.sessions}
                    onChange={(e) => handleTableIdChange('sessions', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="platformsTableId" className="text-sm font-medium">
                    Tabela de Plataformas
                  </label>
                  <Input
                    id="platformsTableId"
                    placeholder="ID da tabela de plataformas"
                    value={tableIds.platforms}
                    onChange={(e) => handleTableIdChange('platforms', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSaveConfig}
              className="w-full sm:w-auto"
            >
              Salvar Configurações
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="logs">
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Logs do Sistema</CardTitle>
              <CardDescription>
                Visualize os logs de operações e depuração da aplicação
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshLogs}
              >
                <RefreshCcw size={16} className="mr-2" />
                Atualizar
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleClearLogs}
              >
                Limpar Logs
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] w-full rounded border p-4 bg-muted/20">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum log registrado ainda
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log, index) => (
                    <div 
                      key={index} 
                      className="p-3 rounded border bg-card shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                        <BadgeExtended variant={getLogBadgeVariant(log.type)} className="w-fit">
                          {log.type.toUpperCase()}
                        </BadgeExtended>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{log.message}</p>
                      {log.details && (
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ConfigPanel;
