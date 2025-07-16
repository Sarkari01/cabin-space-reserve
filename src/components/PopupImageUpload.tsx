import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePopupImageUpload } from '@/hooks/usePopupImageUpload';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PopupImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImageUrl?: string;
  onImageRemoved?: () => void;
  disabled?: boolean;
}

export function PopupImageUpload({ 
  onImageUploaded, 
  currentImageUrl, 
  onImageRemoved,
  disabled = false 
}: PopupImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const { uploadImage, deleteImage, uploading } = usePopupImageUpload();

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const uploadedUrl = await uploadImage(file);
    
    if (uploadedUrl) {
      onImageUploaded(uploadedUrl);
    }
  }, [uploadImage, onImageUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }, [handleFiles, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragActive(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  }, [handleFiles]);

  const handleRemove = useCallback(async () => {
    if (currentImageUrl) {
      const success = await deleteImage(currentImageUrl);
      if (success) {
        onImageRemoved?.();
      }
    }
  }, [currentImageUrl, deleteImage, onImageRemoved]);

  if (currentImageUrl) {
    return (
      <div className="space-y-2">
        <div className="relative inline-block">
          <img
            src={currentImageUrl}
            alt="Popup notification preview"
            className="w-32 h-32 object-cover rounded-lg border border-border"
          />
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Click the X to remove the image
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragActive && !disabled ? "border-primary bg-primary/5" : "border-border",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && document.getElementById('popup-image-input')?.click()}
      >
        <Input
          id="popup-image-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || uploading}
        />
        
        <div className="space-y-2">
          <div className="flex justify-center">
            {uploading ? (
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          
          {uploading ? (
            <p className="text-sm text-muted-foreground">Uploading image...</p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Drop an image here or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          )}
        </div>
      </div>

      {!disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('popup-image-input')?.click()}
          disabled={uploading}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Choose Image'}
        </Button>
      )}
    </div>
  );
}