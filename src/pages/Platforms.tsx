import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/dashboard/DataTable';
import CrudDialog from '@/components/dashboard/CrudDialog';
import DeleteDialog from '@/components/dashboard/DeleteDialog';
import { useConfig } from '@/context/ConfigContext';
import { createApi } from '@/utils/api';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Platforms = () => {
  const config = useConfig();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState<any>(null);
  const [formData, setFormData] = useState({
    Categoria: '',
    Imagem: ''
  });
  const pageSize = 10;

  const columns = [
    { key: 'Categoria', label: 'Categoria', sortable: true },
    { 
      key: 'Imagem', 
      label: 'Imagem',
      sortable: false,
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
    setCurrentPlatform(row);
    setFormData({
      Categoria: row.Categoria || '',
      Imagem: row.Imagem || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (row: any) => {
    setCurrentPlatform(row);
    setIsDeleteDialogOpen(true);
  };

  const handleAdd = () => {
    setCurrentPlatform(null);
    setFormData({
      Categoria: '',
      Imagem: ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.Categoria) {
      toast.error('A categoria é obrigatória');
      return;
    }

    if (!config.apiToken || !config.tableIds.platforms) {
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

      if (currentPlatform) {
        // Update
        await api.updateRow('platforms', currentPlatform.id, formData);
        toast.success('Plataforma atualizada com sucesso');
      } else {
        // Create
        await api.createRow('platforms', formData);
        toast.success('Plataforma criada com sucesso');
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving platform:', error);
      toast.error('Erro ao salvar a plataforma');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentPlatform || !config.apiToken || !config.tableIds.platforms) {
      return;
    }

    setIsSubmitting(true);

    try {
      const api = createApi({
        apiToken: config.apiToken,
        baseUrl: config.baseUrl,
        tableIds: config.tableIds,
      });

      await api.deleteRow('platforms', currentPlatform.id);
      toast.success('Plataforma excluída com sucesso');
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting platform:', error);
      toast.error('Erro ao excluir a plataforma');
    } finally {
      setIsSubmitting(false);
    }
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

      {/* Edit/Add Dialog */}
      <CrudDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={currentPlatform ? 'Editar Plataforma' : 'Adicionar Plataforma'}
        onSave={handleSave}
        isLoading={isSubmitting}
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Input
              id="categoria"
              value={formData.Categoria}
              onChange={(e) => setFormData({ ...formData, Categoria: e.target.value })}
              placeholder="Nome da plataforma"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="imagem">URL da Imagem</Label>
            <Input
              id="imagem"
              value={formData.Imagem}
              onChange={(e) => setFormData({ ...formData, Imagem: e.target.value })}
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>
          {formData.Imagem && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground mb-2">Pré-visualização:</p>
              <div className="w-20 h-20 rounded overflow-hidden bg-gray-100">
                <img 
                  src={formData.Imagem} 
                  alt="Pré-visualização" 
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
                />
              </div>
            </div>
          )}
        </div>
      </CrudDialog>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        message="Tem certeza que deseja excluir a plataforma"
        itemName={currentPlatform?.Categoria}
        onConfirm={handleConfirmDelete}
        isLoading={isSubmitting}
      />
    </DashboardLayout>
  );
};

export default Platforms;
