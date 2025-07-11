import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNews } from "@/hooks/useNews";
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
  const { createNews, updateNews } = useNews();

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>{isEdit ? "Edit News" : "Create News"}</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
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