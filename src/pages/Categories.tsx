
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/dashboard/DataTable';
import { useConfig } from '@/context/ConfigContext';
import { createApi } from '@/utils/api';
import { toast } from 'sonner';

const Categories = () => {
  const config = useConfig();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const columns = [
    { key: 'Nome', label: 'Nome' },
  ];

  const fetchData = async () => {
    if (!config.apiToken || !config.tableIds.categories) {
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

      const response = await api.getTableRows('categories', currentPage, pageSize);
      
      setData(response.results || []);
      setTotalPages(Math.ceil((response.count || 0) / pageSize));
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Erro ao carregar as categorias');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, config.apiToken, config.baseUrl, config.tableIds.categories]);

  const handleEdit = (row: any) => {
    toast.info(`Editando: ${row.Nome}`);
  };

  const handleDelete = (row: any) => {
    toast.info(`Excluindo: ${row.Nome}`);
  };

  const handleAdd = () => {
    toast.info('Adicionando nova categoria');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Categorias</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias de conteúdo
          </p>
        </div>

        {!config.apiToken || !config.tableIds.categories ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 rounded-lg text-amber-800 dark:text-amber-200">
            <p className="text-sm">
              Configure o token da API e o ID da tabela de categorias nas configurações para visualizar os dados.
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

export default Categories;
