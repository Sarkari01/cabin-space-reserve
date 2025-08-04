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

interface PrivateHallImageUploadProps {
  privateHallId?: string;
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

export function PrivateHallImageUpload({
  privateHallId,
  existingImages = [],
  onImagesChange,
  disabled = false,
  maxImages = 10
}: PrivateHallImageUploadProps) {
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
    if (!privateHallId || images.length === 0) return;

    setUploading(true);
    
    try {
      const uploadPromises = images.map(async (img, index) => {
        const fileName = `private-halls/${privateHallId}/${Date.now()}-${img.file.name}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('private-hall-images')
          .upload(fileName, img.file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('private-hall-images')
          .getPublicUrl(fileName);

        // Save to database
        const { data: imageData, error: dbError } = await supabase
          .from('private_hall_images')
          .insert({
            private_hall_id: privateHallId,
            image_url: publicUrl,
            file_path: fileName,
            is_main: img.isMain,
            display_order: index,
            file_size: img.file.size,
            mime_type: img.file.type
          })
          .select()
          .single();

        if (dbError) throw dbError;

        return imageData;
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Success",
        description: "Images uploaded successfully",
      });

      // Clear local images after successful upload
      images.forEach(img => URL.revokeObjectURL(img.url));
      setImages([]);
      onImagesChange?.([]);

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
                    alt="Private hall"
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

      {/* Upload Button and Summary */}
      {images.length > 0 && !disabled && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {images.length} new image(s) ready to upload
          </div>
          <Button onClick={uploadImages} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload Images
          </Button>
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