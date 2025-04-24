import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CSVUploadProps {
  onFileLoaded: (content: string) => void;
}

const CSVUpload = ({ onFileLoaded }: CSVUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const processFile = (file: File) => {
    if (!file || (!file.name.endsWith('.csv') && file.type !== 'text/csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    
    setPendingFile(file);
    setShowSubscriptionDialog(true);
  };
  
  const handleSubscribe = () => {
    toast.success('Subscription process would start here. For now, we\'ll simulate success');
    setShowSubscriptionDialog(false);
    
    if (pendingFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          onFileLoaded(content);
        }
      };
      reader.readAsText(pendingFile);
      setPendingFile(null);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };
  
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <>
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-300 ${
          isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-semibold">Upload CSV file</h3>
        <p className="mt-1 text-sm text-gray-500">
          Drag and drop your CSV file here, or click to browse
        </p>
        <Button
          variant="outline"
          onClick={handleButtonClick}
          className="mt-4"
        >
          Select file
        </Button>
        <p className="mt-2 text-xs text-gray-500">
          Required columns: Activity ID, Activity Name, Description, Strategy, PREP Date, GO Date
        </p>
        <p className="mt-1 text-xs text-blue-600">
          After upload, you'll be asked to set your scheduling preferences
        </p>
      </div>

      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>CSV Upload Subscription</DialogTitle>
            <DialogDescription>
              Upload and manage CSV activities with our Basic subscription.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="rounded-lg border p-4 mb-4 bg-blue-50">
              <h3 className="text-lg font-medium mb-2">Basic Features</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Upload unlimited CSV activities</li>
                <li>Manage and edit activities</li>
                <li>Visual highlighting for dates</li>
                <li>Get regular updates and new features first</li>
              </ul>
              <div className="mt-4 text-center">
                <span className="text-2xl font-bold">$89</span>
                <span className="text-sm font-medium"> AUD / month</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowSubscriptionDialog(false);
              setPendingFile(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubscribe}>
              Subscribe Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CSVUpload;
