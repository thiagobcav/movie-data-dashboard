
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/dashboard/DataTable';
import { useConfig } from '@/context/ConfigContext';
import { createApi } from '@/utils/api';
import { toast } from 'sonner';

const Platforms = () => {
  const config = useConfig();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const columns = [
    { key: 'Categoria', label: 'Categoria' },
    { 
      key: 'Imagem', 
      label: 'Imagem',
      render: (value: string) => value ? (
        <div className="w-12 h-12 rounded overflow-hidden bg-gray-100">
          <img 
            src={value} 
            alt="Plataforma" 
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
          />
        </div>
      ) : null
    },
  ];

  const fetchData = async () => {
    if (!config.apiToken || !config.tableIds.platforms) {
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

      const response = await api.getTableRows('platforms', currentPage, pageSize);
      
      setData(response.results || []);
      setTotalPages(Math.ceil((response.count || 0) / pageSize));
    } catch (error) {
      console.error('Error fetching platforms:', error);
      toast.error('Erro ao carregar as plataformas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, config.apiToken, config.baseUrl, config.tableIds.platforms]);

  const handleEdit = (row: any) => {
    toast.info(`Editando: ${row.Categoria}`);
  };

  const handleDelete = (row: any) => {
    toast.info(`Excluindo: ${row.Categoria}`);
  };

  const handleAdd = () => {
    toast.info('Adicionando nova plataforma');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Plataformas</h1>
          <p className="text-muted-foreground">
            Gerencie as plataformas de streaming
          </p>
        </div>

        {!config.apiToken || !config.tableIds.platforms ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 rounded-lg text-amber-800 dark:text-amber-200">
            <p className="text-sm">
              Configure o token da API e o ID da tabela de plataformas nas configurações para visualizar os dados.
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
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Platforms;
