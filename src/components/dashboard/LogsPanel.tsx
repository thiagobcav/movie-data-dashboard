
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn';
  message: string;
  details?: any;
}

const MAX_LOGS = 1000;

// Move getLevelColor out of the component so it can be used by LogsList
const getLevelColor = (level: string) => {
  switch (level) {
    case 'error':
      return 'bg-red-500';
    case 'warn':
      return 'bg-amber-500';
    case 'info':
    default:
      return 'bg-blue-500';
  }
};

const LogsPanel = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  
  // Load logs from localStorage on component mount
  useEffect(() => {
    loadLogs();
  }, []);
  
  // Filter logs when active tab changes
  useEffect(() => {
    filterLogs(activeTab);
  }, [activeTab, logs]);
  
  const loadLogs = () => {
    setIsLoading(true);
    try {
      const savedLogs = localStorage.getItem('application-logs');
      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs) as LogEntry[];
        setLogs(parsedLogs);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Erro ao carregar logs');
    } finally {
      setIsLoading(false);
    }
  };
  
  const filterLogs = (tab: string) => {
    if (tab === 'all') {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(logs.filter(log => log.level === tab));
    }
  };
  
  const clearLogs = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os logs?')) {
      localStorage.removeItem('application-logs');
      setLogs([]);
      setFilteredLogs([]);
      toast.success('Logs limpos com sucesso');
    }
  };
  
  const downloadLogs = () => {
    try {
      const logsJSON = JSON.stringify(logs, null, 2);
      const blob = new Blob([logsJSON], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `application-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast.success('Logs baixados com sucesso');
    } catch (error) {
      console.error('Error downloading logs:', error);
      toast.error('Erro ao baixar logs');
    }
  };
  
  const getLogCount = (level: string) => {
    if (level === 'all') return logs.length;
    return logs.filter(log => log.level === level).length;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs do Sistema</CardTitle>
        <CardDescription>
          Visualize os logs de operações do sistema para identificar possíveis erros
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              Todos
              <Badge variant="secondary" className="ml-2">{getLogCount('all')}</Badge>
            </TabsTrigger>
            <TabsTrigger value="info" className="flex-1">
              Info
              <Badge variant="secondary" className="ml-2">{getLogCount('info')}</Badge>
            </TabsTrigger>
            <TabsTrigger value="warn" className="flex-1">
              Avisos
              <Badge variant="secondary" className="ml-2">{getLogCount('warn')}</Badge>
            </TabsTrigger>
            <TabsTrigger value="error" className="flex-1">
              Erros
              <Badge variant="secondary" className="ml-2">{getLogCount('error')}</Badge>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pb-0 pt-4">
          <div className="flex justify-end space-x-2 mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadLogs}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadLogs}
              disabled={logs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearLogs}
              disabled={logs.length === 0}
              className="text-destructive hover:bg-destructive hover:text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
          
          <TabsContent value="all" className="m-0">
            <LogsList logs={filteredLogs} />
          </TabsContent>
          
          <TabsContent value="info" className="m-0">
            <LogsList logs={filteredLogs} />
          </TabsContent>
          
          <TabsContent value="warn" className="m-0">
            <LogsList logs={filteredLogs} />
          </TabsContent>
          
          <TabsContent value="error" className="m-0">
            <LogsList logs={filteredLogs} />
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between mt-4">
        <div className="text-xs text-muted-foreground">
          Exibindo {filteredLogs.length} de {logs.length} logs
        </div>
      </CardFooter>
    </Card>
  );
};

interface LogsListProps {
  logs: LogEntry[];
}

const LogsList: React.FC<LogsListProps> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <Alert variant="default" className="bg-muted/50">
        <AlertDescription>
          Nenhum log encontrado para os critérios selecionados.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ScrollArea className="h-[400px] rounded-md border">
      <div className="p-4 space-y-4">
        {logs.map((log, index) => (
          <div 
            key={index} 
            className="rounded-md border p-3 text-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${getLevelColor(log.level)} mr-2`}></div>
                <span className="font-medium">
                  {log.level === 'info' && 'Informação'}
                  {log.level === 'warn' && 'Aviso'}
                  {log.level === 'error' && 'Erro'}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
            <p>{log.message}</p>
            {log.details && (
              <details className="mt-2">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Detalhes
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded-md text-xs whitespace-pre-wrap">
                  {typeof log.details === 'string' 
                    ? log.details 
                    : JSON.stringify(log.details, null, 2)
                  }
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default LogsPanel;
