
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/dashboard/DataTable';
import { useConfig } from '@/context/ConfigContext';
import { createApi } from '@/utils/api';
import { Badge } from '@/components/ui/badge';
import { formatCategories } from '@/utils/formatters';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

const Banners = () => {
  const config = useConfig();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const columns = [
    { key: 'Nome', label: 'Nome' },
    { 
      key: 'Imagem', 
      label: 'Imagem',
      render: (value: string) => value ? (
        <div className="w-16 h-10 rounded overflow-hidden bg-gray-100">
          <img 
            src={value} 
            alt="Banner" 
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
          />
        </div>
      ) : null
    },
    { 
      key: 'ID', 
      label: 'ID',
      render: (value: number) => value || '-'
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
      key: 'Externo?', 
      label: 'Externo',
      render: (value: boolean) => value ? (
        <Check className="text-green-600 mx-auto h-5 w-5" />
      ) : (
        <X className="text-red-600 mx-auto h-5 w-5" />
      )
    },
  ];

  const fetchData = async () => {
    if (!config.apiToken || !config.tableIds.banners) {
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

      const response = await api.getTableRows('banners', currentPage, pageSize);
      
      setData(response.results || []);
      setTotalPages(Math.ceil((response.count || 0) / pageSize));
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Erro ao carregar os banners');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, config.apiToken, config.baseUrl, config.tableIds.banners]);

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
    toast.info('Adicionando novo banner');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Banners</h1>
          <p className="text-muted-foreground">
            Gerencie os banners de destaque da aplicação
          </p>
        </div>

        {!config.apiToken || !config.tableIds.banners ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 rounded-lg text-amber-800 dark:text-amber-200">
            <p className="text-sm">
              Configure o token da API e o ID da tabela de banners nas configurações para visualizar os dados.
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

export default Banners;
