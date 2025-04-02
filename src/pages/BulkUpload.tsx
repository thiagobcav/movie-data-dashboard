
import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ButtonExtended } from '@/components/ui/button-extended';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useConfig } from '@/context/ConfigContext';
import { createApi, addLog } from '@/utils/api';
import { parseM3u } from '@/utils/m3uParser';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { 
  Upload, 
  Link as LinkIcon, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Lock,
  Info
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from 'framer-motion';

interface M3uItem {
  title: string;
  url: string;
  type: 'movie' | 'series' | 'tv' | 'unknown';
  group?: string;
  thumbnail?: string;
  serie?: string;
  episode?: string;
  season?: string;
}

interface ProcessingStats {
  total: number;
  processed: number;
  skipped: number;
  errors: number;
  success: number;
  movies: number;
  series: number;
  tv: number;
  unknown: number;
}

const initialStats: ProcessingStats = {
  total: 0,
  processed: 0,
  skipped: 0,
  errors: 0,
  success: 0,
  movies: 0,
  series: 0,
  tv: 0,
  unknown: 0
};

const BulkUpload: React.FC = () => {
  const { config } = useConfig();
  const { user } = useAuth();
  const isPremium = user?.Premium === true;
  
  const [activeTab, setActiveTab] = useState('url');
  const [isProcessing, setIsProcessing] = useState(false);
  const [m3uUrl, setM3uUrl] = useState('');
  const [m3uContent, setM3uContent] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [items, setItems] = useState<M3uItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<M3uItem[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [stats, setStats] = useState<ProcessingStats>(initialStats);
  const [error, setError] = useState<string | null>(null);
  const [processingLog, setProcessingLog] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reset form when tab changes
  useEffect(() => {
    setM3uUrl('');
    setM3uContent('');
    setUploadedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [activeTab]);
  
  // Filter items based on selected type
  useEffect(() => {
    if (items.length === 0) {
      setFilteredItems([]);
      return;
    }
    
    if (filterType === 'all') {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter(item => item.type === filterType));
    }
  }, [items, filterType]);
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setError(null);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setM3uContent(event.target.result as string);
        }
      };
      reader.onerror = () => {
        setError('Erro ao ler o arquivo');
      };
      reader.readAsText(file);
    }
  };
  
  // Process M3U content
  const processM3uContent = async (content: string) => {
    setItems([]);
    setFilteredItems([]);
    setStats(initialStats);
    setProcessingLog([]);
    
    try {
      addLog('info', 'Iniciando processamento de arquivo M3U');
      const parseResult = parseM3u(content);
      
      if (!parseResult || parseResult.length === 0) {
        addLog('error', 'O arquivo M3U está vazio ou em formato inválido');
        throw new Error("O arquivo M3U está vazio ou em formato inválido");
      }
      
      addLog('success', `Arquivo M3U processado com sucesso. ${parseResult.length} itens encontrados.`);
      
      // Process items to identify types
      const processedItems: M3uItem[] = parseResult.map(item => {
        const title = item.title || '';
        const url = item.url || '';
        
        let type: M3uItem['type'] = 'unknown';
        let serie: string | undefined = undefined;
        let episode: string | undefined = undefined;
        let season: string | undefined = undefined;
        
        // Try to determine content type based on group, title, and URL patterns
        const group = item.group?.toLowerCase() || '';
        
        // Check if it's a TV channel
        if (
          group.includes('tv') || 
          group.includes('canal') || 
          group.includes('channel') ||
          title.includes('|TV|') ||
          title.includes('|CANAL|')
        ) {
          type = 'tv';
        } 
        // Check if it's a series episode
        else if (
          group.includes('serie') ||
          title.match(/S\d+E\d+/) || // S01E01 format
          title.match(/\s+E\d+/) ||  // E01 format
          title.match(/\s+T\d+/) ||  // T01 format
          title.includes('temporada') ||
          title.includes('episódio') ||
          title.includes('episodio') ||
          group.includes('series')
        ) {
          type = 'series';
          
          // Extract series name, episode and season if possible
          const seriesMatch = title.match(/^(.+?)(?:\s+[-|]\s+S\d+|E\d+|\s+T\d+|\s+Temporada|\s+Episodio|\s+Episódio)/i);
          if (seriesMatch) {
            serie = seriesMatch[1].trim();
          }
          
          // Extract season
          const seasonMatch = title.match(/S(\d+)|T(\d+)|Temporada\s+(\d+)/i);
          if (seasonMatch) {
            season = (seasonMatch[1] || seasonMatch[2] || seasonMatch[3]).padStart(2, '0');
          }
          
          // Extract episode
          const episodeMatch = title.match(/E(\d+)|Ep(?:isodio|isódio)\s+(\d+)/i);
          if (episodeMatch) {
            episode = (episodeMatch[1] || episodeMatch[2]).padStart(2, '0');
          }
        } 
        // Default to movie if not identified as TV or series
        else {
          type = 'movie';
        }
        
        return {
          ...item,
          type,
          serie,
          episode,
          season
        };
      });
      
      // Update stats
      const newStats = {
        total: processedItems.length,
        processed: 0,
        skipped: 0,
        errors: 0,
        success: 0,
        movies: processedItems.filter(i => i.type === 'movie').length,
        series: processedItems.filter(i => i.type === 'series').length,
        tv: processedItems.filter(i => i.type === 'tv').length,
        unknown: processedItems.filter(i => i.type === 'unknown').length
      };
      
      setStats(newStats);
      setItems(processedItems);
      
      return processedItems;
    } catch (error) {
      console.error('Erro ao processar arquivo M3U:', error);
      addLog('error', `Erro ao processar arquivo M3U: ${(error as Error).message}`);
      
      setError(`Erro ao processar arquivo M3U: ${(error as Error).message}`);
      return [];
    }
  };
  
  // Handle URL fetch
  const handleUrlFetch = async () => {
    if (!m3uUrl) {
      setError('Por favor, insira uma URL válida');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      addLog('info', `Buscando M3U da URL: ${m3uUrl}`);
      
      // Add proxy to bypass CORS if needed
      const proxyUrl = 'https://corsproxy.io/?';
      const response = await fetch(`${proxyUrl}${encodeURIComponent(m3uUrl)}`, {
        headers: {
          'Accept': 'text/plain, */*',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Falha ao buscar M3U: ${response.status} ${response.statusText}`);
      }
      
      const content = await response.text();
      
      if (!content || content.trim() === '') {
        throw new Error('O arquivo M3U está vazio');
      }
      
      addLog('success', 'Arquivo M3U obtido com sucesso da URL');
      
      // Process content
      await processM3uContent(content);
    } catch (error) {
      console.error('Erro ao buscar M3U:', error);
      addLog('error', `Erro ao buscar M3U: ${(error as Error).message}`);
      
      setError(`Erro ao buscar M3U: ${(error as Error).message}`);
      setItems([]);
      setFilteredItems([]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle file process
  const handleFileProcess = async () => {
    if (!m3uContent) {
      setError('Por favor, faça upload de um arquivo M3U válido');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await processM3uContent(m3uContent);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setError(`Erro ao processar arquivo: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle pasted content
  const handleContentProcess = async () => {
    if (!m3uContent) {
      setError('Por favor, cole o conteúdo M3U');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await processM3uContent(m3uContent);
    } catch (error) {
      console.error('Erro ao processar conteúdo:', error);
      setError(`Erro ao processar conteúdo: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Import content to database
  const handleImport = async () => {
    if (!config.apiToken || !config.tableIds.contents || !config.tableIds.episodes) {
      toast.error('Configure o token da API e os IDs das tabelas nas configurações');
      return;
    }
    
    if (items.length === 0) {
      toast.error('Nenhum item para importar');
      return;
    }
    
    setIsProcessing(true);
    const api = createApi({
      apiToken: config.apiToken,
      baseUrl: config.baseUrl,
      tableIds: config.tableIds,
    });
    
    const newStats = { ...stats, processed: 0, skipped: 0, errors: 0, success: 0 };
    setStats(newStats);
    
    // Clear previous log
    setProcessingLog([]);
    
    try {
      // Process items one by one to avoid overwhelming the API
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        newStats.processed++;
        
        try {
          // Check for duplicates first
          let isDuplicate = false;
          
          const log = `Processando ${i+1}/${items.length}: ${item.title}`;
          setProcessingLog(prev => [...prev, log]);
          
          if (item.type === 'series' && item.serie) {
            // For series, check if the series already exists
            const seriesName = item.serie;
            const searchResponse = await api.searchTable('contents', seriesName, 1, 5);
            
            if (searchResponse.results && searchResponse.results.length > 0) {
              // Check if this exact series exists
              const exactMatch = searchResponse.results.find(
                (r: any) => r.titulo?.toLowerCase() === seriesName.toLowerCase() && r.tipo === 'Serie'
              );
              
              if (exactMatch) {
                isDuplicate = true;
                
                // Series exists, so now check if this episode exists
                if (item.season && item.episode) {
                  const episodeSearchResponse = await api.searchTable(
                    'episodes', 
                    `${seriesName} S${item.season}E${item.episode}`,
                    1, 
                    5
                  );
                  
                  if (episodeSearchResponse.results && episodeSearchResponse.results.length === 0) {
                    // Episode doesn't exist, so we'll add it
                    isDuplicate = false;
                    
                    const episodeData = {
                      titulo: `${seriesName} S${item.season}E${item.episode}`,
                      serie: seriesName,
                      temporada: item.season,
                      episodio: item.episode,
                      link: item.url,
                      conteudo_id: exactMatch.id
                    };
                    
                    await api.createRow('episodes', episodeData);
                    newStats.success++;
                    
                    const successLog = `✅ Episódio adicionado: ${episodeData.titulo}`;
                    setProcessingLog(prev => [...prev, successLog]);
                  } else {
                    newStats.skipped++;
                    const skipLog = `⏭️ Episódio já existe: ${seriesName} S${item.season}E${item.episode}`;
                    setProcessingLog(prev => [...prev, skipLog]);
                  }
                }
              }
            }
            
            // If the series doesn't exist, create it
            if (!isDuplicate) {
              const seriesData = {
                titulo: seriesName,
                tipo: 'Serie',
                poster: item.thumbnail || '',
                categoria: item.group || 'Séries',
                link: ''
              };
              
              const newSeries = await api.createRow('contents', seriesData);
              
              if (newSeries && item.season && item.episode) {
                const episodeData = {
                  titulo: `${seriesName} S${item.season}E${item.episode}`,
                  serie: seriesName,
                  temporada: item.season,
                  episodio: item.episode,
                  link: item.url,
                  conteudo_id: newSeries.id
                };
                
                await api.createRow('episodes', episodeData);
              }
              
              newStats.success++;
              const successLog = `✅ Série e episódio adicionados: ${seriesName}`;
              setProcessingLog(prev => [...prev, successLog]);
            }
          } else if (item.type === 'movie' || item.type === 'tv') {
            // For movies and TV, check if content already exists
            const searchResponse = await api.searchTable('contents', item.title, 1, 5);
            
            if (searchResponse.results && searchResponse.results.length > 0) {
              // Check for exact match
              const exactMatch = searchResponse.results.find(
                (r: any) => r.titulo?.toLowerCase() === item.title.toLowerCase()
              );
              
              if (exactMatch) {
                isDuplicate = true;
                newStats.skipped++;
                const skipLog = `⏭️ Conteúdo já existe: ${item.title}`;
                setProcessingLog(prev => [...prev, skipLog]);
              }
            }
            
            if (!isDuplicate) {
              const contentData = {
                titulo: item.title,
                tipo: item.type === 'movie' ? 'Filme' : 'TV',
                poster: item.thumbnail || '',
                categoria: item.group || (item.type === 'movie' ? 'Filmes' : 'TV'),
                link: item.url
              };
              
              await api.createRow('contents', contentData);
              newStats.success++;
              const successLog = `✅ ${item.type === 'movie' ? 'Filme' : 'Canal TV'} adicionado: ${item.title}`;
              setProcessingLog(prev => [...prev, successLog]);
            }
          }
        } catch (error) {
          console.error(`Erro ao processar item ${i}:`, error);
          newStats.errors++;
          const errorLog = `❌ Erro ao processar: ${item.title} - ${(error as Error).message}`;
          setProcessingLog(prev => [...prev, errorLog]);
        }
        
        // Update stats as we go
        setStats({ ...newStats });
      }
      
      toast.success(`Importação concluída: ${newStats.success} adicionados, ${newStats.skipped} ignorados`);
    } catch (error) {
      console.error('Erro durante a importação:', error);
      toast.error(`Erro durante a importação: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
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
          
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="border-b border-amber-200 dark:border-amber-800/40">
              <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <Lock className="h-5 w-5" />
                Recurso Premium
              </CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-400">
                Este recurso está disponível apenas para usuários Premium
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg text-center space-y-4 border border-amber-200 dark:border-amber-800/40">
                <Lock className="h-12 w-12 mx-auto text-amber-500" />
                <h3 className="text-xl font-semibold text-amber-800 dark:text-amber-300">Acesso Restrito</h3>
                <p className="text-amber-700 dark:text-amber-400">
                  O Upload em Massa permite importar conteúdos diretamente de arquivos M3U, 
                  separando automaticamente filmes, séries e canais de TV.
                </p>
                <ButtonExtended variant="premium" className="mt-4" disabled>
                  Recurso Premium
                </ButtonExtended>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Upload em Massa</h1>
          <p className="text-muted-foreground">
            Importe conteúdos em massa a partir de arquivos M3U
          </p>
        </div>
        
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Card>
              <CardHeader>
                <CardTitle>Fonte do Conteúdo</CardTitle>
                <CardDescription>
                  Selecione como deseja carregar seu arquivo M3U
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="url" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="url">URL</TabsTrigger>
                    <TabsTrigger value="file">Arquivo</TabsTrigger>
                    <TabsTrigger value="paste">Colar</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="url" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="m3uUrl">URL do arquivo M3U</Label>
                      <div className="flex gap-2">
                        <Input
                          id="m3uUrl"
                          placeholder="https://exemplo.com/lista.m3u"
                          value={m3uUrl}
                          onChange={(e) => setM3uUrl(e.target.value)}
                          disabled={isProcessing}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleUrlFetch} 
                      disabled={isProcessing || !m3uUrl}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="mr-2 h-4 w-4" />
                          Buscar da URL
                        </>
                      )}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="file" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="m3uFile">Arquivo M3U</Label>
                      <Input
                        id="m3uFile"
                        type="file"
                        accept=".m3u,.m3u8,text/plain"
                        onChange={handleFileChange}
                        disabled={isProcessing}
                        ref={fileInputRef}
                      />
                      <p className="text-sm text-muted-foreground">
                        Formatos aceitos: .m3u, .m3u8
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleFileProcess} 
                      disabled={isProcessing || !uploadedFile}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Processar Arquivo
                        </>
                      )}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="paste" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="m3uContent">Conteúdo M3U</Label>
                      <Textarea
                        id="m3uContent"
                        placeholder="#EXTM3U..."
                        value={m3uContent}
                        onChange={(e) => setM3uContent(e.target.value)}
                        className="min-h-[200px]"
                        disabled={isProcessing}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleContentProcess} 
                      disabled={isProcessing || !m3uContent}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Processar Conteúdo
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
                
                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              
              {items.length > 0 && (
                <CardFooter className="flex-col items-start gap-4 border-t px-6 py-4">
                  <div className="w-full">
                    <h3 className="font-medium mb-2">Estatísticas</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Total de itens:</div>
                      <div className="font-medium">{stats.total}</div>
                      
                      <div>Filmes:</div>
                      <div className="font-medium">{stats.movies}</div>
                      
                      <div>Séries:</div>
                      <div className="font-medium">{stats.series}</div>
                      
                      <div>TV:</div>
                      <div className="font-medium">{stats.tv}</div>
                      
                      <div>Não identificados:</div>
                      <div className="font-medium">{stats.unknown}</div>
                    </div>
                  </div>
                  
                  <ButtonExtended 
                    variant="premium" 
                    size="lg" 
                    className="w-full" 
                    onClick={handleImport}
                    disabled={isProcessing || items.length === 0}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Importar para o Banco de Dados
                      </>
                    )}
                  </ButtonExtended>
                </CardFooter>
              )}
            </Card>
            
            {processingLog.length > 0 && (
              <Card className="mt-4">
                <CardHeader className="py-4">
                  <CardTitle className="text-base">Log de Processamento</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[200px] p-4">
                    <div className="space-y-1 text-sm font-mono">
                      {processingLog.map((log, index) => (
                        <div key={index} className="py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
                          {log}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
                {isProcessing && stats.processed > 0 && (
                  <CardFooter className="py-3 border-t">
                    <div className="w-full space-y-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progresso: {stats.processed} de {stats.total}</span>
                        <span>{Math.round((stats.processed / stats.total) * 100)}%</span>
                      </div>
                      <Progress value={(stats.processed / stats.total) * 100} className="h-2" />
                    </div>
                  </CardFooter>
                )}
              </Card>
            )}
          </div>
          
          <div className="lg:col-span-7">
            {items.length > 0 ? (
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Conteúdos Encontrados</CardTitle>
                      <CardDescription>
                        {filteredItems.length} itens
                      </CardDescription>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        onClick={() => setFilterType('all')} 
                        className={`cursor-pointer ${filterType === 'all' ? 'bg-primary' : 'bg-secondary hover:bg-primary/80'}`}
                      >
                        Todos ({items.length})
                      </Badge>
                      <Badge 
                        onClick={() => setFilterType('movie')} 
                        className={`cursor-pointer ${filterType === 'movie' ? 'bg-primary' : 'bg-secondary hover:bg-primary/80'}`}
                      >
                        Filmes ({stats.movies})
                      </Badge>
                      <Badge 
                        onClick={() => setFilterType('series')} 
                        className={`cursor-pointer ${filterType === 'series' ? 'bg-primary' : 'bg-secondary hover:bg-primary/80'}`}
                      >
                        Séries ({stats.series})
                      </Badge>
                      <Badge 
                        onClick={() => setFilterType('tv')} 
                        className={`cursor-pointer ${filterType === 'tv' ? 'bg-primary' : 'bg-secondary hover:bg-primary/80'}`}
                      >
                        TV ({stats.tv})
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertTitle className="text-blue-800 dark:text-blue-300">Dica</AlertTitle>
                      <AlertDescription className="text-blue-700 dark:text-blue-400">
                        Filmes são importados diretamente para a tabela de conteúdos. Séries são importadas como conteúdos e seus episódios são adicionados à tabela de episódios.
                      </AlertDescription>
                    </Alert>
                  </div>
                
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Grupo</TableHead>
                          <TableHead className="hidden sm:table-cell">URL</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                              Nenhum item encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredItems.slice(0, 100).map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.title}</TableCell>
                              <TableCell>
                                <Badge className={
                                  item.type === 'movie' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                  item.type === 'series' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                  item.type === 'tv' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                }>
                                  {item.type === 'movie' ? 'Filme' : 
                                   item.type === 'series' ? 'Série' : 
                                   item.type === 'tv' ? 'TV' : 'Desconhecido'}
                                </Badge>
                                {item.type === 'series' && item.season && item.episode && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    S{item.season}E{item.episode}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>{item.group || '-'}</TableCell>
                              <TableCell className="hidden sm:table-cell truncate max-w-[200px]">{item.url}</TableCell>
                            </TableRow>
                          ))
                        )}
                        
                        {filteredItems.length > 100 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-2">
                              Mostrando 100 de {filteredItems.length} itens
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between border-t pt-4">
                  <div className="flex gap-2">
                    <ButtonExtended 
                      variant="success"
                      size="sm"
                      disabled={isProcessing || stats.processed === 0 || stats.success === 0}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      {stats.success} Adicionados
                    </ButtonExtended>
                    
                    <ButtonExtended 
                      variant="warning"
                      size="sm"
                      disabled={isProcessing || stats.processed === 0 || stats.skipped === 0}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      {stats.skipped} Ignorados
                    </ButtonExtended>
                  </div>
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Conteúdos Encontrados</CardTitle>
                  <CardDescription>
                    Carregue um arquivo M3U para visualizar os conteúdos
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum conteúdo carregado</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Utilize uma das opções ao lado para carregar um arquivo M3U.
                      Após o processamento, os conteúdos serão exibidos aqui.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-sm font-medium">
                  Sobre o formato M3U
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  <p className="mb-2">
                    M3U é um formato de arquivo de lista de reprodução usado para mídia.
                    O sistema suporta arquivos M3U padrão com a seguinte estrutura:
                  </p>
                  <pre className="bg-muted p-2 rounded-md overflow-x-auto text-xs my-2">
                    {`#EXTM3U
#EXTINF:-1 group-title="Filmes",Título do Filme
http://exemplo.com/filme.mp4
#EXTINF:-1 group-title="Séries",Nome da Série S01E01
http://exemplo.com/serie/s01e01.mp4`}
                  </pre>
                  <p>
                    O sistema tentará identificar automaticamente se o conteúdo é um filme, 
                    série ou canal de TV com base no título e nas informações do grupo.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BulkUpload;
