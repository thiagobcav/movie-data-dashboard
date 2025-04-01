
import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/dashboard/DataTable';
import CrudDialog from '@/components/dashboard/CrudDialog';
import DeleteDialog from '@/components/dashboard/DeleteDialog';
import { useConfig } from '@/context/ConfigContext';
import { createApi } from '@/utils/api';
import { Badge } from '@/components/ui/badge';
import { formatCategories, convertJsonToArray } from '@/utils/formatters';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { checkAndNotifyDuplicates } from '@/utils/duplicateChecker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Contents = () => {
  const config = useConfig();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentContent, setCurrentContent] = useState<any>(null);
  const [formData, setFormData] = useState({
    Nome: '',
    Capa: '',
    Categoria: '',
    Sinopse: '',
    Link: '',
    Tipo: 'Filme',
    Idioma: '',
    Views: 0,
    Temporadas: 0
  });
  const pageSize = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

  const columns = [
    { key: 'Nome', label: 'Nome', sortable: true },
    { 
      key: 'Capa', 
      label: 'Capa',
      sortable: false,
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
      sortable: true,
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
    { 
      key: 'Views', 
      label: 'Views',
      sortable: true,
      dataType: 'number' as const,
      render: (value: number) => value ? value.toLocaleString() : '0'
    },
    { 
      key: 'Temporadas', 
      label: 'Temporadas',
      sortable: true,
      dataType: 'number' as const,
      render: (value: number) => value || '0'
    },
    {
      key: 'Data',
      label: 'Data',
      sortable: true,
      dataType: 'date' as const,
      render: (value: string) => value ? new Date(value).toLocaleDateString('pt-BR') : '-'
    },
  ];

  const fetchData = useCallback(async (page = currentPage, search = searchTerm, sort = sortConfig) => {
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

      // Construir parâmetros de ordenação e pesquisa
      let orderBy = 'order_by=-Data';
      if (sort) {
        const direction = sort.direction === 'asc' ? '' : '-';
        orderBy = `order_by=${direction}${sort.key}`;
      }

      // Adicionar parâmetro de pesquisa se necessário
      let searchParam = '';
      if (search) {
        searchParam = `&search=${encodeURIComponent(search)}`;
      }

      const response = await api.getTableRows('contents', page, pageSize, `${orderBy}${searchParam}`);
      
      setData(response.results || []);
      setTotalPages(Math.ceil((response.count || 0) / pageSize));
      
      // Verificar duplicatas
      checkAndNotifyDuplicates(response.results || [], 'Nome', 'conteúdo');
      
    } catch (error) {
      console.error('Error fetching contents:', error);
      toast.error('Erro ao carregar os conteúdos');
    } finally {
      setIsLoading(false);
    }
  }, [config.apiToken, config.baseUrl, config.tableIds, currentPage, searchTerm, sortConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Voltar para a primeira página ao pesquisar
    fetchData(1, term, sortConfig);
  };

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    const newSortConfig = { key, direction };
    setSortConfig(newSortConfig);
    fetchData(currentPage, searchTerm, newSortConfig);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchData(page, searchTerm, sortConfig);
  };

  const handleView = (row: any) => {
    toast.info(
      <div className="space-y-2">
        <p><strong>Nome:</strong> {row.Nome}</p>
        <p><strong>Tipo:</strong> {row.Tipo}</p>
        <p><strong>Categorias:</strong> {row.Categoria}</p>
        <p><strong>Idioma:</strong> {row.Idioma || 'N/A'}</p>
        <p><strong>Sinopse:</strong> {row.Sinopse || 'N/A'}</p>
      </div>,
      {
        duration: 5000,
      }
    );
  };

  const handleEdit = (row: any) => {
    setCurrentContent(row);
    setFormData({
      Nome: row.Nome || '',
      Capa: row.Capa || '',
      Categoria: row.Categoria || '',
      Sinopse: row.Sinopse || '',
      Link: row.Link || '',
      Tipo: row.Tipo || 'Filme',
      Idioma: row.Idioma || '',
      Views: row.Views || 0,
      Temporadas: row.Temporadas || 0
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (row: any) => {
    setCurrentContent(row);
    setIsDeleteDialogOpen(true);
  };

  const handleAdd = () => {
    setCurrentContent(null);
    setFormData({
      Nome: '',
      Capa: '',
      Categoria: '',
      Sinopse: '',
      Link: '',
      Tipo: 'Filme',
      Idioma: '',
      Views: 0,
      Temporadas: 0
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.Nome) {
      toast.error('O nome é obrigatório');
      return;
    }

    if (!config.apiToken || !config.tableIds.contents) {
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

      // Verificar se já existe um conteúdo com o mesmo nome
      if (!currentContent) {
        // Só verificar duplicatas para novos conteúdos
        const searchResponse = await api.getTableRows(
          'contents', 
          1, 
          10, 
          `search=${encodeURIComponent(formData.Nome)}`
        );
        
        const exactMatches = (searchResponse.results || []).filter(
          item => item.Nome.toLowerCase() === formData.Nome.toLowerCase()
        );
        
        if (exactMatches.length > 0) {
          toast.warning('Atenção: já existe um conteúdo com este nome');
        }
      }

      if (currentContent) {
        await api.updateRow('contents', currentContent.id, formData);
        toast.success('Conteúdo atualizado com sucesso');
      } else {
        await api.createRow('contents', formData);
        toast.success('Conteúdo criado com sucesso');
      }

      setIsDialogOpen(false);
      fetchData(); // Recarregar dados
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Erro ao salvar o conteúdo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentContent || !config.apiToken || !config.tableIds.contents) {
      return;
    }

    setIsSubmitting(true);

    try {
      const api = createApi({
        apiToken: config.apiToken,
        baseUrl: config.baseUrl,
        tableIds: config.tableIds,
      });

      await api.deleteRow('contents', currentContent.id);
      toast.success('Conteúdo excluído com sucesso');
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Erro ao excluir o conteúdo');
    } finally {
      setIsSubmitting(false);
    }
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
            onPageChange={handlePageChange}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
            onSearch={handleSearch}
            onSort={handleSort}
          />
        )}
      </div>

      <CrudDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={currentContent ? 'Editar Conteúdo' : 'Adicionar Conteúdo'}
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
              placeholder="Nome do conteúdo"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="capa">URL da Capa</Label>
            <Input
              id="capa"
              value={formData.Capa}
              onChange={(e) => setFormData({ ...formData, Capa: e.target.value })}
              placeholder="https://exemplo.com/imagem.jpg"
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
          
          <div className="grid gap-2">
            <Label htmlFor="idioma">Idioma</Label>
            <Input
              id="idioma"
              value={formData.Idioma}
              onChange={(e) => setFormData({ ...formData, Idioma: e.target.value })}
              placeholder="Português, Inglês"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="sinopse">Sinopse</Label>
            <Textarea
              id="sinopse"
              value={formData.Sinopse}
              onChange={(e) => setFormData({ ...formData, Sinopse: e.target.value })}
              placeholder="Breve descrição do conteúdo"
              rows={3}
            />
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="views">Views</Label>
              <Input
                id="views"
                type="number"
                value={formData.Views}
                onChange={(e) => setFormData({ ...formData, Views: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="temporadas">Temporadas</Label>
              <Input
                id="temporadas"
                type="number"
                value={formData.Temporadas}
                onChange={(e) => setFormData({ ...formData, Temporadas: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
          </div>
          
          {formData.Capa && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground mb-2">Pré-visualização:</p>
              <div className="w-20 h-20 rounded overflow-hidden bg-gray-100">
                <img 
                  src={formData.Capa} 
                  alt="Pré-visualização" 
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
                />
              </div>
            </div>
          )}
        </div>
      </CrudDialog>

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        message="Tem certeza que deseja excluir o conteúdo"
        itemName={currentContent?.Nome}
        onConfirm={handleConfirmDelete}
        isLoading={isSubmitting}
      />
    </DashboardLayout>
  );
};

export default Contents;
