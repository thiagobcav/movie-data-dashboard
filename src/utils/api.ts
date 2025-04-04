interface ApiConfig {
  apiToken: string;
  baseUrl: string;
  tableIds: {
    contents: string;
    episodes: string;
  };
}

/**
 * Creates an API client for interacting with Baserow.
 */
export const createApi = ({ apiToken, baseUrl, tableIds }: ApiConfig) => {
  const headers = {
    Authorization: `Token ${apiToken}`,
    "Content-Type": "application/json",
  };

  /**
   * Fetches rows from a specified table.
   */
  const getTableRows = async (
    tableType: "contents" | "episodes",
    page: number = 1,
    size: number = 100,
    extraParams: string = ""
  ) => {
    const tableId = tableIds[tableType];
    if (!tableId) {
      throw new Error(`Table ID for ${tableType} not configured`);
    }

    try {
      const response = await fetch(
        `${baseUrl}/api/database/rows/table/${tableId}?page=${page}&size=${size}&${extraParams}`,
        {
          method: "GET",
          headers: headers,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch rows from table ${tableType}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching rows from table ${tableType}:`, error);
      throw error;
    }
  };

  /**
   * Creates a new row in the specified table.
   */
  const createRow = async (
    tableType: "contents" | "episodes",
    data: any
  ) => {
    const tableId = tableIds[tableType];
    if (!tableId) {
      throw new Error(`Table ID for ${tableType} not configured`);
    }

    try {
      const response = await fetch(
        `${baseUrl}/api/database/rows/table/${tableId}/`,
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorBody = await response.json();
        console.error("Error creating row:", errorBody);
        throw new Error(
          `Failed to create row in table ${tableType}: ${response.statusText} - ${JSON.stringify(
            errorBody
          )}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error creating row in table ${tableType}:`, error);
      throw error;
    }
  };

  /**
   * Updates an existing row in the specified table.
   */
  const updateRow = async (
    tableType: "contents" | "episodes",
    rowId: number,
    data: any
  ) => {
    const tableId = tableIds[tableType];
    if (!tableId) {
      throw new Error(`Table ID for ${tableType} not configured`);
    }

    try {
      const response = await fetch(
        `${baseUrl}/api/database/rows/table/${tableId}/${rowId}/`,
        {
          method: "PATCH",
          headers: headers,
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update row ${rowId} in table ${tableType}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(
        `Error updating row ${rowId} in table ${tableType}:`,
        error
      );
      throw error;
    }
  };

  /**
   * Delete an existing row in the specified table.
   */
  const deleteRow = async (tableType: "contents" | "episodes", rowId: number) => {
    const tableId = tableIds[tableType];
    if (!tableId) {
      throw new Error(`Table ID for ${tableType} not configured`);
    }

    try {
      const response = await fetch(
        `${baseUrl}/api/database/rows/table/${tableId}/${rowId}/`,
        {
          method: "DELETE",
          headers: headers,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete row ${rowId} in table ${tableType}: ${response.statusText}`
        );
      }

      return response.status === 204;
    } catch (error) {
      console.error(
        `Error deleting row ${rowId} in table ${tableType}:`,
        error
      );
      throw error;
    }
  };
  
  /**
   * Update URLs for specific items in a table
   */
  const updateItemUrls = async (
    tableType: 'contents' | 'episodes',
    sourceUrl: string,
    targetUrl: string,
    callbacks: {
      onProgress?: (processed: number, total: number) => void;
      onComplete?: (updatedCount: number) => void;
      onError?: (error: Error) => void;
      shouldCancel?: () => boolean;
    } = {}
  ) => {
    try {
      const tableId = tableIds[tableType];
      if (!tableId) {
        throw new Error(`Table ID for ${tableType} not configured`);
      }
      
      let allItems: any[] = [];
      let page = 1;
      const pageSize = 200;
      let hasMore = true;
      
      // Field to check based on table type
      const urlField = tableType === 'episodes' ? 'Fonte' : 'Fonte';
      
      // First, get all items that contain the source URL
      while (hasMore) {
        const response = await getTableRows(tableType, page, pageSize);
        const items = response.results;
        
        if (!items || items.length === 0) {
          hasMore = false;
          break;
        }
        
        const filteredItems = items.filter(item => 
          item[urlField] && item[urlField].includes(sourceUrl)
        );
        
        allItems.push(...filteredItems);
        
        if (items.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }
      
      console.log(`Found ${allItems.length} ${tableType} with URLs containing "${sourceUrl}"`);
      
      if (allItems.length === 0) {
        callbacks.onComplete?.(0);
        return 0;
      }
      
      let updatedCount = 0;
      
      // Process all matched items
      for (let i = 0; i < allItems.length; i++) {
        if (callbacks.shouldCancel?.()) {
          console.log('URL update operation cancelled');
          callbacks.onComplete?.(updatedCount);
          return updatedCount;
        }
        
        const item = allItems[i];
        const sourceFieldValue = item[urlField];
        
        if (sourceFieldValue) {
          // Standard URL replacement
          const updatedUrl = sourceFieldValue.replace(sourceUrl, targetUrl);
          
          // Also update Link field if it exists and contains the source URL
          const updates: any = { [urlField]: updatedUrl };
          
          // Check if Link field exists and contains sourceUrl
          if (item.Link && item.Link.includes(sourceUrl)) {
            updates.Link = item.Link.replace(sourceUrl, targetUrl);
          }
          
          await updateRow(tableType, item.id, updates);
          updatedCount++;
        }
        
        callbacks.onProgress?.(i + 1, allItems.length);
      }
      
      callbacks.onComplete?.(updatedCount);
      return updatedCount;
    } catch (error) {
      console.error('Error updating URLs:', error);
      callbacks.onError?.(error as Error);
      throw error;
    }
  };

  return {
    getTableRows,
    createRow,
    updateRow,
    deleteRow,
    updateItemUrls,
  };
};

export default createApi;
