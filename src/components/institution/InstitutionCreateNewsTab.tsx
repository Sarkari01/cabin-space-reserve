import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useNews } from "@/hooks/useNews";
import { useToast } from "@/hooks/use-toast";
import { useInstitutions } from "@/hooks/useInstitutions";
import { NewsMediaUpload } from "@/components/NewsMediaUpload";
import { NewsPreviewModal } from "@/components/NewsPreviewModal";
import { NewsScheduleModal } from "@/components/NewsScheduleModal";
import { Plus, Save, Eye, Calendar } from "lucide-react";

interface InstitutionCreateNewsTabProps {
  institutionId?: string;
}

export function InstitutionCreateNewsTab({ institutionId }: InstitutionCreateNewsTabProps) {
  const { createNews, loading } = useNews();
  const { currentInstitution } = useInstitutions();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    status: "active" as const,
    visible_to: "both" as const,
    image_url: "",
    video_url: ""
  });
  
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  // Show loading state if institution is not loaded yet
  if (!institutionId) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Loading institution details...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent, publishNow: boolean = true) => {
    e.preventDefault();
    
    console.log('Creating news post with institution ID:', institutionId);
    
    if (!institutionId) {
      toast({
        title: "Error",
        description: "Institution ID is missing. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: "Validation Error", 
        description: "Content is required",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      const newsData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        status: publishNow ? formData.status : 'draft',
        visible_to: formData.visible_to,
        image_url: formData.image_url.trim() || null,
        video_url: formData.video_url.trim() || null,
        institution_id: institutionId
      };
      
      console.log('News data being submitted:', newsData);
      
      const result = await createNews(newsData);
      
      if (result) {
        toast({
          title: "Success",
          description: publishNow ? "News post published successfully" : "News post saved as draft",
        });
        
        // Reset form only on success
        setFormData({
          title: "",
          content: "",
          status: "active",
          visible_to: "both",
          image_url: "",
          video_url: ""
        });
      }
    } catch (error: any) {
      console.error('Error creating news:', error);
      
      let errorMessage = "Failed to create news post";
      
      // Handle specific RLS errors
      if (error?.message?.includes('row-level security')) {
        errorMessage = "You don't have permission to create news posts for this institution";
      } else if (error?.message?.includes('institution_id')) {
        errorMessage = "Invalid institution. Please contact support.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSchedule = async (scheduledAt: Date, title: string, content: string) => {
    if (!institutionId) {
      toast({
        title: "Error",
        description: "Institution ID is missing. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      const newsData = {
        title: title.trim(),
        content: content.trim(),
        status: 'scheduled',
        visible_to: formData.visible_to,
        image_url: formData.image_url.trim() || null,
        video_url: formData.video_url.trim() || null,
        institution_id: institutionId,
        scheduled_at: scheduledAt.toISOString()
      };
      
      const result = await createNews(newsData);
      
      if (result) {
        toast({
          title: "Success",
          description: `News post scheduled for ${scheduledAt.toLocaleDateString()} at ${scheduledAt.toLocaleTimeString()}`,
        });
        
        // Reset form and close modals
        setFormData({
          title: "",
          content: "",
          status: "active",
          visible_to: "both",
          image_url: "",
          video_url: ""
        });
        setShowSchedule(false);
        setShowPreview(false);
      }
    } catch (error: any) {
      console.error('Error scheduling news:', error);
      toast({
        title: "Error",
        description: "Failed to schedule news post",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create News Post
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                rows={8}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visible_to">Visibility</Label>
                <Select value={formData.visible_to} onValueChange={(value) => handleInputChange('visible_to', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Everyone</SelectItem>
                    <SelectItem value="user">Students Only</SelectItem>
                    <SelectItem value="merchant">Merchants Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <NewsMediaUpload
              onImageUploaded={(url) => handleInputChange('image_url', url)}
              onVideoUploaded={(url) => handleInputChange('video_url', url)}
              currentImageUrl={formData.image_url}
              currentVideoUrl={formData.video_url}
              onImageRemoved={() => handleInputChange('image_url', '')}
              onVideoRemoved={() => handleInputChange('video_url', '')}
              disabled={saving || loading}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={saving || loading}>
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {formData.status === 'active' ? 'Publish' : 'Save Draft'}
                  </>
                )}
              </Button>
              
              <Button type="button" variant="outline" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              
              <Button type="button" variant="outline" onClick={() => setShowSchedule(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Writing Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Writing Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Keep your title clear and engaging (under 100 characters)</p>
            <p>• Use headings and bullet points to organize content</p>
            <p>• Include relevant images or videos to enhance engagement</p>
            <p>• Save as draft first to review before publishing</p>
            <p>• Consider your target audience when setting visibility</p>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <NewsPreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        formData={formData}
        institutionName={currentInstitution?.name}
        onSchedule={() => {
          setShowPreview(false);
          setShowSchedule(true);
        }}
        onPublish={async () => {
          setShowPreview(false);
          await handleSubmit(new Event('submit') as any, true);
        }}
      />

      {/* Schedule Modal */}
      <NewsScheduleModal
        open={showSchedule}
        onOpenChange={setShowSchedule}
        onSchedule={handleSchedule}
        initialData={{
          title: formData.title,
          content: formData.content
        }}
        loading={saving}
      />
    </div>
  );
}