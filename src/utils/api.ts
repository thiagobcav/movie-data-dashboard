
import { toast } from 'sonner';

export type TableType = 
  | 'contents' 
  | 'episodes' 
  | 'banners' 
  | 'categories' 
  | 'users' 
  | 'sessions' 
  | 'platforms';

interface ApiConfig {
  apiToken: string;
  baseUrl: string;
  tableIds: Record<TableType, string>;
}

export class BaserowApi {
  private apiToken: string;
  private baseUrl: string;
  private tableIds: Record<TableType, string>;

  constructor(config: ApiConfig) {
    this.apiToken = config.apiToken;
    this.baseUrl = config.baseUrl;
    this.tableIds = config.tableIds;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    if (!this.apiToken) {
      toast.error('API Token não configurado');
      throw new Error('API Token não configurado');
    }

    const url = `${this.baseUrl}/${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Authorization': `Token ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      toast.error(`Erro na requisição: ${(error as Error).message}`);
      throw error;
    }
  }

  async getTableRows(tableType: TableType, page = 1, pageSize = 20) {
    const tableId = this.tableIds[tableType];
    
    if (!tableId) {
      toast.error(`ID da tabela ${tableType} não configurado`);
      throw new Error(`Table ID for ${tableType} not configured`);
    }

    return this.request(`database/rows/table/${tableId}/?user_field_names=true&page=${page}&size=${pageSize}`);
  }

  async createRow(tableType: TableType, data: Record<string, any>) {
    const tableId = this.tableIds[tableType];
    
    if (!tableId) {
      toast.error(`ID da tabela ${tableType} não configurado`);
      throw new Error(`Table ID for ${tableType} not configured`);
    }

    return this.request(`database/rows/table/${tableId}/?user_field_names=true`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRow(tableType: TableType, rowId: number, data: Record<string, any>) {
    const tableId = this.tableIds[tableType];
    
    if (!tableId) {
      toast.error(`ID da tabela ${tableType} não configurado`);
      throw new Error(`Table ID for ${tableType} not configured`);
    }

    return this.request(`database/rows/table/${tableId}/${rowId}/?user_field_names=true`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteRow(tableType: TableType, rowId: number) {
    const tableId = this.tableIds[tableType];
    
    if (!tableId) {
      toast.error(`ID da tabela ${tableType} não configurado`);
      throw new Error(`Table ID for ${tableType} not configured`);
    }

    return this.request(`database/rows/table/${tableId}/${rowId}/`, {
      method: 'DELETE',
    });
  }
}

export const createApi = (config: ApiConfig) => {
  return new BaserowApi(config);
};
