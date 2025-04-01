
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import DeleteDialog from '@/components/dashboard/DeleteDialog';
import { useConfig } from '@/context/ConfigContext';
import { createApi } from '@/utils/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, Trash, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { convertJsonToArray } from '@/utils/formatters';

type DuplicateGroup = {
  key: string;
  items: any[];
};

const DuplicatesCheck = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const config = useConfig();
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isMultiDeleteDialogOpen, setIsMultiDeleteDialogOpen] = useState(false);

  const tableType = type === 'episodes' ? 'episodes' : 'contents';
  const pageTitle = type === 'episodes' ? 'Episódios' : 'Conteúdos';

  const fetchAllItems = async (api: any) => {
    let allItems: any[] = [];
    let page = 1;
    let hasMore = true;
    const PAGE_SIZE = 100; // Smaller page size to avoid limits
    
    while (hasMore) {
      try {
        const response = await api.getTableRows(tableType, page, PAGE_SIZE);
        const items = response.results || [];
        
        if (items.length === 0) {
          hasMore = false;
        } else {
          allItems = [...allItems, ...items];
          page++;
        }
        
        // If we've fetched at least 1000 items or there's no next page, stop
        if (response.next === null || allItems.length >= 1000) {
          hasMore = false;
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        toast.error(`Erro ao buscar página ${page} de itens`);
        hasMore = false;
      }
    }
    
    return allItems;
  };

  const checkDuplicates = useCallback(async () => {
    if (!config.apiToken || !config.tableIds[tableType as keyof typeof config.tableIds]) {
      toast.error('Configure o token da API e o ID da tabela');
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

      // Get all items with pagination to avoid limits
      const items = await fetchAllItems(api);
      
      if (items.length === 0) {
        setDuplicates([]);
        setIsLoading(false);
        toast.success(`Não foram encontrados ${pageTitle.toLowerCase()}`);
        return;
      }
      
      // Group by appropriate key based on type
      const duplicatesMap = new Map();
      
      if (type === 'episodes') {
        // For episodes, group by season + episode + name
        items.forEach(item => {
          const key = `T${item.Temporada}-E${item.Episódio}-${item.Nome}`;
          if (!duplicatesMap.has(key)) {
            duplicatesMap.set(key, []);
          }
          duplicatesMap.get(key).push(item);
        });
      } else {
        // For contents, group by name
        items.forEach(item => {
          const name = String(item.Nome || '').trim().toLowerCase();
          if (!name) return;
          
          if (!duplicatesMap.has(name)) {
            duplicatesMap.set(name, []);
          }
          duplicatesMap.get(name).push(item);
        });
      }
      
      // Filter only groups with more than one item (duplicates)
      const duplicatesList: DuplicateGroup[] = [];
      duplicatesMap.forEach((group, key) => {
        if (group.length > 1) {
          duplicatesList.push({
            key,
            items: group
          });
        }
      });
      
      setDuplicates(duplicatesList);
      
      if (duplicatesList.length === 0) {
        toast.success(`Não foram encontrados ${pageTitle.toLowerCase()} duplicados`);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking duplicates:', error);
      toast.error(`Erro ao verificar ${pageTitle.toLowerCase()} duplicados`);
      setIsLoading(false);
    }
  }, [config, tableType, type, pageTitle]);

  useEffect(() => {
    checkDuplicates();
  }, [checkDuplicates]);

  const handleDeleteItem = (item: any) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const api = createApi({
        apiToken: config.apiToken,
        baseUrl: config.baseUrl,
        tableIds: config.tableIds,
      });

      await api.deleteRow(tableType, itemToDelete.id);
      toast.success(`Item excluído com sucesso`);
      
      // Refresh the data
      checkDuplicates();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(`Erro ao excluir o item`);
    } finally {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleMultiDelete = () => {
    if (selectedItems.length === 0) {
      toast.error('Selecione pelo menos um item para excluir');
      return;
    }
    
    setIsMultiDeleteDialogOpen(true);
  };

  const handleConfirmMultiDelete = async () => {
    try {
      const api = createApi({
        apiToken: config.apiToken,
        baseUrl: config.baseUrl,
        tableIds: config.tableIds,
      });

      // Delete all selected items one by one
      for (const item of selectedItems) {
        await api.deleteRow(tableType, item.id);
      }
      
      toast.success(`${selectedItems.length} itens excluídos com sucesso`);
      
      // Refresh the data and clear selection
      setSelectedItems([]);
      checkDuplicates();
    } catch (error) {
      console.error('Error deleting items:', error);
      toast.error(`Erro ao excluir os itens`);
    } finally {
      setIsMultiDeleteDialogOpen(false);
    }
  };

  const toggleItemSelection = (item: any) => {
    setSelectedItems(prev => {
      if (prev.some(i => i.id === item.id)) {
        return prev.filter(i => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const renderItemDetails = (item: any) => {
    if (type === 'episodes') {
      const views = convertJsonToArray(item.Histórico || '[]').length;
      
      return (
        <>
          <p className="text-sm text-muted-foreground">
            <strong>Nome:</strong> {item.Nome}
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Temporada:</strong> {item.Temporada}, <strong>Episódio:</strong> {item.Episódio}
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Visualizações:</strong> {views}
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Data:</strong> {item.Data ? new Date(item.Data).toLocaleDateString('pt-BR') : '-'}
          </p>
        </>
      );
    } else {
      return (
        <>
          <p className="text-sm text-muted-foreground">
            <strong>Nome:</strong> {item.Nome}
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Views:</strong> {item.Views || 0}
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Data:</strong> {item.Data ? new Date(item.Data).toLocaleDateString('pt-BR') : '-'}
          </p>
        </>
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Verificar Duplicatas: {pageTitle}</h1>
            <p className="text-muted-foreground">
              Gerencie {pageTitle.toLowerCase()} duplicados no sistema
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mt-4 sm:mt-0 gap-2"
          >
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <Button
              onClick={checkDuplicates}
              variant="outline"
              className="gap-2"
              disabled={isLoading}
            >
              <AlertTriangle size={16} className="text-amber-500" />
              <span>Verificar Novamente</span>
            </Button>
            
            {duplicates.length > 0 && (
              <Button
                onClick={handleMultiDelete}
                variant="destructive"
                className="gap-2"
                disabled={selectedItems.length === 0}
              >
                <Trash size={16} />
                <span>Excluir Selecionados ({selectedItems.length})</span>
              </Button>
            )}
          </div>
          
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-center items-center h-32">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    <span className="mt-2 text-sm text-muted-foreground">Verificando duplicatas...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : duplicates.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Nenhuma duplicata encontrada</CardTitle>
                <CardDescription>
                  Não foram encontradas duplicatas de {pageTitle.toLowerCase()}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            duplicates.map((group, groupIndex) => (
              <Card key={groupIndex} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <CardTitle className="text-lg flex justify-between">
                    <span>Grupo: {group.key}</span>
                    <Badge>{group.items.length} itens</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <span className="sr-only">Selecionar</span>
                        </TableHead>
                        <TableHead>Detalhes</TableHead>
                        <TableHead className="w-24 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((item, itemIndex) => (
                        <TableRow key={itemIndex}>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleItemSelection(item)}
                                className={selectedItems.some(i => i.id === item.id) ? "bg-primary/20" : ""}
                              >
                                {selectedItems.some(i => i.id === item.id) ? (
                                  <Check size={16} className="text-primary" />
                                ) : (
                                  <div className="h-4 w-4 rounded-sm border border-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {renderItemDetails(item)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteItem(item)}
                            >
                              <Trash size={16} className="text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Delete Dialog for single item */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        message={`Tem certeza que deseja excluir este item?`}
        itemName={itemToDelete?.Nome}
        onConfirm={handleConfirmDelete}
        isLoading={false}
      />

      {/* Delete Dialog for multiple items */}
      <DeleteDialog
        isOpen={isMultiDeleteDialogOpen}
        onClose={() => setIsMultiDeleteDialogOpen(false)}
        message={`Tem certeza que deseja excluir ${selectedItems.length} itens selecionados?`}
        itemName={`${selectedItems.length} itens de "${selectedItems[0]?.Nome || 'Grupo'}"...`}
        onConfirm={handleConfirmMultiDelete}
        isLoading={false}
      />
    </DashboardLayout>
  );
};

export default DuplicatesCheck;
