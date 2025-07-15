import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Star, StarOff, Image as ImageIcon, Loader2 } from "lucide-react";

interface UploadedImage {
  id: string;
  url: string;
  file: File;
  isMain: boolean;
}

interface MultiImageUploadProps {
  studyHallId?: string;
  existingImages?: Array<{
    id: string;
    image_url: string;
    is_main: boolean;
    display_order: number;
  }>;
  onImagesChange?: (images: UploadedImage[]) => void;
  disabled?: boolean;
  maxImages?: number;
}

export function MultiImageUpload({
  studyHallId,
  existingImages = [],
  onImagesChange,
  disabled = false,
  maxImages = 10
}: MultiImageUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Convert existing images to local format
  const existingImagesConverted = existingImages.map(img => ({
    id: img.id,
    url: img.image_url,
    file: new File([], 'existing'), // Placeholder file for existing images
    isMain: img.is_main
  }));

  const allImages = [...existingImagesConverted, ...images];

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select only image files",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || disabled) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(validateFile);

    if (allImages.length + validFiles.length > maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const newImages: UploadedImage[] = [];

      for (const file of validFiles) {
        const imageId = `temp-${Date.now()}-${Math.random()}`;
        const objectUrl = URL.createObjectURL(file);
        
        newImages.push({
          id: imageId,
          url: objectUrl,
          file,
          isMain: allImages.length === 0 && newImages.length === 0 // First image is main by default
        });
      }

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesChange?.(updatedImages);

      toast({
        title: "Images added",
        description: `${validFiles.length} image(s) added successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [images, allImages.length, maxImages, onImagesChange, disabled, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const setMainImage = (imageId: string) => {
    if (disabled) return;

    const updatedImages = images.map(img => ({
      ...img,
      isMain: img.id === imageId
    }));
    
    setImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  const removeImage = (imageId: string) => {
    if (disabled) return;

    const imageToRemove = images.find(img => img.id === imageId);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.url);
    }

    const updatedImages = images.filter(img => img.id !== imageId);
    
    // If we removed the main image, set the first remaining image as main
    if (imageToRemove?.isMain && updatedImages.length > 0) {
      updatedImages[0].isMain = true;
    }
    
    setImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  const uploadImages = async () => {
    if (!studyHallId || images.length === 0) return;

    setUploading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('upload-study-hall-images', {
        body: {
          studyHallId,
          images: await Promise.all(images.map(async (img, index) => ({
            fileData: await fileToBase64(img.file),
            fileName: img.file.name,
            isMain: img.isMain,
            displayOrder: index
          })))
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Images uploaded successfully",
      });

      // Clear local images after successful upload
      images.forEach(img => URL.revokeObjectURL(img.url));
      setImages([]);
      onImagesChange?.([]);

      return data;
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Export upload function for external use
  const handleUpload = useCallback(uploadImages, [studyHallId, images, toast, onImagesChange]);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!disabled && (
        <Card 
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CardContent className="p-8 text-center">
            {uploading ? (
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
            ) : (
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            )}
            <p className="text-sm text-muted-foreground mb-2">
              {uploading ? "Processing images..." : "Drop images here or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">
              Up to {maxImages} images, max 5MB each
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </CardContent>
        </Card>
      )}

      {/* Image Preview Grid */}
      {allImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allImages.map((image) => (
            <Card key={image.id} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square relative overflow-hidden rounded-md">
                  <img
                    src={image.url}
                    alt="Study hall"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  
                  {/* Main Image Badge */}
                  {image.isMain && (
                    <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                      <Star className="h-3 w-3 mr-1" />
                      Main
                    </Badge>
                  )}

                  {/* Action Buttons */}
                  {!disabled && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      {!image.isMain && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMainImage(image.id);
                          }}
                          title="Set as main image"
                        >
                          <StarOff className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(image.id);
                        }}
                        title="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Summary */}
      {images.length > 0 && !disabled && (
        <div className="text-sm text-muted-foreground">
          {images.length} new image(s) ready to upload
        </div>
      )}
    </div>
  );
}

// Helper function to convert file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove data:image/xxx;base64, prefix
    };
    reader.onerror = reject;
  });
}

export { type UploadedImage };