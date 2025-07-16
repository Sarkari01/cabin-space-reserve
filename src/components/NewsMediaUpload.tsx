import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNewsMediaUpload } from '@/hooks/useNewsMediaUpload';
import { Upload, X, Image as ImageIcon, Video, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NewsMediaUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  onVideoUploaded: (videoUrl: string) => void;
  currentImageUrl?: string;
  currentVideoUrl?: string;
  onImageRemoved?: () => void;
  onVideoRemoved?: () => void;
  disabled?: boolean;
}

export function NewsMediaUpload({ 
  onImageUploaded,
  onVideoUploaded,
  currentImageUrl, 
  currentVideoUrl,
  onImageRemoved,
  onVideoRemoved,
  disabled = false 
}: NewsMediaUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [showUrlInputs, setShowUrlInputs] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const { uploadFile, deleteFile, uploading } = useNewsMediaUpload();

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const uploadedUrl = await uploadFile(file);
    
    if (uploadedUrl) {
      if (file.type.startsWith('image/')) {
        onImageUploaded(uploadedUrl);
      } else if (file.type.startsWith('video/')) {
        onVideoUploaded(uploadedUrl);
      }
    }
  }, [uploadFile, onImageUploaded, onVideoUploaded]);

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

  const handleRemoveImage = useCallback(async () => {
    if (currentImageUrl) {
      const success = await deleteFile(currentImageUrl);
      if (success) {
        onImageRemoved?.();
      }
    }
  }, [currentImageUrl, deleteFile, onImageRemoved]);

  const handleRemoveVideo = useCallback(async () => {
    if (currentVideoUrl) {
      const success = await deleteFile(currentVideoUrl);
      if (success) {
        onVideoRemoved?.();
      }
    }
  }, [currentVideoUrl, deleteFile, onVideoRemoved]);

  const handleAddImageUrl = () => {
    if (imageUrl.trim()) {
      onImageUploaded(imageUrl.trim());
      setImageUrl('');
    }
  };

  const handleAddVideoUrl = () => {
    if (videoUrl.trim()) {
      onVideoUploaded(videoUrl.trim());
      setVideoUrl('');
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Media</Label>
      
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragActive && !disabled ? "border-primary bg-primary/5" : "border-border",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && document.getElementById('media-upload-input')?.click()}
      >
        <Input
          id="media-upload-input"
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || uploading}
        />
        
        <div className="space-y-3">
          <div className="flex justify-center">
            {uploading ? (
              <div className="animate-spin w-10 h-10 border-2 border-primary border-t-transparent rounded-full" />
            ) : (
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
                <Video className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
          
          {uploading ? (
            <p className="text-sm text-muted-foreground">Uploading media...</p>
          ) : (
            <div className="space-y-1">
              <p className="font-medium">
                Drop images or videos here, or click to upload
              </p>
              <p className="text-sm text-muted-foreground">
                Images: PNG, JPG, GIF up to 10MB | Videos: MP4, WebM up to 50MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Button */}
      {!disabled && (
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('media-upload-input')?.click()}
          disabled={uploading}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Choose Files'}
        </Button>
      )}

      {/* Media Previews */}
      <div className="space-y-4">
        {/* Image Preview */}
        {currentImageUrl && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Featured Image</Label>
            <div className="relative inline-block">
              <img
                src={currentImageUrl}
                alt="Featured image preview"
                className="w-full max-w-sm h-32 object-cover rounded-lg border border-border"
              />
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                  onClick={handleRemoveImage}
                  disabled={uploading}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Video Preview */}
        {currentVideoUrl && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Video</Label>
            <div className="relative inline-block w-full max-w-sm">
              <video
                src={currentVideoUrl}
                controls
                className="w-full h-32 object-cover rounded-lg border border-border"
              />
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                  onClick={handleRemoveVideo}
                  disabled={uploading}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* URL Input Alternative */}
      <Collapsible open={showUrlInputs} onOpenChange={setShowUrlInputs}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="w-full">
            <ExternalLink className="w-4 h-4 mr-2" />
            Or add media URLs manually
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="manual-image-url">Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="manual-image-url"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                disabled={disabled}
              />
              <Button
                type="button"
                onClick={handleAddImageUrl}
                disabled={!imageUrl.trim() || disabled}
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="manual-video-url">Video URL</Label>
            <div className="flex gap-2">
              <Input
                id="manual-video-url"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://example.com/video.mp4"
                disabled={disabled}
              />
              <Button
                type="button"
                onClick={handleAddVideoUrl}
                disabled={!videoUrl.trim() || disabled}
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}