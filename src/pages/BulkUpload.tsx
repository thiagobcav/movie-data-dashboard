
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useConfig } from '@/context/ConfigContext';
import { useAuth } from '@/context/AuthContext';
import { createApi } from '@/utils/api';
import { parseM3U, parseEpisodeTitle } from '@/utils/m3uParser';
import { toast } from 'sonner';
import { findDuplicates } from '@/utils/duplicateChecker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload, Film, Tv, FileBox, AlertCircle, Shield, CheckCircle, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface UploadStats {
  movies: number;
  series: number;
  episodes: number;
  tv: number;
  unknown: number;
  duplicates: number;
}

interface ProcessedItems {
  movies: any[];
  series: any[];
  episodes: any[];
  tv: any[];
  unknown: any[];
  duplicates: any[];
}

const BulkUpload = () => {
  const navigate = useNavigate();
  const config = useConfig();
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [rawM3u, setRawM3u] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentTab, setCurrentTab] = useState('url');
  const [processedItems, setProcessedItems] = useState<ProcessedItems>({
    movies: [],
    series: [],
    episodes: [],
    tv: [],
    unknown: [],
    duplicates: []
  });
  const [stats, setStats] = useState<UploadStats>({
    movies: 0,
    series: 0,
    episodes: 0,
    tv: 0,
    unknown: 0,
    duplicates: 0
  });
  const [existingContents, setExistingContents] = useState<any[]>([]);
  const [existingEpisodes, setExistingEpisodes] = useState<any[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processed' | 'uploaded'>('idle');

  // Check if user has premium access
  const isPremium = user?.Premium === true;

  // Fetch all existing contents to check for duplicates
  const fetchExistingItems = async () => {
    if (!config.apiToken) {
      toast.error('Configure o token da API');
      return false;
    }
    
    try {
      const api = createApi({
        apiToken: config.apiToken,
        baseUrl: config.baseUrl,
        tableIds: config.tableIds,
      });
      
      // Fetch up to 1000 contents (with pagination)
      let allContents: any[] = [];
      let allEpisodes: any[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore && page < 10) {
        const contentsResponse = await api.getTableRows('contents', page, 100);
        const items = contentsResponse.results || [];
        
        if (items.length === 0) {
          hasMore = false;
        } else {
          allContents = [...allContents, ...items];
          page++;
        }
      }
      
      // Also fetch episodes
      page = 1;
      hasMore = true;
      
      while (hasMore && page < 10) {
        const episodesResponse = await api.getTableRows('episodes', page, 100);
        const items = episodesResponse.results || [];
        
        if (items.length === 0) {
          hasMore = false;
        } else {
          allEpisodes = [...allEpisodes, ...items];
          page++;
        }
      }
      
      setExistingContents(allContents);
      setExistingEpisodes(allEpisodes);
      return true;
    } catch (error) {
      console.error('Error fetching existing items:', error);
      toast.error('Erro ao buscar itens existentes');
      return false;
    }
  };

  // Process M3U content
  const processM3U = async (content: string) => {
    setIsProcessing(true);
    setUploadStatus('idle');
    
    try {
      // Fetch existing items to check for duplicates
      const fetchSuccess = await fetchExistingItems();
      if (!fetchSuccess) {
        setIsProcessing(false);
        return;
      }
      
      // Parse M3U content
      const items = parseM3U(content);
      
      if (items.length === 0) {
        toast.error('Nenhum item encontrado no arquivo M3U');
        setIsProcessing(false);
        return;
      }
      
      // Categorize and process items
      const processed: ProcessedItems = {
        movies: [],
        series: [],
        episodes: [],
        tv: [],
        unknown: [],
        duplicates: []
      };
      
      // Process each item
      items.forEach(item => {
        const type = item.type || 'unknown';
        
        // Convert M3U item to content structure
        const contentItem = {
          Nome: item.title,
          URL: item.url,
          Thumbnail: item.tvgLogo || '',
          Categoria: item.groupTitle || ''
        };
        
        // Check for duplicates
        const isDuplicate = existingContents.some(existing => 
          existing.Nome?.toLowerCase() === contentItem.Nome.toLowerCase() ||
          existing.URL === contentItem.URL
        );
        
        if (isDuplicate) {
          processed.duplicates.push(contentItem);
          return;
        }
        
        // Process by type
        if (type === 'movie') {
          processed.movies.push(contentItem);
        } else if (type === 'tv') {
          processed.tv.push(contentItem);
        } else if (type === 'series') {
          // Parse episode info
          const { seriesName, season, episode } = parseEpisodeTitle(contentItem.Nome);
          
          // Create series content if not exists
          const seriesExists = processed.series.some(s => s.Nome === seriesName) || 
                              existingContents.some(s => s.Nome === seriesName);
          
          if (!seriesExists) {
            processed.series.push({
              Nome: seriesName,
              Thumbnail: contentItem.Thumbnail,
              Categoria: contentItem.Categoria,
              Tipo: 'Série'
            });
          }
          
          // Create episode
          const episodeItem = {
            Nome: seriesName,
            URL: contentItem.URL,
            Thumbnail: contentItem.Thumbnail,
            Temporada: season,
            Episódio: episode,
            Data: new Date().toISOString()
          };
          
          // Check for duplicate episodes
          const isDuplicateEpisode = existingEpisodes.some(existing => 
            existing.Nome?.toLowerCase() === episodeItem.Nome.toLowerCase() &&
            existing.Temporada === episodeItem.Temporada &&
            existing.Episódio === episodeItem.Episódio
          );
          
          if (!isDuplicateEpisode) {
            processed.episodes.push(episodeItem);
          } else {
            processed.duplicates.push(episodeItem);
          }
        } else {
          processed.unknown.push(contentItem);
        }
      });
      
      // Update stats
      setStats({
        movies: processed.movies.length,
        series: processed.series.length,
        episodes: processed.episodes.length,
        tv: processed.tv.length,
        unknown: processed.unknown.length,
        duplicates: processed.duplicates.length
      });
      
      // Update processed items
      setProcessedItems(processed);
      
      // Notify user
      toast.success(`Processamento concluído: ${items.length} itens encontrados`);
      setUploadStatus('processed');
    } catch (error) {
      console.error('Error processing M3U:', error);
      toast.error('Erro ao processar o conteúdo M3U');
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch M3U from URL
  const fetchM3UFromUrl = async () => {
    if (!url) {
      toast.error('Insira um URL válido');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Fetch the M3U content from the URL
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const content = await response.text();
      setRawM3u(content);
      
      // Process the content
      await processM3U(content);
    } catch (error) {
      console.error('Error fetching M3U:', error);
      toast.error('Erro ao buscar o arquivo M3U');
      setIsProcessing(false);
    }
  };

  // Process M3U from texterea input
  const processM3UFromText = async () => {
    if (!rawM3u) {
      toast.error('Insira o conteúdo M3U');
      return;
    }
    
    await processM3U(rawM3u);
  };

  // Upload processed items to Baserow
  const uploadToBaserow = async () => {
    if (!config.apiToken) {
      toast.error('Configure o token da API');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const api = createApi({
        apiToken: config.apiToken,
        baseUrl: config.baseUrl,
        tableIds: config.tableIds,
      });
      
      let totalUploaded = 0;
      
      // Upload movies
      for (const movie of processedItems.movies) {
        try {
          await api.createRow('contents', {
            ...movie,
            Tipo: 'Filme',
            Data: new Date().toISOString()
          });
          totalUploaded++;
        } catch (err) {
          console.error('Error uploading movie:', err);
        }
      }
      
      // Upload TV channels
      for (const tvChannel of processedItems.tv) {
        try {
          await api.createRow('contents', {
            ...tvChannel,
            Tipo: 'TV',
            Data: new Date().toISOString()
          });
          totalUploaded++;
        } catch (err) {
          console.error('Error uploading TV channel:', err);
        }
      }
      
      // Upload series
      for (const series of processedItems.series) {
        try {
          await api.createRow('contents', {
            ...series,
            Tipo: 'Série',
            Data: new Date().toISOString()
          });
          totalUploaded++;
        } catch (err) {
          console.error('Error uploading series:', err);
        }
      }
      
      // Upload episodes
      for (const episode of processedItems.episodes) {
        try {
          await api.createRow('episodes', episode);
          totalUploaded++;
        } catch (err) {
          console.error('Error uploading episode:', err);
        }
      }
      
      toast.success(`Upload concluído: ${totalUploaded} itens adicionados`);
      setUploadStatus('uploaded');
    } catch (error) {
      console.error('Error uploading to Baserow:', error);
      toast.error('Erro ao fazer upload para o Baserow');
    } finally {
      setIsUploading(false);
    }
  };

  // Premium alert component
  const PremiumAlert = () => (
    <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="text-amber-500" size={20} />
          Recurso Premium
        </CardTitle>
        <CardDescription>
          Esta funcionalidade está disponível apenas para usuários Premium
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Entre em contato com o administrador para obter acesso Premium e
          desbloquear esta funcionalidade.
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Upload em Massa</h1>
            <p className="text-muted-foreground">
              Adicione conteúdos em massa através de um arquivo M3U
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mt-4 sm:mt-0 gap-2"
          >
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </Button>
        </div>

        {!isPremium ? (
          <PremiumAlert />
        ) : (
          <div className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="text">Texto</TabsTrigger>
              </TabsList>
              
              <TabsContent value="url" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Importar de URL</CardTitle>
                    <CardDescription>
                      Insira o URL de um arquivo M3U
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://exemplo.com/playlist.m3u"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={isProcessing}
                        className="flex-1"
                      />
                      <Button
                        onClick={fetchM3UFromUrl}
                        disabled={isProcessing || !url}
                        className="gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
                            <span>Processando...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            <span>Carregar</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="text" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Importar de Texto</CardTitle>
                    <CardDescription>
                      Cole o conteúdo do arquivo M3U
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="#EXTM3U&#10;#EXTINF:-1 tvg-id=....."
                      value={rawM3u}
                      onChange={(e) => setRawM3u(e.target.value)}
                      disabled={isProcessing}
                      rows={10}
                      className="font-mono text-sm"
                    />
                    <Button
                      onClick={processM3UFromText}
                      disabled={isProcessing || !rawM3u}
                      className="gap-2 w-full"
                    >
                      {isProcessing ? (
                        <>
                          <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
                          <span>Processando...</span>
                        </>
                      ) : (
                        <>
                          <FileBox size={16} />
                          <span>Processar Conteúdo</span>
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {uploadStatus === 'processed' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo do Processamento</CardTitle>
                    <CardDescription>
                      Visão geral dos conteúdos encontrados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                        <Film className="text-primary mb-2" size={24} />
                        <span className="text-2xl font-bold">{stats.movies}</span>
                        <span className="text-sm text-muted-foreground">Filmes</span>
                      </div>
                      <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                        <FileBox className="text-primary mb-2" size={24} />
                        <span className="text-2xl font-bold">{stats.series}</span>
                        <span className="text-sm text-muted-foreground">Séries</span>
                      </div>
                      <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                        <FileBox className="text-primary mb-2" size={24} />
                        <span className="text-2xl font-bold">{stats.episodes}</span>
                        <span className="text-sm text-muted-foreground">Episódios</span>
                      </div>
                      <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                        <Tv className="text-primary mb-2" size={24} />
                        <span className="text-2xl font-bold">{stats.tv}</span>
                        <span className="text-sm text-muted-foreground">TV</span>
                      </div>
                      <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                        <AlertCircle className="text-amber-500 mb-2" size={24} />
                        <span className="text-2xl font-bold">{stats.unknown}</span>
                        <span className="text-sm text-muted-foreground">Desconhecidos</span>
                      </div>
                      <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                        <XCircle className="text-destructive mb-2" size={24} />
                        <span className="text-2xl font-bold">{stats.duplicates}</span>
                        <span className="text-sm text-muted-foreground">Duplicados</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button 
                    onClick={uploadToBaserow}
                    disabled={isUploading || (stats.movies + stats.series + stats.episodes + stats.tv) === 0}
                    className="gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
                        <span>Enviando...</span>
                      </>
                    ) : uploadStatus === 'uploaded' ? (
                      <>
                        <CheckCircle size={16} />
                        <span>Enviado</span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        <span>Enviar para Baserow</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Tables showing processed content */}
                {processedItems.movies.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Film size={18} />
                        <span>Filmes ({processedItems.movies.length})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Categoria</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {processedItems.movies.slice(0, 10).map((movie, index) => (
                            <TableRow key={index}>
                              <TableCell>{movie.Nome}</TableCell>
                              <TableCell>{movie.Categoria}</TableCell>
                            </TableRow>
                          ))}
                          {processedItems.movies.length > 10 && (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center text-muted-foreground">
                                + {processedItems.movies.length - 10} mais itens
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
                
                {processedItems.series.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileBox size={18} />
                        <span>Séries ({processedItems.series.length})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Categoria</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {processedItems.series.slice(0, 10).map((series, index) => (
                            <TableRow key={index}>
                              <TableCell>{series.Nome}</TableCell>
                              <TableCell>{series.Categoria}</TableCell>
                            </TableRow>
                          ))}
                          {processedItems.series.length > 10 && (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center text-muted-foreground">
                                + {processedItems.series.length - 10} mais itens
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
                
                {processedItems.episodes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileBox size={18} />
                        <span>Episódios ({processedItems.episodes.length})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Série</TableHead>
                            <TableHead>Temporada</TableHead>
                            <TableHead>Episódio</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {processedItems.episodes.slice(0, 10).map((episode, index) => (
                            <TableRow key={index}>
                              <TableCell>{episode.Nome}</TableCell>
                              <TableCell>{episode.Temporada}</TableCell>
                              <TableCell>{episode.Episódio}</TableCell>
                            </TableRow>
                          ))}
                          {processedItems.episodes.length > 10 && (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground">
                                + {processedItems.episodes.length - 10} mais itens
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
                
                {processedItems.tv.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Tv size={18} />
                        <span>Canais TV ({processedItems.tv.length})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Categoria</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {processedItems.tv.slice(0, 10).map((tv, index) => (
                            <TableRow key={index}>
                              <TableCell>{tv.Nome}</TableCell>
                              <TableCell>{tv.Categoria}</TableCell>
                            </TableRow>
                          ))}
                          {processedItems.tv.length > 10 && (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center text-muted-foreground">
                                + {processedItems.tv.length - 10} mais itens
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
                
                {processedItems.duplicates.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-destructive">
                        <XCircle size={18} />
                        <span>Duplicados ({processedItems.duplicates.length})</span>
                      </CardTitle>
                      <CardDescription>
                        Estes itens não serão carregados pois já existem no sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {processedItems.duplicates.slice(0, 10).map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.Nome}</TableCell>
                            </TableRow>
                          ))}
                          {processedItems.duplicates.length > 10 && (
                            <TableRow>
                              <TableCell className="text-center text-muted-foreground">
                                + {processedItems.duplicates.length - 10} mais itens
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BulkUpload;
