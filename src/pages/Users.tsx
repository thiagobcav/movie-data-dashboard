
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
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Create a dynamic schema that can adapt to whether the Whatsapp field exists
const createUserFormSchema = (hasWhatsappField: boolean) => {
  const baseSchema = {
    Nome: z.string().min(1, { message: 'Nome é obrigatório' }),
    Email: z.string().email({ message: 'Email inválido' }),
    Senha: z.string().min(1, { message: 'Senha é obrigatória' }),
    Logins: z.coerce.number().int().nonnegative(),
    IMEI: z.string().optional(),
    Dias: z.coerce.number().int().min(1, { message: 'Mínimo de 1 dia' }),
    Pagamento: z.string().min(1, { message: 'Data de pagamento é obrigatória' })
  };
  
  // Add Whatsapp field if it exists in the data model
  if (hasWhatsappField) {
    return z.object({
      ...baseSchema,
      Whatsapp: z.string().optional()
    });
  }
  
  return z.object(baseSchema);
};

// Define the user form values type that includes the optional Whatsapp field
interface UserFormValues {
  Nome: string;
  Email: string;
  Senha: string;
  Logins: number;
  IMEI?: string;
  Dias: number;
  Pagamento: string;
  Whatsapp?: string;
}

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
  const [hasWhatsappField, setHasWhatsappField] = useState(false);
  const pageSize = 10;

  // Create a memoized form schema based on whether Whatsapp field exists
  const userFormSchema = React.useMemo(() => 
    createUserFormSchema(hasWhatsappField), 
    [hasWhatsappField]
  );
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      Nome: '',
      Email: '',
      Senha: '',
      Logins: 0,
      IMEI: '',
      Dias: 30,
      Pagamento: new Date().toISOString().split('T')[0],
      ...(hasWhatsappField ? { Whatsapp: '' } : {})
    }
  });

  // Define columns including conditional WhatsApp column
  const getColumns = () => {
    const baseColumns = [
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
    
    // Add WhatsApp column if the field exists in the data
    if (hasWhatsappField) {
      baseColumns.push({
        key: 'Whatsapp',
        label: 'WhatsApp',
        render: (value: string) => value ? 
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Sim</Badge> : 
          <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Não</Badge>
      });
    }
    
    return baseColumns;
  };

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
      
      // Check if WhatsApp field exists in any of the records
      if (response.results && response.results.length > 0) {
        const hasWhatsapp = 'Whatsapp' in response.results[0];
        setHasWhatsappField(hasWhatsapp);
        
        // Reset form with updated schema if needed
        if (hasWhatsapp !== hasWhatsappField) {
          form.reset({
            Nome: '',
            Email: '',
            Senha: '',
            Logins: 0,
            IMEI: '',
            Dias: 30,
            Pagamento: new Date().toISOString().split('T')[0],
            ...(hasWhatsapp ? { Whatsapp: '' } : {})
          });
        }
      }
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
  
  // Handle opening WhatsApp chat
  const handleWhatsApp = (row: any) => {
    if (!row.Whatsapp) return;
    
    // Format number by removing non-digits
    const formattedNumber = row.Whatsapp.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${formattedNumber}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleView = (row: any) => {
    const imeiData = formatImeiData(row.IMEI);
    
    toast.info(
      <div className="space-y-2">
        <p><strong>Usuário:</strong> {row.Nome}</p>
        <p><strong>Email:</strong> {row.Email}</p>
        <p><strong>Dispositivo:</strong> {imeiData.Dispositivo || 'N/A'}</p>
        <p><strong>IMEI:</strong> {imeiData.IMEI || 'N/A'}</p>
        {row.Whatsapp && <p><strong>WhatsApp:</strong> {row.Whatsapp}</p>}
      </div>,
      {
        duration: 5000,
      }
    );
  };

  const handleEdit = (row: any) => {
    setCurrentUser(row);
    
    const formData = {
      Nome: row.Nome || '',
      Email: row.Email || '',
      Senha: row.Senha || '',
      Logins: typeof row.Logins === 'number' ? row.Logins : parseInt(row.Logins) || 0,
      IMEI: row.IMEI || '',
      Dias: typeof row.Dias === 'number' ? row.Dias : parseInt(row.Dias) || 30,
      Pagamento: row.Pagamento ? row.Pagamento.split('T')[0] : new Date().toISOString().split('T')[0]
    };
    
    // Add WhatsApp field if it exists
    if (hasWhatsappField) {
      formData['Whatsapp'] = row.Whatsapp || '';
    }
    
    form.reset(formData);
    setIsDialogOpen(true);
  };

  const handleDelete = (row: any) => {
    setCurrentUser(row);
    setIsDeleteDialogOpen(true);
  };

  const handleAdd = () => {
    setCurrentUser(null);
    const today = new Date().toISOString().split('T')[0]; // Today as YYYY-MM-DD
    
    const defaultValues = {
      Nome: '',
      Email: '',
      Senha: '',
      Logins: 0,
      IMEI: '',
      Dias: 30,
      Pagamento: today
    };
    
    // Add WhatsApp field if it exists
    if (hasWhatsappField) {
      defaultValues['Whatsapp'] = '';
    }
    
    form.reset(defaultValues);
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: UserFormValues) => {
    if (!config.apiToken || !config.tableIds.users) {
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

      // Ensure numeric fields are numbers
      const userData = {
        ...data,
        Logins: typeof data.Logins === 'number' ? data.Logins : parseInt(data.Logins as any) || 0,
        Dias: typeof data.Dias === 'number' ? data.Dias : parseInt(data.Dias as any) || 30
      };

      if (currentUser) {
        console.log('Atualizando usuário:', userData);
        await api.updateRow('users', currentUser.id, userData);
        toast.success('Usuário atualizado com sucesso');
      } else {
        console.log('Criando usuário:', userData);
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

  // Add custom action for WhatsApp
  const getCustomActions = () => {
    if (!hasWhatsappField) return null;
    
    return (row: any) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleWhatsApp(row)}
        disabled={!row.Whatsapp}
        className={row.Whatsapp ? "text-green-600 hover:text-green-700 hover:bg-green-50" : ""}
        title={row.Whatsapp ? "Abrir WhatsApp" : "Número não cadastrado"}
      >
        <MessageSquare size={16} />
      </Button>
    );
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
            columns={getColumns()}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
            customActions={getCustomActions()}
          />
        )}
      </div>

      <CrudDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={currentUser ? 'Editar Usuário' : 'Adicionar Usuário'}
        onSave={form.handleSubmit(onSubmit)}
        isLoading={isSubmitting}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="Nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome do usuário" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="Email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="email@exemplo.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="Senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="********" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="Logins"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logins</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        min={0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="Dias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                        min={1} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="Pagamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Pagamento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {hasWhatsappField && (
              <FormField
                control={form.control}
                name="Whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ex: 5511999999999"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="IMEI"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IMEI</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder='{"IMEI": "device-id", "Dispositivo": "Nome do Dispositivo"}'
                      className="min-h-[80px]"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Pode ser informado apenas o código IMEI ou um JSON completo com IMEI e Dispositivo
                  </p>
                </FormItem>
              )}
            />
          </form>
        </Form>
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
