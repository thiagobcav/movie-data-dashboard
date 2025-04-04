import React, { useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseM3U } from '@/utils/m3uParser';
import { useConfig } from '@/context/ConfigContext';
import { createApi } from '@/utils/api';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Upload, CheckCircle, Lock, Film, Tv, Laptop } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadialProgress } from '@/components/ui/RadialProgress';
import { processBatches } from '@/utils/batchProcessor';
import { ProgressDialog } from '@/components/ui/progress-dialog';

type ContentType = 'movie' | 'series' | 'tv' | 'unknown';

interface ParsedItem {
  id?: number;
  title: string;
  url: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  groupTitle?: string;
  type?: ContentType;
  status?: 'pending' | 'processed' | 'error' | 'duplicate' | 'uploaded';
  error?: string;
}

interface SeriesData {
  [key: string]: {
    name: string;
    episodes: ParsedItem[];
  };
}

function BulkUpload() {
  const { user, isPremiumFeatureAvailable } = useAuth();
  const config = useConfig();
  const [m3uUrl, setM3uUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadTab, setUploadTab] = useState<'url' | 'file'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewTab, setViewTab] = useState<ContentType | 'all'>('all');
  const [uploadedCount, setUploadedCount] = useState({ total: 0, movies: 0, series: 0, tv: 0 });
  const [seriesData, setSeriesData] = useState<SeriesData>({});
  const [duplicatesFound, setDuplicatesFound] = useState(0);
  const [urlError, setUrlError] = useState('');
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const isPremium = user?.Premium === true;
  
  const resetState = () => {
    setParsedItems([]);
    setProcessedCount(0);
    setUploadProgress(0);
    setUploadedCount({ total: 0, movies: 0, series: 0, tv: 0 });
    setSeriesData({});
    setDuplicatesFound(0);
    setUrlError('');
    setIsUploadComplete(false);
    setUploadError('');
  };
  
  const filterItemsByType = (items: ParsedItem[]): ParsedItem[] => {
    if (viewTab === 'all') return items;
    return items.filter(item => item.type === viewTab);
  };
  
  const countItemsByType = (items: ParsedItem[]): Record<ContentType | 'all', number> => {
    const counts: Record<ContentType | 'all', number> = {
      'all': items.length,
      'movie': 0,
      'series': 0,
      'tv': 0,
      'unknown': 0
    };
    
    items.forEach(item => {
      if (item.type) {
        counts[item.type] += 1;
      } else {
        counts.unknown += 1;
      }
    });
    
    return counts;
  };
  
  const fetchM3UFromUrl = async () => {
    resetState();
    setIsLoading(true);
    
    if (!m3uUrl) {
      setUrlError('Por favor, informe uma URL válida');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch(m3uUrl);
      if (!response.ok) {
        throw new Error('Erro ao obter o arquivo: ' + response.statusText);
      }
      
      const content = await response.text();
      processM3UContent(content);
    } catch (error) {
      console.error('Erro ao obter o M3U da URL:', error);
      toast.error('Erro ao obter arquivo M3U da URL');
      setIsLoading(false);
      setUrlError((error as Error).message || 'Erro ao obter o M3U');
    }
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    resetState();
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        processM3UContent(content);
      } else {
        toast.error('Erro ao ler o arquivo');
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      toast.error('Erro ao ler o arquivo');
      setIsLoading(false);
    };
    
    reader.readAsText(file);
  };
  
  const processM3UContent = (content: string) => {
    try {
      const items = parseM3U(content);
      
      if (!items || items.length === 0) {
        toast.error('Nenhum item encontrado no arquivo M3U');
        setIsLoading(false);
        return;
      }
      
      const itemsWithStatus = items.map((item) => ({
        ...item,
        status: 'pending' as const
      }));
      
      const seriesItems: SeriesData = {};
      itemsWithStatus
        .filter(item => item.type === 'series')
        .forEach(item => {
          let seriesName = item.title;
          
          const seriesMatch = item.title.match(/^(.+?)(?:\s+[Ss](\d+)[Ee](\d+)|\s+[Tt](\d+)[Ee](\d+)|\s+-\s+[Ee]p(?:is[óo]dio)?\s*\d+)/i);
          if (seriesMatch) {
            seriesName = seriesMatch[1].trim();
          }
          
          if (!seriesItems[seriesName]) {
            seriesItems[seriesName] = {
              name: seriesName,
              episodes: []
            };
          }
          
          seriesItems[seriesName].episodes.push(item);
        });
      
      setParsedItems(itemsWithStatus);
      setSeriesData(seriesItems);
      toast.success(`${itemsWithStatus.length} itens encontrados no arquivo M3U`);
    } catch (error) {
      console.error('Erro ao processar arquivo M3U:', error);
      toast.error('Erro ao processar arquivo M3U');
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkItemExists = async (item: ParsedItem, type: 'contents' | 'episodes', nameField = 'Nome'): Promise<boolean> => {
    if (!config.apiToken) {
      toast.error('API Token não configurado');
      return false;
    }
    
    try {
      const api = createApi({
        apiToken: config.apiToken,
        baseUrl: config.baseUrl,
        tableIds: config.tableIds
      });
      
      const encodedFilter = encodeURIComponent(JSON.stringify({
        filter_type: "AND",
        filters: [{
          type: "equal",
          field: nameField,
          value: item.title
        }],
        groups: []
      }));
      
      const response = await api.getTableRows(
        type, 
        1, 
        1, 
        `filters=${encodedFilter}`
      );
      
      return (response?.results?.length || 0) > 0;
    } catch (error) {
      console.error(`Erro ao verificar existência do item:`, error);
      return false;
    }
  };
  
  const createContentItem = async (item: ParsedItem): Promise<number | null> => {
    if (!config.apiToken) {
      toast.error('API Token não configurado');
      return null;
    }
    
    try {
      const api = createApi({
        apiToken: config.apiToken,
        baseUrl: config.baseUrl,
        tableIds: config.tableIds
      });
      
      // Try to secure URL for image and source
      const securedSourceUrl = api.secureUrl(item.url || '');
      const securedLogoUrl = api.secureUrl(item.tvgLogo || '');
      
      const contentData = {
        Nome: item.title || 'Sem título',
        Fonte: securedSourceUrl,
        Link: securedSourceUrl, // Ensure Link field is populated with the URL
        Cover: securedLogoUrl,
        Capa: securedLogoUrl,
        Categoria: item.groupTitle || 'Outros',
        Tipo: item.type === 'series' ? 'Série' : item.type === 'tv' ? 'TV' : 'Filme',
        Views: 0,
        Idioma: 'DUB'
      };
      
      console.log('Enviando dados de conteúdo:', contentData);
      const response = await api.createRow('contents', contentData);
      return response.id;
    } catch (error) {
      console.error('Erro ao criar conteúdo:', error);
      throw error;
    }
  };
  
  const createEpisodeItem = async (seriesId: number, item: ParsedItem): Promise<number | null> => {
    if (!config.apiToken) {
      toast.error('API Token não configurado');
      return null;
    }
    
    try {
      const api = createApi({
        apiToken: config.apiToken,
        baseUrl: config.baseUrl,
        tableIds: config.tableIds
      });
      
      let season = 1;
      let episode = 1;
      
      const tEpMatch = item.title.match(/T(\d+)\|EP(\d+)/i);
      if (tEpMatch) {
        season = parseInt(tEpMatch[1], 10);
        episode = parseInt(tEpMatch[2], 10);
      } else {
        const seasonEpisodeMatch = item.title.match(/[Ss](\d+)[Ee](\d+)|[Tt](\d+)[Ee](\d+)/);
        if (seasonEpisodeMatch) {
          season = parseInt(seasonEpisodeMatch[1] || seasonEpisodeMatch[3], 10);
          episode = parseInt(seasonEpisodeMatch[2] || seasonEpisodeMatch[4], 10);
        }
      }
      
      // Try to secure URLs
      const securedSourceUrl = api.secureUrl(item.url || '');
      const securedLogoUrl = api.secureUrl(item.tvgLogo || '');
      
      const episodeData = {
        Nome: item.title || 'Sem título',
        Fonte: securedSourceUrl,
        Link: securedSourceUrl, // Ensure Link field is populated with the URL
        Capa: securedLogoUrl,
        Temporada: season,
        Episódio: episode,
        Série: seriesId
      };
      
      console.log('Enviando dados de episódio:', episodeData);
      const response = await api.createRow('episodes', episodeData);
      return response.id;
    } catch (error) {
      console.error('Erro ao criar episódio:', error);
      throw error;
    }
  };
  
  const processSeriesItem = async (seriesName: string, items: ParsedItem[]): Promise<number> => {
    let successCount = 0;
    
    try {
      const seriesExists = await checkItemExists({ title: seriesName } as ParsedItem, 'contents');
      
      if (seriesExists) {
        const updatedItems = [...parsedItems];
        items.forEach(episode => {
          const index = updatedItems.findIndex(item => item.url === episode.url);
          if (index !== -1) {
            updatedItems[index].status = 'duplicate';
          }
        });
        setParsedItems(updatedItems);
        setDuplicatesFound(prev => prev + items.length);
        return 0;
      }
      
      const firstEpisode = items[0];
      const seriesData = {
        title: seriesName,
        url: firstEpisode.url,
        tvgLogo: firstEpisode.tvgLogo,
        groupTitle: firstEpisode.groupTitle || 'Séries',
        type: 'series' as ContentType
      };
      
      const seriesId = await createContentItem(seriesData);
      
      if (!seriesId) {
        throw new Error('Falha ao criar série');
      }
      
      await processBatches(
        items,
        async (episode) => {
          try {
            const updatedItems = [...parsedItems];
            const index = updatedItems.findIndex(item => item.url === episode.url);
            if (index !== -1) {
              updatedItems[index].status = 'processed';
              setParsedItems(updatedItems);
            }
            
            const episodeId = await createEpisodeItem(seriesId, episode);
            
            const finalItems = [...parsedItems];
            const finalIndex = finalItems.findIndex(item => item.url === episode.url);
            if (finalIndex !== -1) {
              finalItems[finalIndex].status = 'uploaded';
              setParsedItems(finalItems);
            }
            
            successCount++;
            return episodeId;
          } catch (error) {
            console.error(`Erro ao processar episódio ${episode.title}:`, error);
            
            const errorItems = [...parsedItems];
            const errorIndex = errorItems.findIndex(item => item.url === episode.url);
            if (errorIndex !== -1) {
              errorItems[errorIndex].status = 'error';
              errorItems[errorIndex].error = (error as Error).message;
              setParsedItems(errorItems);
            }
            
            return null;
          }
        },
        {
          batchSize: 3,
          delayMs: 300,
          onProgress: (processed) => {
            setProcessedCount(prev => prev + 1);
            const totalProgress = Math.floor((processedCount + processed) * 100 / parsedItems.length);
            setUploadProgress(totalProgress);
          }
        }
      );
      
      setUploadedCount(prev => ({
        ...prev,
        total: prev.total + successCount,
        series: prev.series + 1
      }));
      
      return successCount;
    } catch (error) {
      console.error(`Erro ao processar série ${seriesName}:`, error);
      
      const updatedItems = [...parsedItems];
      items.forEach(episode => {
        const index = updatedItems.findIndex(item => item.url === episode.url);
        if (index !== -1) {
          updatedItems[index].status = 'error';
          updatedItems[index].error = (error as Error).message;
        }
      });
      setParsedItems(updatedItems);
      return 0;
    }
  };
  
  const processItem = async (item: ParsedItem): Promise<boolean> => {
    try {
      const updatedItems = [...parsedItems];
      const index = updatedItems.findIndex(i => i.url === item.url);
      if (index !== -1) {
        updatedItems[index].status = 'processed';
        setParsedItems(updatedItems);
      }
      
      const exists = await checkItemExists(item, 'contents');
      
      if (exists) {
        const dupeItems = [...parsedItems];
        const dupeIndex = dupeItems.findIndex(i => i.url === item.url);
        if (dupeIndex !== -1) {
          dupeItems[dupeIndex].status = 'duplicate';
          setParsedItems(dupeItems);
        }
        setDuplicatesFound(prev => prev + 1);
        return false;
      }
      
      await createContentItem(item);
      
      const finalItems = [...parsedItems];
      const finalIndex = finalItems.findIndex(i => i.url === item.url);
      if (finalIndex !== -1) {
        finalItems[finalIndex].status = 'uploaded';
        setParsedItems(finalItems);
      }
      
      if (item.type === 'movie') {
        setUploadedCount(prev => ({
          ...prev,
          total: prev.total + 1,
          movies: prev.movies + 1
        }));
      } else if (item.type === 'tv') {
        setUploadedCount(prev => ({
          ...prev,
          total: prev.total + 1,
          tv: prev.tv + 1
        }));
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao processar item:', error);
      
      const errorItems = [...parsedItems];
      const errorIndex = errorItems.findIndex(i => i.url === item.url);
      if (errorIndex !== -1) {
        errorItems[errorIndex].status = 'error';
        errorItems[errorIndex].error = (error as Error).message;
        setParsedItems(errorItems);
      }
      
      return false;
    }
  };
  
  const startUpload = async () => {
    if (!isPremiumFeatureAvailable('bulk-upload')) {
      toast.error('Este recurso é exclusivo para usuários Premium');
      return;
    }
    
    if (parsedItems.length === 0) {
      toast.error('Nenhum item para processar');
      return;
    }
    
    setUploading(true);
    setProcessedCount(0);
    setUploadProgress(0);
    setUploadedCount({ total: 0, movies: 0, series: 0, tv: 0 });
    setDuplicatesFound(0);
    setIsProgressDialogOpen(true);
    setIsUploadComplete(false);
    setUploadError('');
    
    try {
      const seriesNames = Object.keys(seriesData);
      
      await processBatches(
        seriesNames,
        async (seriesName) => {
          return await processSeriesItem(seriesName, seriesData[seriesName].episodes);
        },
        {
          batchSize: 1,
          delayMs: 500,
          onProgress: (processed, total) => {
            const totalProgress = Math.floor(processed * 50 / total);
            setUploadProgress(totalProgress);
          }
        }
      );
      
      const nonSeriesItems = parsedItems.filter(item => 
        item.type !== 'series' && item.status === 'pending'
      );
      
      await processBatches(
        nonSeriesItems,
        async (item) => {
          try {
            const result = await processItem(item);
            setProcessedCount(prev => prev + 1);
            return result;
          } catch (error) {
            console.error(`Erro ao processar item ${item.title}:`, error);
            return false;
          }
        },
        {
          batchSize: 3,
          delayMs: 300,
          onProgress: (processed, total) => {
            const baseProgress = seriesNames.length > 0 ? 50 : 0;
            const additionalProgress = Math.floor(processed * (100 - baseProgress) / total);
            setUploadProgress(baseProgress + additionalProgress);
          }
        }
      );
      
      setIsUploadComplete(true);
      toast.success(`Upload concluído. ${uploadedCount.total} itens adicionados. ${duplicatesFound} duplicados ignorados.`);
    } catch (error) {
      console.error('Erro durante o upload:', error);
      setUploadError((error as Error).message || 'Erro desconhecido durante o upload');
      toast.error(`Erro durante o upload: ${(error as Error).message}`);
    } finally {
      setUploading(false);
    }
  };
  
  if (!isPremium) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Upload em Massa</h1>
            <p className="text-muted-foreground">
              Importe conteúdos em massa a partir de arquivos M3U
            </p>
          </div>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Acesso Restrito</AlertTitle>
            <AlertDescription>
              Este recurso é exclusivo para usuários Premium. Faça upgrade da sua conta para acessar.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="text-amber-500" size={20} />
                <span>Recurso Premium</span>
              </CardTitle>
              <CardDescription>
                O Upload em Massa permite importar conteúdos diretamente de arquivos M3U, 
                separando automaticamente filmes, séries e canais de TV.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full mb-4">
                    <Upload className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Importe Conteúdos em Massa</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Adicione centenas de conteúdos de uma só vez, com detecção automática 
                    de tipo, verificação de duplicatas e organização inteligente.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="premium" disabled>
                Disponível Apenas para Contas Premium
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  const itemCounts = countItemsByType(parsedItems);
  const filteredItems = filterItemsByType(parsedItems);
  
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Upload em Massa</h1>
          <p className="text-muted-foreground">
            Importe conteúdos em massa a partir de arquivos M3U
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload size={20} className="text-primary" />
              <span>Importar Arquivo M3U</span>
              <Badge variant="premium" className="ml-2">Premium</Badge>
            </CardTitle>
            <CardDescription>
              Importe conteúdos de um arquivo M3U por URL ou enviando um arquivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={uploadTab} onValueChange={(v) => setUploadTab(v as 'url' | 'file')}>
              <TabsList className="mb-4">
                <TabsTrigger value="url">URL Remota</TabsTrigger>
                <TabsTrigger value="file">Arquivo Local</TabsTrigger>
              </TabsList>
              
              <TabsContent value="url" className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    placeholder="https://exemplo.com/playlist.m3u"
                    value={m3uUrl}
                    onChange={(e) => {
                      setM3uUrl(e.target.value);
                      if (urlError) setUrlError('');
                    }}
                    disabled={isLoading || uploading}
                  />
                  <Button 
                    onClick={fetchM3UFromUrl} 
                    disabled={isLoading || uploading || !m3uUrl}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? 'Carregando...' : 'Carregar M3U'}
                  </Button>
                </div>
                
                {urlError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{urlError}</AlertDescription>
                  </Alert>
                )}
              </TabsContent>
              
              <TabsContent value="file" className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept=".m3u,.m3u8,text/plain"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      disabled={isLoading || uploading}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {parsedItems.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Conteúdos Encontrados</CardTitle>
                <CardDescription>
                  {parsedItems.length} itens encontrados no arquivo M3U
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex flex-col items-center justify-center bg-muted p-4 rounded-lg">
                    <span className="text-3xl font-bold">{itemCounts.all}</span>
                    <span className="text-sm text-muted-foreground">Total</span>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-muted p-4 rounded-lg">
                    <span className="text-3xl font-bold">{itemCounts.movie}</span>
                    <span className="text-sm text-muted-foreground">Filmes</span>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-muted p-4 rounded-lg">
                    <span className="text-3xl font-bold">{itemCounts.series}</span>
                    <span className="text-sm text-muted-foreground">Séries</span>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-muted p-4 rounded-lg">
                    <span className="text-3xl font-bold">{itemCounts.tv}</span>
                    <span className="text-sm text-muted-foreground">TV</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <Tabs defaultValue="all" value={viewTab} onValueChange={(v) => setViewTab(v as ContentType | 'all')}>
                    <TabsList>
                      <TabsTrigger value="all">Todos ({itemCounts.all})</TabsTrigger>
                      <TabsTrigger value="movie">
                        <Film size={16} className="mr-1" />
                        Filmes ({itemCounts.movie})
                      </TabsTrigger>
                      <TabsTrigger value="series">
                        <Laptop size={16} className="mr-1" />
                        Séries ({itemCounts.series})
                      </TabsTrigger>
                      <TabsTrigger value="tv">
                        <Tv size={16} className="mr-1" />
                        TV ({itemCounts.tv})
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.slice(0, 100).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>
                            {item.type === 'movie' && <Badge variant="outline">Filme</Badge>}
                            {item.type === 'series' && <Badge variant="outline">Série</Badge>}
                            {item.type === 'tv' && <Badge variant="outline">TV</Badge>}
                            {item.type === 'unknown' && <Badge variant="outline">Desconhecido</Badge>}
                          </TableCell>
                          <TableCell>{item.groupTitle || '-'}</TableCell>
                          <TableCell>
                            {item.status === 'pending' && <Badge variant="outline">Aguardando</Badge>}
                            {item.status === 'processed' && <Badge variant="secondary">Processando</Badge>}
                            {item.status === 'uploaded' && <Badge variant="success">Enviado</Badge>}
                            {item.status === 'duplicate' && <Badge variant="warning">Duplicado</Badge>}
                            {item.status === 'error' && <Badge variant="destructive">Erro</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredItems.length > 100 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Mostrando 100 de {filteredItems.length} itens
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="w-full sm:w-auto">
                  <Button 
                    onClick={startUpload} 
                    disabled={isLoading || uploading || parsedItems.length === 0}
                    className="w-full sm:w-auto"
                  >
                    {uploading ? 'Processando...' : 'Iniciar Upload'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </>
        )}
        
        <ProgressDialog
          open={isProgressDialogOpen}
          onOpenChange={setIsProgressDialogOpen}
          title={isUploadComplete ? "Upload Concluído" : "Processando Conteúdos"}
          progress={uploadProgress}
          processedCount={processedCount}
          totalCount={parsedItems.length}
          uploadedCount={uploadedCount}
          duplicatesFound={duplicatesFound}
          isComplete={isUploadComplete}
          onClose={() => setIsProgressDialogOpen(false)}
          isError={!!uploadError}
          errorMessage={uploadError}
        />
      </div>
    </DashboardLayout>
  );
}

export default BulkUpload;
