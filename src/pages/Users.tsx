import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/dashboard/DataTable';
import CrudDialog from '@/components/dashboard/CrudDialog';
import DeleteDialog from '@/components/dashboard/DeleteDialog';
import { useConfig } from '@/context/ConfigContext';
import { createApi } from '@/utils/api';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatRemainingDays, formatImeiData } from '@/utils/formatters';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Users = () => {
  const config = useConfig();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    Nome: '',
    Email: '',
    Senha: '',
    Logins: 0,
    IMEI: '',
    Dias: 30,
    Pagamento: ''
  });
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
        const remaining = formatRemainingDays(row.Pagamento, parseInt(row.Dias || '0'));
        
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

  const formatPaymentDate = (date: string) => {
    if (!date) return '';
    
    try {
      const d = new Date(date);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  };

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
    setCurrentUser(row);
    setFormData({
      Nome: row.Nome || '',
      Email: row.Email || '',
      Senha: row.Senha || '',
      Logins: row.Logins || 0,
      IMEI: row.IMEI || '',
      Dias: row.Dias || 30,
      Pagamento: formatPaymentDate(row.Pagamento)
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (row: any) => {
    setCurrentUser(row);
    setIsDeleteDialogOpen(true);
  };

  const handleAdd = () => {
    setCurrentUser(null);
    const today = new Date().toISOString().split('T')[0]; // Today as YYYY-MM-DD
    
    setFormData({
      Nome: '',
      Email: '',
      Senha: '',
      Logins: 0,
      IMEI: '',
      Dias: 30,
      Pagamento: today
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.Nome) {
      toast.error('O nome é obrigatório');
      return;
    }

    if (!formData.Email) {
      toast.error('O email é obrigatório');
      return;
    }

    if (!config.apiToken || !config.tableIds.users) {
      toast.error('Configure o token da API e o ID da tabela');
      return;
    }

    const imeiData = !formData.IMEI 
      ? JSON.stringify({ IMEI: '', Dispositivo: '' }) 
      : formData.IMEI;

    let paymentDate = '';
    if (formData.Pagamento) {
      try {
        const date = new Date(formData.Pagamento);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        paymentDate = date.toISOString().split('T')[0];
      } catch (e) {
        toast.error('Data de pagamento inválida');
        return;
      }
    }
    
    const userData = {
      ...formData,
      IMEI: imeiData,
      Hoje: new Date().toISOString().split('T')[0],
      Data: new Date().toISOString().split('T')[0],
      Pagamento: paymentDate
    };

    setIsSubmitting(true);

    try {
      const api = createApi({
        apiToken: config.apiToken,
        baseUrl: config.baseUrl,
        tableIds: config.tableIds,
      });

      if (currentUser) {
        await api.updateRow('users', currentUser.id, userData);
        toast.success('Usuário atualizado com sucesso');
      } else {
        await api.createRow('users', userData);
        toast.success('Usuário criado com sucesso');
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(`Erro ao salvar o usuário: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentUser || !config.apiToken || !config.tableIds.users) {
      return;
    }

    setIsSubmitting(true);

    try {
      const api = createApi({
        apiToken: config.apiToken,
        baseUrl: config.baseUrl,
        tableIds: config.tableIds,
      });

      await api.deleteRow('users', currentUser.id);
      toast.success('Usuário excluído com sucesso');
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir o usuário');
    } finally {
      setIsSubmitting(false);
    }
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

      <CrudDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={currentUser ? 'Editar Usuário' : 'Adicionar Usuário'}
        onSave={handleSave}
        isLoading={isSubmitting}
      >
        <div className="grid gap-4 pr-4">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={formData.Nome}
              onChange={(e) => setFormData({ ...formData, Nome: e.target.value })}
              placeholder="Nome do usuário"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.Email}
              onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={formData.Senha}
              onChange={(e) => setFormData({ ...formData, Senha: e.target.value })}
              placeholder="********"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="logins">Logins</Label>
              <Input
                id="logins"
                type="number"
                value={formData.Logins}
                onChange={(e) => setFormData({ ...formData, Logins: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="dias">Dias</Label>
              <Input
                id="dias"
                type="number"
                value={formData.Dias}
                onChange={(e) => setFormData({ ...formData, Dias: parseInt(e.target.value) || 30 })}
                min={1}
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="pagamento">Data de Pagamento</Label>
            <Input
              id="pagamento"
              type="date"
              value={formData.Pagamento}
              onChange={(e) => setFormData({ ...formData, Pagamento: e.target.value })}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="imei">IMEI (JSON)</Label>
            <Input
              id="imei"
              value={formData.IMEI}
              onChange={(e) => setFormData({ ...formData, IMEI: e.target.value })}
              placeholder='{"IMEI": "device-id", "Dispositivo": "Nome do Dispositivo"}'
            />
            <p className="text-xs text-muted-foreground">Formato JSON contendo IMEI e Dispositivo</p>
          </div>
        </div>
      </CrudDialog>

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        message="Tem certeza que deseja excluir o usuário"
        itemName={currentUser?.Nome}
        onConfirm={handleConfirmDelete}
        isLoading={isSubmitting}
      />
    </DashboardLayout>
  );
};

export default Users;
