import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNews } from "@/hooks/useNews";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface NewsModalProps {
  news?: Tables<"news_posts">;
  isEdit?: boolean;
  trigger?: React.ReactNode;
  onClose?: () => void;
}

export function NewsModal({ news, isEdit = false, trigger, onClose }: NewsModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: news?.title || "",
    content: news?.content || "",
    image_url: news?.image_url || "",
    video_url: news?.video_url || "",
    visible_to: news?.visible_to || "both" as const,
    status: news?.status || "active",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { createNews, updateNews } = useNews();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit && news) {
        await updateNews(news.id, formData);
      } else {
        await createNews(formData);
      }
      
      setOpen(false);
      onClose?.();
      
      // Reset form if creating new
      if (!isEdit) {
        setFormData({
          title: "",
          content: "",
          image_url: "",
          video_url: "",
          visible_to: "both",
          status: "active",
        });
      }
    } catch (error) {
      console.error("Error saving news:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return null;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `news/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('news-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('news-media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast({
        title: "Invalid File",
        description: "Please select an image or video file.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    const uploadedUrl = await handleFileUpload(file);
    
    if (uploadedUrl) {
      if (isImage) {
        handleChange("image_url", uploadedUrl);
      } else {
        handleChange("video_url", uploadedUrl);
      }
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFormData(prev => ({ ...prev, image_url: "", video_url: "" }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>{isEdit ? "Edit News" : "Create News"}</Button>}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-sm sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg sm:text-xl">{isEdit ? "Edit News Post" : "Create News Post"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main form grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Left column - Basic info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="visible_to" className="text-sm font-medium">Visible To</Label>
                  <Select value={formData.visible_to} onValueChange={(value) => handleChange("visible_to", value)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Users & Merchants</SelectItem>
                      <SelectItem value="user">Users Only</SelectItem>
                      <SelectItem value="merchant">Merchants Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Right column - Media upload */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Media Upload</Label>
                <div className="mt-1.5 space-y-3">
                  {/* Upload area */}
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-muted-foreground/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="media-upload"
                    />
                    <label
                      htmlFor="media-upload"
                      className="flex flex-col items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <div className="text-sm">
                        {uploading ? (
                          <span className="text-primary">Uploading...</span>
                        ) : (
                          <>
                            <span className="font-medium">Click to upload</span>
                            <br />
                            <span className="text-muted-foreground">Image or video file</span>
                          </>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* File preview */}
                  {selectedFile && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                      <div className="text-sm">
                        <div className="font-medium">{selectedFile.name}</div>
                        <div className="text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeSelectedFile}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* URL inputs */}
                  <div className="pt-3 border-t border-muted-foreground/20">
                    <div className="text-xs text-muted-foreground mb-3">Or enter URLs manually:</div>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label htmlFor="image_url" className="text-xs">Image URL</Label>
                        <Input
                          id="image_url"
                          type="url"
                          value={formData.image_url}
                          onChange={(e) => handleChange("image_url", e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="mt-1 text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="video_url" className="text-xs">Video URL</Label>
                        <Input
                          id="video_url"
                          type="url"
                          value={formData.video_url}
                          onChange={(e) => handleChange("video_url", e.target.value)}
                          placeholder="https://example.com/video.mp4"
                          className="mt-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Full width content section */}
          <div>
            <Label htmlFor="content" className="text-sm font-medium">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange("content", e.target.value)}
              rows={6}
              className="mt-1.5 resize-none"
              placeholder="Write your news content here..."
              required
            />
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-muted-foreground/20">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)} 
              className="flex-1 sm:flex-none sm:w-24"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || uploading} 
              className="flex-1 sm:flex-none sm:w-32"
            >
              {loading ? "Saving..." : (isEdit ? "Update" : "Create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}