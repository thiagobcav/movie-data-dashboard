
import React, { useState } from 'react';
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
import { useConfig } from '@/context/ConfigContext';
import { toast } from 'sonner';
import { LockIcon } from 'lucide-react';

const ConfigPanel = () => {
  const config = useConfig();
  const [apiToken, setApiToken] = useState(config.apiToken);
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [tableIds, setTableIds] = useState({ ...config.tableIds });

  const handleSaveConfig = () => {
    // Atualizar token da API
    config.updateApiToken(apiToken);
    
    // Atualizar URL base
    config.updateBaseUrl(baseUrl);
    
    // Atualizar IDs das tabelas
    Object.keys(tableIds).forEach((key) => {
      const tableKey = key as keyof typeof tableIds;
      if (tableIds[tableKey] !== config.tableIds[tableKey]) {
        config.updateTableId(tableKey, tableIds[tableKey]);
      }
    });
    
    toast.success('Configurações salvas com sucesso');
  };

  const handleTableIdChange = (
    key: keyof typeof tableIds,
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

  return (
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
  );
};

export default ConfigPanel;
