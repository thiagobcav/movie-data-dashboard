
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ConfigPanel from '@/components/dashboard/ConfigPanel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

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
          <Alert variant="warning" className="bg-amber-50 border-amber-200">
            <InfoIcon className="h-4 w-4 text-amber-600" />
            <AlertTitle>Atenção ao usar URLs HTTP</AlertTitle>
            <AlertDescription>
              Este site está rodando em HTTPS. Navegadores modernos bloqueiam requisições HTTP a partir de sites HTTPS por segurança.
              Para usar uma URL de API sem SSL (HTTP), você deve acessar este painel usando HTTP ou hospedar a API com HTTPS.
            </AlertDescription>
          </Alert>
        )}

        <ConfigPanel />
      </div>
    </DashboardLayout>
  );
};

export default Settings;
