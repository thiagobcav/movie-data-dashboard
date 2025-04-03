
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
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
