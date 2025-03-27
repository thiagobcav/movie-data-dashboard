
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  itemName?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  isOpen,
  onClose,
  message,
  itemName,
  onConfirm,
  isLoading = false,
}) => {
  const isMobile = useIsMobile();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'w-[95%] p-4' : 'sm:max-w-[425px]'}`}>
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>
            {message}{" "}
            <strong>{itemName}</strong>?
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Esta ação não pode ser desfeita.
          </p>
        </div>
        <DialogFooter className={isMobile ? 'flex flex-col space-y-2' : ''}>
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
            className={isMobile ? 'w-full' : ''}
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm} 
            disabled={isLoading}
            className={isMobile ? 'w-full' : ''}
          >
            {isLoading ? (
              <>
                <span className="mr-2">Excluindo</span>
                <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
              </>
            ) : (
              'Excluir'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteDialog;
