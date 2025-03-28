
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'sonner';

interface ConfigContextType {
  apiToken: string;
  baseUrl: string;
  tableIds: {
    contents: string;
    episodes: string;
    banners: string;
    categories: string;
    users: string;
    sessions: string;
    platforms: string;
  };
  updateApiToken: (token: string) => void;
  updateBaseUrl: (url: string) => void;
  updateTableId: (table: keyof ConfigContextType['tableIds'], id: string) => void;
}

const defaultConfig = {
  apiToken: 'WCLaVXyfPFvPmK7PTtSDUjcYKTZY3bbl',
  baseUrl: 'https://api.baserow.io/api',
  tableIds: {
    contents: '',
    episodes: '',
    banners: '',
    categories: '',
    users: '304448',
    sessions: '',
    platforms: '',
  }
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiToken, setApiToken] = useState<string>(defaultConfig.apiToken);
  const [baseUrl, setBaseUrl] = useState<string>(defaultConfig.baseUrl);
  const [tableIds, setTableIds] = useState(defaultConfig.tableIds);

  useEffect(() => {
    // Load configuration from localStorage
    const storedConfig = localStorage.getItem('baserow-config');
    
    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig);
        setApiToken(parsedConfig.apiToken || defaultConfig.apiToken);
        setBaseUrl(parsedConfig.baseUrl || defaultConfig.baseUrl);
        setTableIds({
          ...defaultConfig.tableIds,
          ...parsedConfig.tableIds
        });
      } catch (error) {
        console.error('Failed to parse stored config:', error);
        toast.error('Erro ao carregar configurações salvas');
      }
    }
  }, []);

  const saveToLocalStorage = (newConfig: Partial<typeof defaultConfig>) => {
    const currentConfig = {
      apiToken,
      baseUrl,
      tableIds
    };
    
    const updatedConfig = {
      ...currentConfig,
      ...newConfig
    };
    
    localStorage.setItem('baserow-config', JSON.stringify(updatedConfig));
  };

  const updateApiToken = (token: string) => {
    setApiToken(token);
    saveToLocalStorage({ apiToken: token });
    toast.success('Token da API atualizado');
  };

  const updateBaseUrl = (url: string) => {
    setBaseUrl(url);
    saveToLocalStorage({ baseUrl: url });
    toast.success('URL base atualizada');
  };

  const updateTableId = (table: keyof typeof tableIds, id: string) => {
    setTableIds(prev => {
      const newTableIds = { ...prev, [table]: id };
      saveToLocalStorage({ tableIds: newTableIds });
      return newTableIds;
    });
    toast.success(`ID da tabela ${table} atualizado`);
  };

  const value = {
    apiToken,
    baseUrl,
    tableIds,
    updateApiToken,
    updateBaseUrl,
    updateTableId
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
