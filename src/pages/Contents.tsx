
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/dashboard/DataTable';
import { useConfig } from '@/context/ConfigContext';
import { createApi } from '@/utils/api';
import { Badge } from '@/components/ui/badge';
import { formatCategories, convertJsonToArray } from '@/utils/formatters';
import { toast } from 'sonner';

const Contents = () => {
  const config = useConfig();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const columns = [
    { key: 'Nome', label: 'Nome' },
    { 
      key: 'Capa', 
      label: 'Capa',
      render: (value: string) => value ? (
        <div className="w-12 h-12 rounded overflow-hidden bg-gray-100">
          <img 
            src={value} 
            alt="Capa" 
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
          />
        </div>
      ) : null
    },
    { 
      key: 'Categoria', 
      label: 'Categorias',
      render: (value: string) => (
        <div className="flex flex-wrap gap-1">
          {formatCategories(value).map((category, index) => (
            <Badge key={index} variant="outline" className="whitespace-nowrap">
              {category}
            </Badge>
          ))}
        </div>
      )
    },
    { 
      key: 'Tipo', 
      label: 'Tipo',
      render: (value: string) => {
        const colorMap: Record<string, string> = {
          'Filme': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          'Serie': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
          'TV': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        };
        const bgColor = colorMap[value] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        return (
          <Badge variant="outline" className={`${bgColor}`}>
            {value}
          </Badge>
        );
      }
    },
    { 
      key: 'Views', 
      label: 'Views',
      render: (value: number) => value ? value.toLocaleString() : '0'
    },
    { 
      key: 'Temporadas', 
      label: 'Temporadas',
      render: (value: number) => value || '0'
    },
  ];

  const fetchData = async () => {
    if (!config.apiToken || !config.tableIds.contents) {
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

      const response = await api.getTableRows('contents', currentPage, pageSize);
      
      setData(response.results || []);
      setTotalPages(Math.ceil((response.count || 0) / pageSize));
    } catch (error) {
      console.error('Error fetching contents:', error);
      toast.error('Erro ao carregar os conteúdos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, config.apiToken, config.baseUrl, config.tableIds.contents]);

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
    toast.info('Adicionando novo conteúdo');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Conteúdos</h1>
          <p className="text-muted-foreground">
            Gerencie os filmes, séries e programas de TV
          </p>
        </div>

        {!config.apiToken || !config.tableIds.contents ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 rounded-lg text-amber-800 dark:text-amber-200">
            <p className="text-sm">
              Configure o token da API e o ID da tabela de conteúdos nas configurações para visualizar os dados.
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

export default Contents;
