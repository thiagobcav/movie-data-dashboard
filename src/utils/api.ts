
import axios, { AxiosRequestConfig } from 'axios';
import { TableIds } from '@/context/ConfigContext';

// Armazenar logs para depuração
const apiLogs: LogEntry[] = [];
const MAX_LOGS = 100;

export interface LogEntry {
  timestamp: string;
  type: 'info' | 'error' | 'warning' | 'success';
  message: string;
  details?: any;
}

export const addLog = (type: LogEntry['type'], message: string, details?: any) => {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    type,
    message,
    details
  };
  
  apiLogs.unshift(entry);
  
  // Manter um número máximo de logs
  if (apiLogs.length > MAX_LOGS) {
    apiLogs.pop();
  }
  
  // Não logar detalhes sensíveis no console
  console[type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log'](
    `[${entry.timestamp}] ${message}`
  );
  
  return entry;
};

export const getLogs = () => {
  return [...apiLogs];
};

export const clearLogs = () => {
  apiLogs.length = 0;
};

interface ApiConfig {
  apiToken: string;
  baseUrl: string;
  tableIds: TableIds;
}

// Modifica o comportamento do console.log para evitar exposição de Headers
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

const sanitizeLogArgs = (args: any[]) => {
  return args.map(arg => {
    // Se for um objeto, verificar se tem propriedades sensíveis
    if (arg && typeof arg === 'object') {
      // Se for um objeto Headers, substituir
      if (arg.constructor && arg.constructor.name === 'Headers') {
        return '[Headers: ***]';
      }
      
      // Se for um objeto com headers ou authorization
      if (arg.headers || arg.Authorization || arg.authorization) {
        const sanitized = { ...arg };
        if (sanitized.headers) sanitized.headers = '[Headers: ***]';
        if (sanitized.Authorization) sanitized.Authorization = '***';
        if (sanitized.authorization) sanitized.authorization = '***';
        return sanitized;
      }
    }
    
    // Se for uma string com token
    if (typeof arg === 'string' && 
        (arg.includes('Authorization: Bearer') || 
         arg.includes('token=') || 
         arg.includes('apiKey='))) {
      return arg.replace(/Bearer [a-zA-Z0-9._-]+/g, 'Bearer ***')
               .replace(/token=[a-zA-Z0-9._-]+/g, 'token=***')
               .replace(/apiKey=[a-zA-Z0-9._-]+/g, 'apiKey=***');
    }
    
    return arg;
  });
};

// Sobrescrever funções do console
console.log = function(...args) {
  originalConsoleLog.apply(console, sanitizeLogArgs(args));
};

console.info = function(...args) {
  originalConsoleInfo.apply(console, sanitizeLogArgs(args));
};

console.warn = function(...args) {
  originalConsoleWarn.apply(console, sanitizeLogArgs(args));
};

console.error = function(...args) {
  originalConsoleError.apply(console, sanitizeLogArgs(args));
};

export const createApi = (config: ApiConfig) => {
  const instance = axios.create({
    baseURL: config.baseUrl,
    headers: {
      'Authorization': `Token ${config.apiToken}`,
      'Content-Type': 'application/json',
    },
  });

  // Interceptar requisições para adicionar logs sem expor dados sensíveis
  instance.interceptors.request.use(
    (config) => {
      // Removemos header da mensagem de log
      const sanitizedConfig = { ...config };
      delete sanitizedConfig.headers;
      
      addLog('info', `Requisição iniciada: ${config.method?.toUpperCase()} ${config.url}`, {
        method: config.method,
        url: config.url,
        params: config.params
      });
      
      return config;
    },
    (error) => {
      addLog('error', `Erro ao preparar requisição: ${error.message}`, {
        error: error.message
      });
      return Promise.reject(error);
    }
  );

  // Interceptar respostas para registrar logs
  instance.interceptors.response.use(
    (response) => {
      addLog('success', `Requisição bem-sucedida: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        statusText: response.statusText,
        dataLength: response.data ? JSON.stringify(response.data).length : 0
      });
      
      return response;
    },
    (error) => {
      const errorMessage = error.response 
        ? `Erro na requisição: ${error.response.status} ${error.response.statusText}`
        : `Erro na requisição: ${error.message}`;
        
      addLog('error', errorMessage, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        url: error.config?.url,
        method: error.config?.method
      });
      
      return Promise.reject(error);
    }
  );

  // Métodos da API
  return {
    getTableRows: async (table: string, page: number = 1, size: number = 10, queryParams?: string) => {
      try {
        const tableId = config.tableIds[table as keyof TableIds];
        const url = `/database/rows/table/${tableId}/?page=${page}&size=${size}${queryParams ? `&${queryParams}` : ''}`;
        const response = await instance.get(url);
        return response.data;
      } catch (error: any) {
        console.error(`Error fetching ${table} table rows:`, error);
        addLog('error', `Erro ao buscar linhas da tabela ${table}: ${error.message}`);
        throw error;
      }
    },

    searchTable: async (table: string, searchTerm: string, page: number = 1, size: number = 10) => {
      try {
        const tableId = config.tableIds[table as keyof TableIds];
        const response = await instance.get(`/database/rows/table/${tableId}/?search=${encodeURIComponent(searchTerm)}&page=${page}&size=${size}`);
        return response.data;
      } catch (error: any) {
        console.error(`Error searching ${table} table:`, error);
        addLog('error', `Erro ao pesquisar na tabela ${table}: ${error.message}`);
        throw error;
      }
    },

    getRow: async (table: string, rowId: string) => {
      try {
        const tableId = config.tableIds[table as keyof TableIds];
        const response = await instance.get(`/database/rows/table/${tableId}/${rowId}/`);
        return response.data;
      } catch (error: any) {
        console.error(`Error fetching row ${rowId} from ${table} table:`, error);
        addLog('error', `Erro ao buscar linha ${rowId} da tabela ${table}: ${error.message}`);
        throw error;
      }
    },

    createRow: async (table: string, data: any) => {
      try {
        const tableId = config.tableIds[table as keyof TableIds];
        const response = await instance.post(`/database/rows/table/${tableId}/`, data);
        return response.data;
      } catch (error: any) {
        console.error(`Error creating row in ${table} table:`, error);
        addLog('error', `Erro ao criar linha na tabela ${table}: ${error.message}`);
        throw error;
      }
    },

    updateRow: async (table: string, rowId: string, data: any) => {
      try {
        const tableId = config.tableIds[table as keyof TableIds];
        const response = await instance.patch(`/database/rows/table/${tableId}/${rowId}/`, data);
        return response.data;
      } catch (error: any) {
        console.error(`Error updating row ${rowId} in ${table} table:`, error);
        addLog('error', `Erro ao atualizar linha ${rowId} na tabela ${table}: ${error.message}`);
        throw error;
      }
    },

    deleteRow: async (table: string, rowId: string) => {
      try {
        const tableId = config.tableIds[table as keyof TableIds];
        const response = await instance.delete(`/database/rows/table/${tableId}/${rowId}/`);
        return response.data;
      } catch (error: any) {
        console.error(`Error deleting row ${rowId} from ${table} table:`, error);
        addLog('error', `Erro ao deletar linha ${rowId} da tabela ${table}: ${error.message}`);
        throw error;
      }
    },
  };
};
