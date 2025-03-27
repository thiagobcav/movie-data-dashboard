
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/dashboard/DataTable';
import { useConfig } from '@/context/ConfigContext';
import { createApi } from '@/utils/api';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatRemainingDays, formatImeiData } from '@/utils/formatters';
import { toast } from 'sonner';

const Users = () => {
  const config = useConfig();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const columns = [
    { key: 'Nome', label: 'Nome' },
    { key: 'Email', label: 'Email' },
    { 
      key: 'Logins', 
      label: 'Logins',
      render: (value: number) => value || '0'
    },
    { 
      key: 'Dias', 
      label: 'Total de Dias',
      render: (value: number) => value || '0'
    },
    { 
      key: 'Pagamento', 
      label: 'Data Pagamento',
      render: (value: string) => formatDate(value)
    },
    { 
      key: 'Restam', 
      label: 'Dias Restantes',
      render: (value: string, row: any) => {
        // Calculate remaining days based on payment date and total days
        const remaining = formatRemainingDays(row.Pagamento, parseInt(row.Dias || '0'));
        
        // Determine badge color based on remaining days
        let badgeClass = '';
        const days = parseInt(remaining);
        
        if (isNaN(days)) {
          badgeClass = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        } else if (days <= 5) {
          badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        } else if (days <= 15) {
          badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
        } else {
          badgeClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        }
        
        return (
          <Badge variant="outline" className={badgeClass}>
            {remaining || 'N/A'}
          </Badge>
        );
      }
    },
  ];

  const fetchData = async () => {
    if (!config.apiToken || !config.tableIds.users) {
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

      const response = await api.getTableRows('users', currentPage, pageSize);
      
      setData(response.results || []);
      setTotalPages(Math.ceil((response.count || 0) / pageSize));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar os usuários');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, config.apiToken, config.baseUrl, config.tableIds.users]);

  const handleView = (row: any) => {
    const imeiData = formatImeiData(row.IMEI);
    
    toast.info(
      <div className="space-y-2">
        <p><strong>Usuário:</strong> {row.Nome}</p>
        <p><strong>Email:</strong> {row.Email}</p>
        <p><strong>Dispositivo:</strong> {imeiData.Dispositivo || 'N/A'}</p>
        <p><strong>IMEI:</strong> {imeiData.IMEI || 'N/A'}</p>
      </div>,
      {
        duration: 5000,
      }
    );
  };

  const handleEdit = (row: any) => {
    toast.info(`Editando: ${row.Nome}`);
  };

  const handleDelete = (row: any) => {
    toast.info(`Excluindo: ${row.Nome}`);
  };

  const handleAdd = () => {
    toast.info('Adicionando novo usuário');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie os usuários da aplicação
          </p>
        </div>

        {!config.apiToken || !config.tableIds.users ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 rounded-lg text-amber-800 dark:text-amber-200">
            <p className="text-sm">
              Configure o token da API e o ID da tabela de usuários nas configurações para visualizar os dados.
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

export default Users;
