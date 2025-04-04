
/**
 * Utilitário para detectar e gerenciar itens duplicados nas tabelas
 */

import { toast } from 'sonner';

/**
 * Verifica se há itens duplicados em um array baseado em uma propriedade específica
 * @param items - Array de itens a verificar
 * @param property - Nome da propriedade para comparar (ex: 'Nome')
 * @returns Array de objetos duplicados agrupados
 */
export const findDuplicates = <T extends Record<string, any>>(
  items: T[],
  property: keyof T
): { value: string; items: T[] }[] => {
  const duplicatesMap = new Map<string, T[]>();

  // Agrupar itens por propriedade
  items.forEach(item => {
    const value = String(item[property] || '').trim().toLowerCase();
    if (!value) return; // Ignorar valores vazios
    
    if (!duplicatesMap.has(value)) {
      duplicatesMap.set(value, []);
    }
    duplicatesMap.get(value)?.push(item);
  });

  // Filtrar apenas grupos com mais de um item (duplicados)
  const result: { value: string; items: T[] }[] = [];
  duplicatesMap.forEach((groupedItems, value) => {
    if (groupedItems.length > 1) {
      result.push({
        value,
        items: groupedItems
      });
    }
  });

  return result;
};

/**
 * Encontra episódios duplicados baseado em temporada, episódio e nome
 * @param items - Array de episódios a verificar
 * @returns Array de grupos duplicados
 */
export const findEpisodeDuplicates = <T extends Record<string, any>>(
  items: T[]
): { key: string; items: T[] }[] => {
  const duplicatesMap = new Map<string, T[]>();
  
  // Agrupar por temporada e episódio
  items.forEach(item => {
    if (!item.Nome || !item.Temporada || !item.Episódio) return;
    
    // Criar uma chave única: Temporada-Episódio-Nome
    const key = `T${item.Temporada}-E${item.Episódio}-${item.Nome.trim().toLowerCase()}`;
    
    if (!duplicatesMap.has(key)) {
      duplicatesMap.set(key, []);
    }
    duplicatesMap.get(key)?.push(item);
  });
  
  // Filtrar para retornar apenas os grupos com mais de um item
  const result: { key: string; items: T[] }[] = [];
  duplicatesMap.forEach((groupedItems, key) => {
    if (groupedItems.length > 1) {
      result.push({ key, items: groupedItems });
    }
  });
  
  return result;
};

/**
 * Verifica e exibe uma mensagem sobre duplicatas encontradas
 * @param items - Array de itens a verificar
 * @param property - Nome da propriedade para comparar
 * @param itemType - Tipo de item para mensagem (ex: 'conteúdo', 'episódio')
 * @returns true se duplicatas forem encontradas, false caso contrário
 */
export const checkAndNotifyDuplicates = <T extends Record<string, any>>(
  items: T[],
  property: keyof T,
  itemType: string
): boolean => {
  const duplicates = findDuplicates(items, property);
  
  if (duplicates.length > 0) {
    // Formatação da mensagem sobre duplicatas
    const duplicatesList = duplicates.map(group => 
      `"${group.value}" (${group.items.length} itens)`
    ).join(', ');
    
    toast.warning(
      `Duplicatas de ${itemType} encontradas`, 
      {
        description: `Os seguintes ${itemType}s aparecem mais de uma vez: ${duplicatesList}`,
        duration: 5000,
      }
    );
    
    console.warn(`Duplicatas encontradas para ${itemType}:`, duplicates);
    return true;
  }
  
  return false;
};

/**
 * Verifica e exibe uma mensagem sobre episódios duplicados
 * @param items - Array de episódios a verificar
 * @returns true se duplicatas forem encontradas, false caso contrário
 */
export const checkAndNotifyEpisodeDuplicates = <T extends Record<string, any>>(
  items: T[]
): boolean => {
  const duplicates = findEpisodeDuplicates(items);
  
  if (duplicates.length > 0) {
    // Formatação da mensagem sobre duplicatas
    const duplicatesList = duplicates.map(group => 
      `"${group.key}" (${group.items.length} itens)`
    ).join(', ');
    
    toast.warning(
      `Duplicatas de episódios encontradas`,
      {
        description: `Os seguintes episódios aparecem mais de uma vez: ${duplicatesList}`,
        duration: 5000,
      }
    );
    
    console.warn(`Duplicatas de episódios encontradas:`, duplicates);
    return true;
  }
  
  return false;
};

/**
 * Compara dois arrays de itens e identifica novos duplicados
 * @param prevItems - Array anterior de itens
 * @param newItems - Novo array de itens
 * @param property - Nome da propriedade para comparar
 * @returns Array de novos itens duplicados
 */
export const findNewDuplicates = <T extends Record<string, any>>(
  prevItems: T[],
  newItems: T[],
  property: keyof T
): T[] => {
  // Função auxiliar para gerar mapa de itens por valor de propriedade
  const createValueMap = (items: T[]): Map<string, T[]> => {
    const map = new Map<string, T[]>();
    
    items.forEach(item => {
      const value = String(item[property] || '').trim().toLowerCase();
      if (!value) return;
      
      if (!map.has(value)) {
        map.set(value, []);
      }
      map.get(value)?.push(item);
    });
    
    return map;
  };
  
  // Mapa de valores nos itens anteriores
  const prevValueMap = createValueMap(prevItems);
  
  // Encontrar novos itens que duplicam valores existentes
  const result: T[] = [];
  
  newItems.forEach(item => {
    const value = String(item[property] || '').trim().toLowerCase();
    if (!value) return;
    
    const existingItems = prevValueMap.get(value) || [];
    
    // Se já existia pelo menos um item com o mesmo valor
    if (existingItems.length > 0) {
      // Verificar se este é um item novo (não presente no array anterior)
      const itemExists = existingItems.some(existingItem => 
        existingItem.id === item.id
      );
      
      if (!itemExists) {
        result.push(item);
      }
    }
  });
  
  return result;
};
