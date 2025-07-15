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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit News Post" : "Create News Post"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange("content", e.target.value)}
              rows={4}
              required
            />
          </div>
          
          {/* File Upload Section */}
          <div>
            <Label>Media Upload</Label>
            <div className="space-y-3">
              {/* Upload Button */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="media-upload"
                />
                <label
                  htmlFor="media-upload"
                  className="flex items-center gap-2 px-4 py-2 border border-input rounded-md cursor-pointer hover:bg-accent transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload Image/Video"}
                </label>
                {selectedFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeSelectedFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* File Preview */}
              {selectedFile && (
                <div className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name}
                </div>
              )}

              {/* URL inputs as alternative */}
              <div className="text-sm text-muted-foreground border-t pt-3">
                Or enter URLs manually:
              </div>
              
              <div>
                <Label htmlFor="image_url">Image URL (optional)</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => handleChange("image_url", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div>
                <Label htmlFor="video_url">Video URL (optional)</Label>
                <Input
                  id="video_url"
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => handleChange("video_url", e.target.value)}
                  placeholder="https://example.com/video.mp4"
                />
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="visible_to">Visible To</Label>
            <Select value={formData.visible_to} onValueChange={(value) => handleChange("visible_to", value)}>
              <SelectTrigger>
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
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : (isEdit ? "Update" : "Create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}