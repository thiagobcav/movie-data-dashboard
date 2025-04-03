
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
import { ScrollArea } from '@/components/ui/scroll-area';

interface CrudDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  isLoading?: boolean;
}

const CrudDialog: React.FC<CrudDialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onSave,
  isLoading = false,
}) => {
  const isMobile = useIsMobile();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={isMobile ? "w-[95%] p-4" : "sm:max-w-[600px]"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[70vh] pr-4">
          <div className="py-4 px-1">
            {children}
          </div>
        </ScrollArea>
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
            onClick={onSave} 
            disabled={isLoading}
            className={isMobile ? 'w-full' : ''}
          >
            {isLoading ? (
              <>
                <span className="mr-2">Salvando</span>
                <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CrudDialog;
