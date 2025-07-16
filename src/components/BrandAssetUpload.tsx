import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBrandAssetUpload } from '@/hooks/useBrandAssetUpload';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandAssetUploadProps {
  onAssetUploaded: (assetUrl: string) => void;
  currentAssetUrl?: string;
  onAssetRemoved?: () => void;
  assetType: 'logo' | 'favicon';
  disabled?: boolean;
}

export function BrandAssetUpload({ 
  onAssetUploaded, 
  currentAssetUrl, 
  onAssetRemoved,
  assetType,
  disabled = false 
}: BrandAssetUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const { uploadAsset, deleteAsset, uploading } = useBrandAssetUpload();

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const uploadedUrl = await uploadAsset(file, assetType);
    
    if (uploadedUrl) {
      onAssetUploaded(uploadedUrl);
    }
  }, [uploadAsset, assetType, onAssetUploaded]);

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
    if (currentAssetUrl) {
      const success = await deleteAsset(currentAssetUrl);
      if (success) {
        onAssetRemoved?.();
      }
    }
  }, [currentAssetUrl, deleteAsset, onAssetRemoved]);

  const assetTitle = assetType === 'logo' ? 'Logo' : 'Favicon';
  const inputId = `brand-${assetType}-input`;

  if (currentAssetUrl) {
    return (
      <div className="space-y-2">
        <div className="relative inline-block">
          <img
            src={currentAssetUrl}
            alt={`${assetTitle} preview`}
            className={cn(
              "object-cover rounded-lg border border-border",
              assetType === 'logo' ? "w-32 h-32" : "w-16 h-16"
            )}
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
          Click the X to remove the {assetTitle.toLowerCase()}
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
        onClick={() => !disabled && document.getElementById(inputId)?.click()}
      >
        <Input
          id={inputId}
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
            <p className="text-sm text-muted-foreground">Uploading {assetTitle.toLowerCase()}...</p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Drop {assetTitle.toLowerCase()} here or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                {assetType === 'favicon' 
                  ? 'PNG, ICO, SVG recommended (16x16 or 32x32px)' 
                  : 'PNG, JPG, SVG recommended (up to 5MB)'
                }
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
          onClick={() => document.getElementById(inputId)?.click()}
          disabled={uploading}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? `Uploading ${assetTitle}...` : `Choose ${assetTitle}`}
        </Button>
      )}
    </div>
  );
}