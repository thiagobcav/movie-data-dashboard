
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, Loader2, Info, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadialProgress } from '@/components/ui/RadialProgress';

interface ProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  progress: number;
  processedCount: number;
  totalCount: number;
  uploadedCount: {
    total: number;
    movies: number;
    series: number;
    tv: number;
  };
  duplicatesFound: number;
  isComplete: boolean;
  onClose: () => void;
  isError?: boolean;
  errorMessage?: string;
  canCancel?: boolean;
  onCancel?: () => void;
  isCancelling?: boolean;
}

export function ProgressDialog({
  open,
  onOpenChange,
  title,
  progress,
  processedCount,
  totalCount,
  uploadedCount,
  duplicatesFound,
  isComplete,
  onClose,
  isError = false,
  errorMessage = '',
  canCancel = false,
  onCancel,
  isCancelling = false,
}: ProgressDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {isError ? (
              <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
            ) : isComplete ? (
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            ) : (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            )}
            {title}
          </DialogTitle>
        </DialogHeader>

        {isError ? (
          <div className="space-y-4">
            <div className="bg-destructive/10 text-destructive p-3 rounded-md">
              <h3 className="font-medium">Erro durante o processamento</h3>
              <p className="text-sm mt-1">{errorMessage}</p>
            </div>
            
            <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-md text-amber-800 dark:text-amber-300">
              <div className="flex items-start">
                <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Solução para ERROR_REQUEST_BODY_VALIDATION</h3>
                  <p className="text-sm mt-1">
                    Este erro geralmente ocorre quando algum campo obrigatório não está sendo enviado 
                    ou está com formato inválido. Verifique a estrutura da sua tabela no Baserow e 
                    certifique-se de que todos os campos obrigatórios estão sendo enviados.
                  </p>
                </div>
              </div>
            </div>
            
            <Button variant="outline" onClick={onClose} className="w-full">
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {!isComplete ? (
              <>
                <div className="flex justify-between text-sm mb-1">
                  <span>Progresso: {progress}%</span>
                  <span>{processedCount} de {totalCount}</span>
                </div>
                <Progress value={progress} className="h-2" />
                
                {processedCount > 0 && (
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <div className="flex justify-between mb-2">
                      <span>Adicionados:</span>
                      <span className="font-medium">{uploadedCount.total}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Duplicados:</span>
                      <span className="font-medium">{duplicatesFound}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Restantes:</span>
                      <span className="font-medium">{totalCount - processedCount}</span>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground text-center">
                  O processo pode levar alguns minutos dependendo da quantidade de itens.
                  <br />
                  Não feche esta janela durante o processamento.
                </div>
                
                {canCancel && onCancel && (
                  <Button 
                    variant="outline" 
                    className="w-full text-destructive hover:bg-destructive/10"
                    onClick={onCancel}
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelando...
                      </>
                    ) : (
                      <>
                        <Ban className="mr-2 h-4 w-4" />
                        Cancelar Operação
                      </>
                    )}
                  </Button>
                )}
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-center">
                  <RadialProgress 
                    value={uploadedCount.total} 
                    max={totalCount - duplicatesFound}
                    size={120}
                    thickness={12}
                    color="var(--primary)"
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-medium">Total Enviado</h3>
                    <p className="text-2xl font-bold">{uploadedCount.total} itens</p>
                    <p className="text-sm text-muted-foreground">
                      {duplicatesFound} duplicatas ignoradas
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Filmes</p>
                      <p className="text-xl font-semibold">{uploadedCount.movies}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Séries</p>
                      <p className="text-xl font-semibold">{uploadedCount.series}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">TV</p>
                      <p className="text-xl font-semibold">{uploadedCount.tv}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isComplete && (
              <Button onClick={onClose} className="w-full">
                <CheckCircle className="mr-2 h-4 w-4" />
                Concluído
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
