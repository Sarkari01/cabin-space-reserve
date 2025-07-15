import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, File, Image, FileText, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  onUpload: (file: File) => Promise<void>;
  existingUrl?: string;
  acceptedTypes?: string[];
  maxSize?: number;
  multiple?: boolean;
}

export const DocumentUpload = ({
  onUpload,
  existingUrl,
  acceptedTypes = ['image/*', 'application/pdf'],
  maxSize = 2 * 1024 * 1024, // 2MB default
  multiple = false,
}: DocumentUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    console.log('DocumentUpload - Validating file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      maxSize,
      acceptedTypes
    });

    // Check file size
    if (file.size > maxSize) {
      console.error('DocumentUpload - File too large:', file.size, 'vs', maxSize);
      toast({
        title: "File too large",
        description: `File size should not exceed ${Math.round(maxSize / (1024 * 1024))}MB`,
        variant: "destructive",
      });
      return false;
    }

    // Check file type with better logging
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        const matches = file.type.startsWith(baseType);
        console.log('DocumentUpload - Type check (wildcard):', { type, baseType, fileType: file.type, matches });
        return matches;
      }
      const matches = file.type === type;
      console.log('DocumentUpload - Type check (exact):', { type, fileType: file.type, matches });
      return matches;
    });

    if (!isValidType) {
      console.error('DocumentUpload - Invalid file type:', file.type, 'not in', acceptedTypes);
      toast({
        title: "Invalid file type",
        description: `Please upload files of type: ${acceptedTypes.join(', ')}. Your file type: ${file.type}`,
        variant: "destructive",
      });
      return false;
    }

    console.log('DocumentUpload - File validation passed');
    return true;
  };

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    
    console.log('DocumentUpload - Processing files:', fileArray.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    if (!multiple && fileArray.length > 1) {
      console.warn('DocumentUpload - Multiple files not allowed');
      toast({
        title: "Multiple files not allowed",
        description: "Please upload only one file at a time",
        variant: "destructive",
      });
      return;
    }

    for (const file of fileArray) {
      console.log('DocumentUpload - Processing file:', file.name);
      
      if (!validateFile(file)) {
        console.error('DocumentUpload - File validation failed for:', file.name);
        return;
      }

      setUploading(true);
      try {
        console.log('DocumentUpload - Starting upload for:', file.name);
        await onUpload(file);
        console.log('DocumentUpload - Upload completed for:', file.name);
      } catch (error) {
        console.error('DocumentUpload - Upload error for', file.name, ':', error);
        
        // Show user-friendly error
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (url: string) => {
    if (url.includes('.pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <Image className="h-8 w-8 text-blue-500" />;
  };

  const openPreview = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={acceptedTypes.join(',')}
        multiple={multiple}
        onChange={handleFileSelect}
      />

      <Card
        className={`
          border-2 border-dashed cursor-pointer transition-colors
          ${dragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
          ${uploading ? 'opacity-50' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <div className="p-8 text-center">
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {uploading ? "Uploading..." : "Drop files here or click to browse"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {acceptedTypes.join(', ')} • Max {Math.round(maxSize / (1024 * 1024))}MB
          </p>
        </div>
      </Card>

      {existingUrl && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon(existingUrl)}
              <div>
                <p className="font-medium">Document uploaded</p>
                <p className="text-sm text-muted-foreground">
                  {existingUrl.split('/').pop()?.split('_').slice(2).join('_')}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPreview(existingUrl)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};