
// Tipagem para itens do M3U
interface M3uItem {
  title: string;
  url: string;
  group?: string;
  thumbnail?: string;
}

/**
 * Faz o parse de um arquivo M3U para extrair itens de mídia
 * @param content Conteúdo do arquivo M3U
 * @returns Array de itens M3U
 */
export const parseM3u = (content: string): M3uItem[] => {
  // Adicionar log detalhado
  console.log('Iniciando parse de arquivo M3U');
  
  try {
    // Normalizar as quebras de linha
    const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Verificar se o arquivo começa com #EXTM3U
    if (!normalizedContent.trim().startsWith('#EXTM3U')) {
      console.log('Arquivo não inicia com #EXTM3U, tentando fazer parse mesmo assim');
    }
    
    const lines = normalizedContent.split('\n');
    const items: M3uItem[] = [];
    
    let currentItem: Partial<M3uItem> = {};
    let inExtInfo = false;
    
    // Log do número de linhas
    console.log(`Arquivo contém ${lines.length} linhas`);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Pular linhas vazias e comentários simples
      if (!line || (line.startsWith('#') && !line.startsWith('#EXTINF') && !line.startsWith('#EXTVLCOPT'))) {
        continue;
      }
      
      // Processar linha de informações
      if (line.startsWith('#EXTINF')) {
        try {
          inExtInfo = true;
          currentItem = {};
          
          // Extrair título
          const titleMatch = line.match(/,(.+)$/);
          if (titleMatch) {
            currentItem.title = titleMatch[1].trim();
          }
          
          // Extrair grupo
          const groupMatch = line.match(/group-title="([^"]+)"/);
          if (groupMatch) {
            currentItem.group = groupMatch[1].trim();
          }
          
          // Extrair thumbnail
          const thumbnailMatch = line.match(/tvg-logo="([^"]+)"/);
          if (thumbnailMatch) {
            currentItem.thumbnail = thumbnailMatch[1].trim();
          }
        } catch (error) {
          console.error(`Erro ao processar linha de EXTINF (${i}): ${line}`, error);
        }
      }
      // Processar linha de opções VLC (pode conter thumbnail)
      else if (line.startsWith('#EXTVLCOPT')) {
        try {
          const thumbnailMatch = line.match(/http-user-agent="([^"]+)"/);
          if (thumbnailMatch && currentItem) {
            // Alguns arquivos usam http-user-agent para armazenar o thumbnail
            const possibleUrl = thumbnailMatch[1].trim();
            if (possibleUrl.startsWith('http') && possibleUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
              currentItem.thumbnail = possibleUrl;
            }
          }
        } catch (error) {
          console.error(`Erro ao processar linha EXTVLCOPT (${i}): ${line}`, error);
        }
      }
      // Processar URL
      else if (inExtInfo && (line.startsWith('http') || line.startsWith('https') || line.startsWith('rtmp'))) {
        try {
          if (currentItem.title) {
            currentItem.url = line;
            items.push(currentItem as M3uItem);
            
            // Reset
            inExtInfo = false;
            currentItem = {};
          }
        } catch (error) {
          console.error(`Erro ao processar URL (${i}): ${line}`, error);
        }
      }
      // Processar formatos não-padrão
      else if (!line.startsWith('#')) {
        // Alguns arquivos M3U não usam o formato padrão, então tentamos interpretar
        try {
          // Verificar se parece uma URL
          if (line.match(/^(http|https|rtmp|rtsp|mms|ftp)/i)) {
            // Se estamos processando um item, adicionar a URL
            if (inExtInfo && currentItem.title) {
              currentItem.url = line;
              items.push(currentItem as M3uItem);
              
              // Reset
              inExtInfo = false;
              currentItem = {};
            } 
            // Caso contrário, criar um novo item com a URL como título
            else {
              items.push({
                title: line.split('/').pop() || 'Sem título',
                url: line
              });
            }
          }
        } catch (error) {
          console.error(`Erro ao processar linha não-padrão (${i}): ${line}`, error);
        }
      }
    }
    
    // Log do número de itens encontrados
    console.log(`Foram encontrados ${items.length} itens no arquivo M3U`);
    
    return items;
  } catch (error) {
    console.error('Erro ao fazer parse do arquivo M3U:', error);
    throw new Error(`Erro ao processar arquivo M3U: ${(error as Error).message}`);
  }
};
