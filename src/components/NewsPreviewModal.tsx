import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { format } from "date-fns";
import { Eye, Calendar } from "lucide-react";

interface NewsPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: {
    title: string;
    content: string;
    status: string;
    visible_to: string;
    image_url: string;
    video_url: string;
  };
  onSchedule?: () => void;
  onPublish?: () => void;
  institutionName?: string;
}

export function NewsPreviewModal({
  open,
  onOpenChange,
  formData,
  onSchedule,
  onPublish,
  institutionName
}: NewsPreviewModalProps) {
  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case 'both':
        return 'Everyone';
      case 'user':
        return 'Students Only';
      case 'merchant':
        return 'Merchants Only';
      default:
        return visibility;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Published';
      case 'draft':
        return 'Draft';
      case 'scheduled':
        return 'Scheduled';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'draft':
        return 'bg-warning text-warning-foreground';
      case 'scheduled':
        return 'bg-info text-info-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview News Post
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Preview Header */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">
                {institutionName && `${institutionName} • `}
                {format(new Date(), 'MMM dd, yyyy')} at {format(new Date(), 'h:mm a')}
              </div>
              <div className="flex gap-2">
                <Badge className={getStatusColor(formData.status)}>
                  {getStatusText(formData.status)}
                </Badge>
                <Badge variant="outline">
                  {getVisibilityText(formData.visible_to)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Content Preview */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold leading-tight">
              {formData.title || "Untitled News Post"}
            </h1>

            {/* Featured Image */}
            {formData.image_url && (
              <div className="w-full">
                <AspectRatio ratio={16 / 9}>
                  <img
                    src={formData.image_url}
                    alt="Featured image"
                    className="rounded-lg object-cover w-full h-full"
                  />
                </AspectRatio>
              </div>
            )}

            {/* Video */}
            {formData.video_url && (
              <div className="w-full">
                <AspectRatio ratio={16 / 9}>
                  <video
                    src={formData.video_url}
                    controls
                    className="rounded-lg w-full h-full"
                  >
                    Your browser does not support the video tag.
                  </video>
                </AspectRatio>
              </div>
            )}

            {/* Content */}
            <div className="prose prose-gray max-w-none">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {formData.content || "No content added yet."}
              </div>
            </div>
          </div>

          {/* Preview Actions */}
          <div className="border-t pt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close Preview
            </Button>
            
            {onSchedule && (
              <Button variant="outline" onClick={onSchedule}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            )}
            
            {onPublish && (
              <Button onClick={onPublish}>
                Publish Now
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}