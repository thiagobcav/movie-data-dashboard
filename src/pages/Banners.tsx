
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/dashboard/DataTable';
import CrudDialog from '@/components/dashboard/CrudDialog';
import DeleteDialog from '@/components/dashboard/DeleteDialog';
import { useConfig } from '@/context/ConfigContext';
import { createApi } from '@/utils/api';
import { Badge } from '@/components/ui/badge';
import { formatCategories } from '@/utils/formatters';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Check, X } from 'lucide-react';

const Banners = () => {
  const config = useConfig();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<any>(null);
  const [formData, setFormData] = useState({
    Nome: '',
    Imagem: '',
    ID: 0,
    Categoria: '',
    Link: '',
    'Externo?': false
  });
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
    toast.info(
      <div className="space-y-2">
        <p><strong>Nome:</strong> {row.Nome}</p>
        <p><strong>ID:</strong> {row.ID || 'N/A'}</p>
        <p><strong>Categorias:</strong> {row.Categoria || 'N/A'}</p>
        <p><strong>Externo:</strong> {row['Externo?'] ? 'Sim' : 'Não'}</p>
      </div>,
      {
        duration: 5000,
      }
    );
  };

  const handleEdit = (row: any) => {
    setCurrentBanner(row);
    setFormData({
      Nome: row.Nome || '',
      Imagem: row.Imagem || '',
      ID: row.ID || 0,
      Categoria: row.Categoria || '',
      Link: row.Link || '',
      'Externo?': row['Externo?'] || false
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (row: any) => {
    setCurrentBanner(row);
    setIsDeleteDialogOpen(true);
  };

  const handleAdd = () => {
    setCurrentBanner(null);
    setFormData({
      Nome: '',
      Imagem: '',
      ID: 0,
      Categoria: '',
      Link: '',
      'Externo?': false
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.Nome) {
      toast.error('O nome é obrigatório');
      return;
    }

    if (!formData.Imagem) {
      toast.error('A imagem é obrigatória');
      return;
    }

    if (!config.apiToken || !config.tableIds.banners) {
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

      if (currentBanner) {
        // Update
        await api.updateRow('banners', currentBanner.id, formData);
        toast.success('Banner atualizado com sucesso');
      } else {
        // Create
        await api.createRow('banners', formData);
        toast.success('Banner criado com sucesso');
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error('Erro ao salvar o banner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentBanner || !config.apiToken || !config.tableIds.banners) {
      return;
    }

    setIsSubmitting(true);

    try {
      const api = createApi({
        apiToken: config.apiToken,
        baseUrl: config.baseUrl,
        tableIds: config.tableIds,
      });

      await api.deleteRow('banners', currentBanner.id);
      toast.success('Banner excluído com sucesso');
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Erro ao excluir o banner');
    } finally {
      setIsSubmitting(false);
    }
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

      {/* Edit/Add Dialog */}
      <CrudDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={currentBanner ? 'Editar Banner' : 'Adicionar Banner'}
        onSave={handleSave}
        isLoading={isSubmitting}
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={formData.Nome}
              onChange={(e) => setFormData({ ...formData, Nome: e.target.value })}
              placeholder="Nome do banner"
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
          
          <div className="grid gap-2">
            <Label htmlFor="id">ID</Label>
            <Input
              id="id"
              type="number"
              value={formData.ID}
              onChange={(e) => setFormData({ ...formData, ID: parseInt(e.target.value) || 0 })}
              min={0}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="categoria">Categorias</Label>
            <Input
              id="categoria"
              value={formData.Categoria}
              onChange={(e) => setFormData({ ...formData, Categoria: e.target.value })}
              placeholder="Ação, Aventura, Comédia"
            />
            <p className="text-xs text-muted-foreground">Separe as categorias por vírgula</p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="link">Link</Label>
            <Input
              id="link"
              value={formData.Link}
              onChange={(e) => setFormData({ ...formData, Link: e.target.value })}
              placeholder="https://exemplo.com/conteudo"
            />
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <Switch
              checked={formData['Externo?']}
              onCheckedChange={(checked) => setFormData({ ...formData, 'Externo?': checked })}
              id="externo"
            />
            <Label htmlFor="externo">Link Externo</Label>
          </div>
          
          {formData.Imagem && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground mb-2">Pré-visualização:</p>
              <div className="w-32 h-20 rounded overflow-hidden bg-gray-100">
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
        message="Tem certeza que deseja excluir o banner"
        itemName={currentBanner?.Nome}
        onConfirm={handleConfirmDelete}
        isLoading={isSubmitting}
      />
    </DashboardLayout>
  );
};

export default Banners;
