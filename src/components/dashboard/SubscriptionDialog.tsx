
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribe: () => void;
}

const SubscriptionDialog = ({ open, onOpenChange, onSubscribe }: SubscriptionDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Activity Tracking Subscription</DialogTitle>
          <DialogDescription>
            Track your activities with our Premium subscription.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="rounded-lg border p-4 mb-4 bg-green-50">
            <h3 className="text-lg font-medium mb-2">Premium Tracking Features</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Save unlimited activities to your tracking dashboard</li>
              <li>View upcoming activities sorted by date</li>
              <li>Receive email notifications for upcoming events</li>
              <li>Export your tracking data anytime</li>
            </ul>
            <div className="mt-4 text-center">
              <span className="text-2xl font-bold">$99</span>
              <span className="text-sm font-medium"> AUD / month</span>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubscribe}>
            Subscribe Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionDialog;
