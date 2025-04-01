import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/dashboard/DataTable';
import CrudDialog from '@/components/dashboard/CrudDialog';
import DeleteDialog from '@/components/dashboard/DeleteDialog';
import { useConfig } from '@/context/ConfigContext';
import { createApi } from '@/utils/api';
import { Badge } from '@/components/ui/badge';
import { convertJsonToArray } from '@/utils/formatters';
import { checkAndNotifyDuplicates } from '@/utils/duplicateChecker';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Episodes = () => {
  const config = useConfig();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<any>(null);
  const [formData, setFormData] = useState({
    Nome: '',
    Link: '',
    Temporada: 1,
    Episódio: 1
  });
  const pageSize = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

  const columns = [
    { key: 'Nome', label: 'Nome', sortable: true },
    { 
      key: 'Link', 
      label: 'Link',
      sortable: false,
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
      key: 'Temporada', 
      label: 'Temporada',
      sortable: true,
      dataType: 'number' as const,
      render: (value: number) => (
        <Badge variant="outline">
          T{value || 0}
        </Badge>
      )
    },
    { 
      key: 'Episódio', 
      label: 'Episódio',
      sortable: true,
      dataType: 'number' as const,
      render: (value: number) => (
        <Badge variant="outline">
          E{value || 0}
        </Badge>
      )
    },
    { 
      key: 'Histórico', 
      label: 'Visualizações',
      sortable: true,
      dataType: 'number' as const,
      render: (value: string) => {
        const historico = convertJsonToArray(value);
        return historico.length;
      }
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
    if (!config.apiToken || !config.tableIds.episodes) {
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

      let orderBy = 'order_by=-Data';
      if (sort) {
        const direction = sort.direction === 'asc' ? '' : '-';
        orderBy = `order_by=${direction}${sort.key}`;
      }

      let searchParam = '';
      if (search) {
        searchParam = `&search=${encodeURIComponent(search)}`;
      }

      const response = await api.getTableRows('episodes', page, pageSize, `${orderBy}${searchParam}`);
      
      setData(response.results || []);
      setTotalPages(Math.ceil((response.count || 0) / pageSize));
      
      checkAndNotifyDuplicates(response.results || [], 'Nome', 'episódio');
      
    } catch (error) {
      console.error('Error fetching episodes:', error);
      toast.error('Erro ao carregar os episódios');
    } finally {
      setIsLoading(false);
    }
  }, [config.apiToken, config.baseUrl, config.tableIds, currentPage, searchTerm, sortConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
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
    const historico = convertJsonToArray(row.Histórico);
    
    toast.info(
      <div className="space-y-2">
        <p><strong>Nome:</strong> {row.Nome}</p>
        <p><strong>Temporada:</strong> {row.Temporada}</p>
        <p><strong>Episódio:</strong> {row.Episódio}</p>
        <p><strong>Visualizações:</strong> {historico.length}</p>
      </div>,
      {
        duration: 5000,
      }
    );
  };

  const handleEdit = (row: any) => {
    setCurrentEpisode(row);
    setFormData({
      Nome: row.Nome || '',
      Link: row.Link || '',
      Temporada: row.Temporada || 1,
      Episódio: row.Episódio || 1
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (row: any) => {
    setCurrentEpisode(row);
    setIsDeleteDialogOpen(true);
  };

  const handleAdd = () => {
    setCurrentEpisode(null);
    setFormData({
      Nome: '',
      Link: '',
      Temporada: 1,
      Episódio: 1
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.Nome) {
      toast.error('O nome é obrigatório');
      return;
    }

    if (!formData.Link) {
      toast.error('O link é obrigatório');
      return;
    }

    if (!config.apiToken || !config.tableIds.episodes) {
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

      if (!currentEpisode) {
        const searchResponse = await api.getTableRows(
          'episodes', 
          1, 
          10, 
          `search=${encodeURIComponent(formData.Nome)}`
        );
        
        const exactMatches = (searchResponse.results || []).filter(
          item => item.Nome.toLowerCase() === formData.Nome.toLowerCase() &&
                 item.Temporada === formData.Temporada &&
                 item.Episódio === formData.Episódio
        );
        
        if (exactMatches.length > 0) {
          toast.warning('Atenção: já existe um episódio com este nome, temporada e número');
        }
      }

      if (currentEpisode) {
        await api.updateRow('episodes', currentEpisode.id, formData);
        toast.success('Episódio atualizado com sucesso');
      } else {
        await api.createRow('episodes', formData);
        toast.success('Episódio criado com sucesso');
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving episode:', error);
      toast.error('Erro ao salvar o episódio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentEpisode || !config.apiToken || !config.tableIds.episodes) {
      return;
    }

    setIsSubmitting(true);

    try {
      const api = createApi({
        apiToken: config.apiToken,
        baseUrl: config.baseUrl,
        tableIds: config.tableIds,
      });

      await api.deleteRow('episodes', currentEpisode.id);
      toast.success('Episódio excluído com sucesso');
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting episode:', error);
      toast.error('Erro ao excluir o episódio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkSeasonEpisodeDuplicates = useCallback(async () => {
    if (!config.apiToken || !config.tableIds.episodes) {
      toast.error('Configure o token da API e o ID da tabela');
      return [];
    }

    setIsLoading(true);
    try {
      const api = createApi({
        apiToken: config.apiToken,
        baseUrl: config.baseUrl,
        tableIds: config.tableIds,
      });

      const response = await api.getTableRows('episodes', 1, 1000);
      const episodes = response.results || [];
      
      const duplicatesMap = new Map();
      
      episodes.forEach(episode => {
        const key = `T${episode.Temporada}-E${episode.Episódio}-${episode.Nome}`;
        if (!duplicatesMap.has(key)) {
          duplicatesMap.set(key, []);
        }
        duplicatesMap.get(key).push(episode);
      });
      
      const duplicates = [];
      duplicatesMap.forEach((group, key) => {
        if (group.length > 1) {
          duplicates.push({
            key,
            items: group
          });
        }
      });
      
      setIsLoading(false);
      
      if (duplicates.length === 0) {
        toast.success('Não foram encontrados episódios duplicados');
        return [];
      }
      
      const duplicatesList = duplicates.map(group => 
        `"${group.key}" (${group.items.length} itens)`
      ).join(', ');
      
      toast.warning(
        `Duplicatas de episódios encontradas`, 
        {
          description: `Os seguintes episódios aparecem mais de uma vez: ${duplicatesList}`,
          duration: 5000,
        }
      );
      
      return duplicates;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      toast.error('Erro ao verificar episódios duplicados');
      setIsLoading(false);
      return [];
    }
  }, [config.apiToken, config.baseUrl, config.tableIds]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Episódios</h1>
          <p className="text-muted-foreground">
            Gerencie os episódios das séries
          </p>
        </div>

        {!config.apiToken || !config.tableIds.episodes ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 rounded-lg text-amber-800 dark:text-amber-200">
            <p className="text-sm">
              Configure o token da API e o ID da tabela de episódios nas configurações para visualizar os dados.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => {
                  const result = checkSeasonEpisodeDuplicates();
                  if (result) {
                    // Se houver duplicatas, navegue para a página de duplicatas
                    // Você poderia implementar navegação aqui
                  }
                }}
              >
                <AlertTriangle size={16} className="text-amber-500" />
                <span>Verificar Duplicatas</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/duplicates/episodes')}
              >
                Ver Página de Duplicatas
              </Button>
            </div>
            
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
          </>
        )}
      </div>

      {/* Edit/Add Dialog */}
      <CrudDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={currentEpisode ? 'Editar Episódio' : 'Adicionar Episódio'}
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
              placeholder="Nome do episódio"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="link">Link</Label>
            <Input
              id="link"
              value={formData.Link}
              onChange={(e) => setFormData({ ...formData, Link: e.target.value })}
              placeholder="https://exemplo.com/episodio"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="temporada">Temporada</Label>
              <Input
                id="temporada"
                type="number"
                value={formData.Temporada}
                onChange={(e) => setFormData({ ...formData, Temporada: parseInt(e.target.value) || 1 })}
                min={1}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="episodio">Episódio</Label>
              <Input
                id="episodio"
                type="number"
                value={formData.Episódio}
                onChange={(e) => setFormData({ ...formData, Episódio: parseInt(e.target.value) || 1 })}
                min={1}
              />
            </div>
          </div>
        </div>
      </CrudDialog>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        message="Tem certeza que deseja excluir o episódio"
        itemName={currentEpisode?.Nome}
        onConfirm={handleConfirmDelete}
        isLoading={isSubmitting}
      />
    </DashboardLayout>
  );
};

export default Episodes;
