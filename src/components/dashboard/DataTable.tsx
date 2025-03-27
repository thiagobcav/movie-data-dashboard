
import React, { useState } from 'react';
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
import { ArrowLeft, ArrowRight, Search, Edit, Trash, Eye, Plus } from 'lucide-react';

interface DataTableProps {
  data: any[];
  columns: {
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
  }[];
  onView?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onAdd?: () => void;
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
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
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data based on search term
  const filteredData = searchTerm
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

  return (
    <div className="w-full space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        {onAdd && (
          <Button onClick={onAdd} className="gap-2">
            <Plus size={16} />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
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
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (onView || onEdit || onDelete ? 1 : 0)}
                  className="h-24 text-center"
                >
                  <p className="text-muted-foreground">Nenhum resultado encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, rowIndex) => (
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
