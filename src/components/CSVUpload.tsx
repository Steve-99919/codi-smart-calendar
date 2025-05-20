
import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CSVUploadProps {
  onFileLoaded: (content: string) => void;
}

const CSVUpload = ({ onFileLoaded }: CSVUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
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
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        onFileLoaded(content);
      }
    };
    reader.readAsText(file);
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
    </div>
  );
};

export default CSVUpload;
