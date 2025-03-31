
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
  private proxyUrl: string = "https://script.google.com/macros/s/AKfycbxaLLyJi-kmEfk5rvnuQEUj00dsjYnrN5DoJr_5ez8H7nqKgBZLvfcgt04DTsf9aSGITA/exec";

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

    const directUrl = `${this.baseUrl}/${endpoint}`;
    const isHttpUrl = this.baseUrl.startsWith('http:');
    const isMixedContent = typeof window !== 'undefined' && 
        window.location.protocol === 'https:' && 
        isHttpUrl;
    
    try {
      // Determine if we need to use the proxy
      if (isMixedContent) {
        // Log that we're using the proxy
        console.log('Usando proxy para contornar restrições de conteúdo misto');
        
        // For GET requests
        if (!options.method || options.method === 'GET') {
          // Encode the full URL for the proxy
          const fullUrl = `${directUrl}`;
          const encodedUrl = encodeURIComponent(fullUrl);
          const proxyRequestUrl = `${this.proxyUrl}?token=${this.apiToken}&url=${encodedUrl}`;
          
          console.log('Enviando requisição para o proxy:', proxyRequestUrl);
          
          const response = await fetch(proxyRequestUrl);
          
          if (!response.ok) {
            throw new Error(`HTTP error via proxy: ${response.status}`);
          }
          
          return await response.json();
        } 
        // For non-GET requests (POST, PATCH, DELETE, etc.)
        else {
          // Currently, this proxy may not support other methods directly
          // You may need to extend the proxy script to handle these
          toast.error('Métodos diferentes de GET não são suportados pelo proxy atual');
          throw new Error('Métodos diferentes de GET não são suportados pelo proxy atual');
        }
      } 
      // Direct request (no proxy needed)
      else {
        console.log('Enviando requisição direta para:', directUrl);
        console.log('Método:', options.method || 'GET');
        console.log('Corpo:', options.body ? JSON.parse(options.body as string) : 'Sem corpo');
        
        const defaultOptions: RequestInit = {
          headers: {
            'Authorization': `Token ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        };
        
        const response = await fetch(directUrl, {
          ...defaultOptions,
          ...options,
          headers: {
            ...defaultOptions.headers,
            ...(options.headers || {}),
          },
        });

        console.log('Status da resposta:', response.status);
        
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          let errorData: any = {};
          
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json().catch(() => ({}));
          } else {
            const text = await response.text().catch(() => '');
            errorData = { error: text || `HTTP error ${response.status}` };
          }
          
          console.error('API error details:', errorData);
          
          if (errorData.errors) {
            const errorDetails = Object.entries(errorData.errors)
              .map(([field, messages]) => `${field}: ${messages}`)
              .join(', ');
            throw new Error(`Erro de validação: ${errorDetails}`);
          }
          
          throw new Error(errorData.error || errorData.detail || `HTTP error ${response.status}`);
        }

        // Verifica se a resposta contém JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        }
        
        // Se não for JSON, retorna o texto
        return await response.text();
      }
    } catch (error) {
      console.error('API request failed:', error);
      
      if ((error as Error).message.includes('Failed to fetch') ||
          (error as Error).message.includes('NetworkError') ||
          (error as Error).message.includes('Network request failed')) {
        
        if (isMixedContent) {
          toast.error('Erro ao acessar API via proxy.', {
            description: 'Verifique se o URL e token estão corretos.'
          });
        } else {
          toast.error('Erro de conexão com a API.', {
            description: 'Verifique se a URL da API está correta e se o servidor está acessível.'
          });
        }
      } else {
        toast.error(`Erro na requisição: ${(error as Error).message}`);
      }
      
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

    // Certifique-se de que os dados estão no formato correto
    const cleanedData = this.sanitizeData(data);

    return this.request(`database/rows/table/${tableId}/?user_field_names=true`, {
      method: 'POST',
      body: JSON.stringify(cleanedData),
    });
  }

  async updateRow(tableType: TableType, rowId: number, data: Record<string, any>) {
    const tableId = this.tableIds[tableType];
    
    if (!tableId) {
      toast.error(`ID da tabela ${tableType} não configurado`);
      throw new Error(`Table ID for ${tableType} not configured`);
    }

    // Certifique-se de que os dados estão no formato correto
    const cleanedData = this.sanitizeData(data);

    return this.request(`database/rows/table/${tableId}/${rowId}/?user_field_names=true`, {
      method: 'PATCH',
      body: JSON.stringify(cleanedData),
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

  // Função para limpar e validar os dados antes de enviar para a API
  private sanitizeData(data: Record<string, any>): Record<string, any> {
    const cleanedData = { ...data };
    
    // Remover campos `id` e `order` que não devem ser enviados
    delete cleanedData.id;
    delete cleanedData.order;
    
    // Garante que as datas estão no formato YYYY-MM-DD
    if (cleanedData.Pagamento) {
      try {
        // Se já for uma string no formato YYYY-MM-DD, não faz nada
        if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanedData.Pagamento)) {
          const date = new Date(cleanedData.Pagamento);
          if (isNaN(date.getTime())) {
            throw new Error('Data inválida');
          }
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          cleanedData.Pagamento = `${year}-${month}-${day}`;
        }
      } catch (e) {
        console.error('Erro ao formatar data:', e);
        // Em caso de erro, deixa como está
      }
    }
    
    // Garante que campos numéricos sejam números
    if ('Dias' in cleanedData && typeof cleanedData.Dias !== 'number') {
      cleanedData.Dias = parseInt(cleanedData.Dias) || 0;
    }
    
    if ('Logins' in cleanedData && typeof cleanedData.Logins !== 'number') {
      cleanedData.Logins = parseInt(cleanedData.Logins) || 0;
    }
    
    // Certifique-se de que o IMEI seja uma string JSON válida
    if (cleanedData.IMEI && typeof cleanedData.IMEI === 'string') {
      try {
        // Verifica se já é um JSON válido
        JSON.parse(cleanedData.IMEI);
      } catch (e) {
        // Se não for um JSON válido, converte para um JSON válido
        cleanedData.IMEI = JSON.stringify({
          IMEI: cleanedData.IMEI,
          Dispositivo: ''
        });
      }
    }
    
    return cleanedData;
  }
}

export const createApi = (config: ApiConfig) => {
  return new BaserowApi(config);
};
