
import { useConfig } from '@/context/ConfigContext';
import { createApi } from '@/utils/api';

export const useConfiguredApi = () => {
  const { config } = useConfig();
  
  const api = createApi({
    apiToken: config.apiToken,
    baseUrl: config.baseUrl,
    tableIds: config.tableIds,
  });
  
  return {
    api,
    config,
    isConfigured: !!config.apiToken
  };
};
