
import React, { useState } from 'react';
import { useConfig } from '../../context/ConfigContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const ConfigPanel: React.FC = () => {
  const config = useConfig();
  
  const [apiToken, setApiToken] = useState(config.apiToken);
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [tableIds, setTableIds] = useState({
    contents: config.tableIds.contents,
    episodes: config.tableIds.episodes,
    banners: config.tableIds.banners,
    categories: config.tableIds.categories,
    users: config.tableIds.users,
    sessions: config.tableIds.sessions,
    platforms: config.tableIds.platforms,
  });

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isHttpApi = baseUrl.startsWith('http:');
  const showMixedContentWarning = isHttps && isHttpApi;

  const handleSaveApiConfig = () => {
    if (showMixedContentWarning) {
      toast.info('URL HTTP detectada. Um serviço de proxy será usado para todas as requisições.');
    }
    
    config.updateApiToken(apiToken);
    config.updateBaseUrl(baseUrl);
    toast.success('Configurações da API atualizadas');
  };

  const handleSaveTableId = (table: keyof typeof tableIds) => {
    config.updateTableId(table, tableIds[table]);
    toast.success(`ID da tabela ${table} atualizado`);
  };

  const tableLabelMap: Record<keyof typeof tableIds, string> = {
    contents: 'Conteúdos',
    episodes: 'Episódios',
    banners: 'Banners',
    categories: 'Categorias',
    users: 'Usuários',
    sessions: 'Sessões',
    platforms: 'Plataformas',
  };

  return (
    <Card className="w-full max-w-4xl mx-auto animate-fade-in">
      <CardHeader>
        <CardTitle>Configurações</CardTitle>
        <CardDescription>
          Configure os parâmetros da API Baserow e os IDs das tabelas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="api">
          <TabsList className="mb-6">
            <TabsTrigger value="api">API Baserow</TabsTrigger>
            <TabsTrigger value="tables">IDs das Tabelas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiToken">Token da API</Label>
                <Input
                  id="apiToken"
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="Token da API Baserow"
                />
                <p className="text-sm text-muted-foreground">
                  Token de autenticação para acessar a API do Baserow
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="baseUrl">URL Base da API</Label>
                <Input
                  id="baseUrl"
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="URL base da API Baserow"
                />
                <p className="text-sm text-muted-foreground">
                  Por padrão: https://api.baserow.io/api
                </p>
              </div>
              
              <Button onClick={handleSaveApiConfig}>
                Salvar Configurações da API
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="tables" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {Object.entries(tableLabelMap).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`table-${key}`}>{label}</Label>
                  <div className="flex space-x-2">
                    <Input
                      id={`table-${key}`}
                      value={tableIds[key as keyof typeof tableIds]}
                      onChange={(e) => 
                        setTableIds(prev => ({
                          ...prev,
                          [key]: e.target.value
                        }))
                      }
                      placeholder={`ID da tabela ${label}`}
                    />
                    <Button 
                      onClick={() => handleSaveTableId(key as keyof typeof tableIds)}
                      size="sm"
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Todas as configurações são salvas localmente no navegador
        </p>
      </CardFooter>
    </Card>
  );
};

export default ConfigPanel;
