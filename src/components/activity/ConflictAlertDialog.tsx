
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useEffect, useState } from "react";

interface ConflictAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  onContinue: () => void;
}

export const ConflictAlertDialog = ({
  open,
  onOpenChange,
  message,
  onContinue
}: ConflictAlertDialogProps) => {
  const [processingAction, setProcessingAction] = useState(false);
  
  // Reset processing state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setProcessingAction(false);
    }
  }, [open]);

  const handleContinue = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (processingAction) return;
    
    setProcessingAction(true);
    onOpenChange(false);
    
    // Allow time for the dialog to close before continuing
    setTimeout(() => {
      onContinue();
    }, 100);
  };
  
  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (processingAction) return;
    
    setProcessingAction(true);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Date Conflict Detected</AlertDialogTitle>
          <AlertDialogDescription>
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={processingAction}>
            Go Back
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleContinue} disabled={processingAction}>
            Continue Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
