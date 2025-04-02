
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'sonner';

export interface TableIds {
  contents: string;
  episodes: string;
  banners: string;
  categories: string;
  users: string;
  sessions: string;
  platforms: string;
}

export interface Config {
  apiToken: string;
  baseUrl: string;
  tableIds: TableIds;
}

interface ConfigContextType {
  config: Config;
  updateConfig: (config: Config) => void;
  updateApiToken: (token: string) => void;
  updateBaseUrl: (url: string) => void;
  updateTableId: (table: keyof TableIds, id: string) => void;
}

const defaultConfig: Config = {
  apiToken: '',
  baseUrl: 'https://api.baserow.io/api',
  tableIds: {
    contents: '',
    episodes: '',
    banners: '',
    categories: '',
    users: '',
    sessions: '',
    platforms: '',
  }
};

// Storage key for localStorage
const STORAGE_KEY = 'baserow-config';

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<Config>(defaultConfig);

  useEffect(() => {
    // Load configuration from localStorage
    const storedConfig = localStorage.getItem(STORAGE_KEY);
    
    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig);
        setConfig({
          apiToken: parsedConfig.apiToken || '',
          baseUrl: parsedConfig.baseUrl || 'https://api.baserow.io/api',
          tableIds: parsedConfig.tableIds || defaultConfig.tableIds,
        });
      } catch (error) {
        console.error('Failed to parse stored config:', error);
        toast.error('Erro ao carregar configurações salvas');
      }
    }
  }, []);

  const saveToLocalStorage = (newConfig: Config) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
  };

  const updateConfig = (newConfig: Config) => {
    setConfig(newConfig);
    saveToLocalStorage(newConfig);
  };

  const updateApiToken = (token: string) => {
    const newConfig = {
      ...config,
      apiToken: token
    };
    setConfig(newConfig);
    saveToLocalStorage(newConfig);
    toast.success('Token da API atualizado');
  };

  const updateBaseUrl = (url: string) => {
    const newConfig = {
      ...config,
      baseUrl: url
    };
    setConfig(newConfig);
    saveToLocalStorage(newConfig);
    toast.success('URL base atualizada');
  };

  const updateTableId = (table: keyof TableIds, id: string) => {
    const newTableIds = { ...config.tableIds, [table]: id };
    const newConfig = {
      ...config,
      tableIds: newTableIds
    };
    setConfig(newConfig);
    saveToLocalStorage(newConfig);
    toast.success(`ID da tabela ${table} atualizado`);
  };

  const value: ConfigContextType = {
    config,
    updateConfig,
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
