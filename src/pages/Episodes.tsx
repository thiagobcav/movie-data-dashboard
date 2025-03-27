
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/dashboard/DataTable';
import { useConfig } from '@/context/ConfigContext';
import { createApi } from '@/utils/api';
import { Badge } from '@/components/ui/badge';
import { convertJsonToArray } from '@/utils/formatters';
import { toast } from 'sonner';

const Episodes = () => {
  const config = useConfig();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const columns = [
    { key: 'Nome', label: 'Nome' },
    { 
      key: 'Link', 
      label: 'Link',
      render: (value: string) => value ? (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-primary hover:underline truncate max-w-[200px] block"
        >
          {value}
        </a>
      ) : '-'
    },
    { 
      key: 'Temporada', 
      label: 'Temporada',
      render: (value: number) => (
        <Badge variant="outline">
          T{value || 0}
        </Badge>
      )
    },
    { 
      key: 'Episódio', 
      label: 'Episódio',
      render: (value: number) => (
        <Badge variant="outline">
          E{value || 0}
        </Badge>
      )
    },
    { 
      key: 'Histórico', 
      label: 'Visualizações',
      render: (value: string) => {
        const historico = convertJsonToArray(value);
        return historico.length;
      }
    },
  ];

  const fetchData = async () => {
    if (!config.apiToken || !config.tableIds.episodes) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const api = createApi({
        apiToken: config.apiToken,
        baseUrl: config.baseUrl,
        tableIds: config.tableIds,
      });

      const response = await api.getTableRows('episodes', currentPage, pageSize);
      
      setData(response.results || []);
      setTotalPages(Math.ceil((response.count || 0) / pageSize));
    } catch (error) {
      console.error('Error fetching episodes:', error);
      toast.error('Erro ao carregar os episódios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, config.apiToken, config.baseUrl, config.tableIds.episodes]);

  const handleView = (row: any) => {
    toast.info(`Visualizando: ${row.Nome}`);
  };

  const handleEdit = (row: any) => {
    toast.info(`Editando: ${row.Nome}`);
  };

  const handleDelete = (row: any) => {
    toast.info(`Excluindo: ${row.Nome}`);
  };

  const handleAdd = () => {
    toast.info('Adicionando novo episódio');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Episódios</h1>
          <p className="text-muted-foreground">
            Gerencie os episódios das séries
          </p>
        </div>

        {!config.apiToken || !config.tableIds.episodes ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 rounded-lg text-amber-800 dark:text-amber-200">
            <p className="text-sm">
              Configure o token da API e o ID da tabela de episódios nas configurações para visualizar os dados.
            </p>
          </div>
        ) : (
          <DataTable
            data={data}
            columns={columns}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Episodes;
