
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ConfigPanel from '@/components/dashboard/ConfigPanel';

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações de conexão com o Baserow
          </p>
        </div>

        <ConfigPanel />
      </div>
    </DashboardLayout>
  );
};

export default Settings;
