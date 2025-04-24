
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
          <AlertDialogCancel onClick={(e) => {
            e.stopPropagation();
            onOpenChange(false);
          }}>
            Go Back
          </AlertDialogCancel>
          <AlertDialogAction onClick={(e) => {
            e.stopPropagation();
            onContinue();
          }}>
            Continue Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
