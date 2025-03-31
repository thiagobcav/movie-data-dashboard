import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/dashboard/DataTable';
import CrudDialog from '@/components/dashboard/CrudDialog';
import DeleteDialog from '@/components/dashboard/DeleteDialog';
import { useConfig } from '@/context/ConfigContext';
import { createApi } from '@/utils/api';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Sessions = () => {
  const config = useConfig();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    Categoria: '',
    Tipo: 'Filme'
  });
  const pageSize = 10;

  const columns = [
    { key: 'Categoria', label: 'Categoria', sortable: true },
    { 
      key: 'Tipo', 
      label: 'Tipo',
      sortable: true,
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
  ];

  const fetchData = async () => {
    if (!config.apiToken || !config.tableIds.sessions) {
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

      const response = await api.getTableRows('sessions', currentPage, pageSize);
      
      setData(response.results || []);
      setTotalPages(Math.ceil((response.count || 0) / pageSize));
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Erro ao carregar as sessões');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, config.apiToken, config.baseUrl, config.tableIds.sessions]);

  const handleEdit = (row: any) => {
    setCurrentSession(row);
    setFormData({
      Categoria: row.Categoria || '',
      Tipo: row.Tipo || 'Filme'
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (row: any) => {
    setCurrentSession(row);
    setIsDeleteDialogOpen(true);
  };

  const handleAdd = () => {
    setCurrentSession(null);
    setFormData({
      Categoria: '',
      Tipo: 'Filme'
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.Categoria) {
      toast.error('A categoria é obrigatória');
      return;
    }

    if (!config.apiToken || !config.tableIds.sessions) {
      toast.error('Configure o token da API e o ID da tabela');
      return;
    }

    setIsSubmitting(true);

    try {
      const api = createApi({
        apiToken: config.apiToken,
        baseUrl: config.baseUrl,
        tableIds: config.tableIds,
      });

      if (currentSession) {
        await api.updateRow('sessions', currentSession.id, formData);
        toast.success('Sessão atualizada com sucesso');
      } else {
        await api.createRow('sessions', formData);
        toast.success('Sessão criada com sucesso');
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Erro ao salvar a sessão');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentSession || !config.apiToken || !config.tableIds.sessions) {
      return;
    }

    setIsSubmitting(true);

    try {
      const api = createApi({
        apiToken: config.apiToken,
        baseUrl: config.baseUrl,
        tableIds: config.tableIds,
      });

      await api.deleteRow('sessions', currentSession.id);
      toast.success('Sessão excluída com sucesso');
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Erro ao excluir a sessão');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Sessões</h1>
          <p className="text-muted-foreground">
            Gerencie as sessões de destaque
          </p>
        </div>

        {!config.apiToken || !config.tableIds.sessions ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 rounded-lg text-amber-800 dark:text-amber-200">
            <p className="text-sm">
              Configure o token da API e o ID da tabela de sessões nas configurações para visualizar os dados.
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

      <CrudDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={currentSession ? 'Editar Sessão' : 'Adicionar Sessão'}
        onSave={handleSave}
        isLoading={isSubmitting}
      >
        <div className="grid gap-4 pr-4">
          <div className="grid gap-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Input
              id="categoria"
              value={formData.Categoria}
              onChange={(e) => setFormData({ ...formData, Categoria: e.target.value })}
              placeholder="Nome da categoria"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              value={formData.Tipo}
              onValueChange={(value) => setFormData({ ...formData, Tipo: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Filme">Filme</SelectItem>
                <SelectItem value="Serie">Série</SelectItem>
                <SelectItem value="TV">TV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CrudDialog>

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        message="Tem certeza que deseja excluir a sessão"
        itemName={currentSession?.Categoria}
        onConfirm={handleConfirmDelete}
        isLoading={isSubmitting}
      />
    </DashboardLayout>
  );
};

export default Sessions;
