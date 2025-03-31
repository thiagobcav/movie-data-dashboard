
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ConfigPanel from '@/components/dashboard/ConfigPanel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const Settings = () => {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações de conexão com o Baserow
          </p>
        </div>

        {isHttps && (
          <Alert className="bg-amber-50 border-amber-200">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertTitle>Suporte para URLs HTTP via Proxy</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Este site está rodando em HTTPS. Para URLs de API com HTTP, um serviço de proxy será 
                automaticamente utilizado para contornar as restrições de segurança dos navegadores.
              </p>
              <p className="font-medium">
                Informações sobre o proxy:
              </p>
              <ul className="list-disc list-inside">
                <li>O proxy agora suporta todos os métodos HTTP (GET, POST, PATCH, DELETE)</li>
                <li>Os dados são processados de forma segura pelo proxy</li>
                <li>Para maior segurança, considere usar uma API com HTTPS</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <ConfigPanel />
      </div>
    </DashboardLayout>
  );
};

export default Settings;
