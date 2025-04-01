
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ArrowLeft, ArrowRight, Search, Edit, Trash, Eye, Plus, ArrowDown, ArrowUp, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableProps {
  data: any[];
  columns: {
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
    sortable?: boolean;
    dataType?: 'text' | 'number' | 'date';
  }[];
  onView?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onAdd?: () => void;
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSearch?: (term: string) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  onView,
  onEdit,
  onDelete,
  onAdd,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  onSearch,
  onSort,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Determinar quais colunas têm datas
  const dateColumns = columns
    .filter(column => column.dataType === 'date' && column.sortable !== false)
    .map(column => column.key);

  // Filtrar dados localmente quando não há callback onSearch
  const filteredData = !onSearch && searchTerm
    ? data.filter((row) =>
        columns.some((column) => {
          const value = row[column.key];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchTerm.toLowerCase());
          }
          return false;
        })
      )
    : data;

  // Ordenar dados localmente quando não há callback onSort
  const sortedData = React.useMemo(() => {
    if (!sortConfig || onSort) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valueA = a[sortConfig.key];
      const valueB = b[sortConfig.key];

      if (valueA === valueB) return 0;
      
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      
      // Determinar o tipo de coluna para ordenação
      const column = columns.find(col => col.key === sortConfig.key);
      const dataType = column?.dataType || 'text';
      
      if (dataType === 'date') {
        // Ordenar por data
        const dateA = valueA ? new Date(valueA).getTime() : 0;
        const dateB = valueB ? new Date(valueB).getTime() : 0;
        return (dateA - dateB) * direction;
      } else if (typeof valueA === 'string' && typeof valueB === 'string') {
        // Ordenar strings
        return valueA.localeCompare(valueB) * direction;
      } else if (valueA instanceof Date && valueB instanceof Date) {
        // Ordenar objetos Date
        return (valueA.getTime() - valueB.getTime()) * direction;
      } else if (dataType === 'number') {
        // Ordenar números
        const numA = Number(valueA) || 0;
        const numB = Number(valueB) || 0;
        return (numA - numB) * direction;
      }
      
      if (valueA === null || valueA === undefined) return 1 * direction;
      if (valueB === null || valueB === undefined) return -1 * direction;
      
      return (valueA > valueB ? 1 : -1) * direction;
    });
  }, [filteredData, sortConfig, columns, onSort]);

  const handleSort = (key: string) => {
    setSortConfig((prevSortConfig) => {
      const newConfig = {
        key,
        direction: prevSortConfig && prevSortConfig.key === key && prevSortConfig.direction === 'asc' ? 'desc' : 'asc',
      };
      
      // Se existe callback de ordenação externa, chamar
      if (onSort) {
        onSort(newConfig.key, newConfig.direction);
      }
      
      return newConfig;
    });
  };
  
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    // Se existe callback de pesquisa externa, usar debounce
    if (onSearch) {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      setSearchTimeout(
        setTimeout(() => {
          onSearch(term);
        }, 500)
      );
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="w-full space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {sortConfig ? (
                  sortConfig.direction === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />
                ) : (
                  <ArrowDown size={16} />
                )}
                <span className="hidden sm:inline">Ordenar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Opções de ordenação</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Seção de colunas de texto */}
              {columns.filter(column => column.sortable !== false && !dateColumns.includes(column.key)).map((column) => (
                <DropdownMenuItem 
                  key={column.key} 
                  onClick={() => handleSort(column.key)}
                  className="flex justify-between"
                >
                  <span>{column.label}</span>
                  {sortConfig?.key === column.key && (
                    sortConfig.direction === 'asc' 
                      ? <ArrowUp size={16} /> 
                      : <ArrowDown size={16} />
                  )}
                </DropdownMenuItem>
              ))}
              
              {/* Seção de colunas de data se houver alguma */}
              {dateColumns.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="flex items-center gap-1 text-xs">
                    <Clock size={14} /> Por data
                  </DropdownMenuLabel>
                  
                  {dateColumns.map(key => {
                    const column = columns.find(col => col.key === key);
                    if (!column) return null;
                    
                    return (
                      <DropdownMenuItem 
                        key={`date-${key}`}
                        onClick={() => handleSort(key)}
                        className="flex justify-between"
                      >
                        <span>{column.label}</span>
                        {sortConfig?.key === key && (
                          sortConfig.direction === 'asc' 
                            ? <ArrowUp size={16} /> 
                            : <ArrowDown size={16} />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </>
              )}
              
              {/* Opção para adicionar "Data" genérica quando não existe coluna de data */}
              {dateColumns.length === 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="flex items-center gap-1 text-xs">
                    <Clock size={14} /> Por data
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => handleSort("Data")}
                    className="flex justify-between"
                  >
                    <span>Data de criação</span>
                    {sortConfig?.key === "Data" && (
                      sortConfig.direction === 'asc' 
                        ? <ArrowUp size={16} /> 
                        : <ArrowDown size={16} />
                    )}
                  </DropdownMenuItem>
                </>
              )}
              
              {sortConfig && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortConfig(null)}>
                    Limpar ordenação
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {onAdd && (
            <Button onClick={onAdd} className="gap-2">
              <Plus size={16} />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={column.key}
                  className={column.sortable !== false ? "cursor-pointer" : ""}
                  onClick={column.sortable !== false ? () => handleSort(column.key) : undefined}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {sortConfig?.key === column.key && (
                      sortConfig.direction === 'asc' 
                        ? <ArrowUp size={14} /> 
                        : <ArrowDown size={14} />
                    )}
                  </div>
                </TableHead>
              ))}
              {(onView || onEdit || onDelete) && (
                <TableHead className="text-right">Ações</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (onView || onEdit || onDelete ? 1 : 0)}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-2"></div>
                    <span className="text-sm text-muted-foreground">Carregando dados...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (onView || onEdit || onDelete ? 1 : 0)}
                  className="h-24 text-center"
                >
                  <p className="text-muted-foreground">Nenhum resultado encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key] || '-')}
                    </TableCell>
                  ))}
                  {(onView || onEdit || onDelete) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {onView && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onView(row)}
                          >
                            <Eye size={16} />
                          </Button>
                        )}
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(row)}
                          >
                            <Edit size={16} />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(row)}
                          >
                            <Trash size={16} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="gap-1"
          >
            <ArrowLeft size={16} />
            <span>Anterior</span>
          </Button>
          
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className="gap-1"
          >
            <span>Próxima</span>
            <ArrowRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default DataTable;
