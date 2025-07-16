import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNews } from "@/hooks/useNews";

interface InstitutionNewsModalProps {
  institutionId?: string;
  news?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  onSuccess: () => void;
}

export function InstitutionNewsModal({ 
  institutionId,
  news,
  open, 
  onOpenChange,
  mode,
  onSuccess
}: InstitutionNewsModalProps) {
  const { toast } = useToast();
  const { createNews, updateNews } = useNews();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: news?.title || "",
    content: news?.content || "",
    visible_to: news?.visible_to || "both",
    status: news?.status || "active",
    image_url: news?.image_url || "",
    video_url: news?.video_url || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionId) return;

    try {
      setSaving(true);
      
      const newsData = {
        ...formData,
        institution_id: institutionId
      };

      if (mode === "create") {
        await createNews(newsData);
        toast({
          title: "Success",
          description: "News post created successfully",
        });
      } else {
        await updateNews(news.id, formData);
        toast({
          title: "Success", 
          description: "News post updated successfully",
        });
      }
      
      onSuccess();
    } catch (error: any) {
      console.error('Error saving news:', error);
      toast({
        title: "Error",
        description: "Failed to save news post",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create News Post" : "Edit News Post"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter news title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Write your news content here..."
              rows={6}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="visible_to">Visibility</Label>
              <Select value={formData.visible_to} onValueChange={(value) => handleInputChange('visible_to', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Everyone</SelectItem>
                  <SelectItem value="user">Students Only</SelectItem>
                  <SelectItem value="merchant">Merchants Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL (Optional)</Label>
            <Input
              id="image_url"
              value={formData.image_url}
              onChange={(e) => handleInputChange('image_url', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_url">Video URL (Optional)</Label>
            <Input
              id="video_url"
              value={formData.video_url}
              onChange={(e) => handleInputChange('video_url', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Saving..." : (mode === "create" ? "Create Post" : "Update Post")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}