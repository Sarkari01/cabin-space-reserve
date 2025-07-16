import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, X } from "lucide-react";
import { format, addDays, addHours } from "date-fns";

interface NewsScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (scheduledAt: Date, title: string, content: string) => void;
  initialData?: {
    title: string;
    content: string;
  };
  loading?: boolean;
}

export function NewsScheduleModal({
  open,
  onOpenChange,
  onSchedule,
  initialData,
  loading = false
}: NewsScheduleModalProps) {
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");

  // Quick schedule presets
  const quickScheduleOptions = [
    {
      label: "In 1 hour",
      value: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm")
    },
    {
      label: "Tomorrow 9 AM",
      value: format(new Date(addDays(new Date(), 1).setHours(9, 0, 0, 0)), "yyyy-MM-dd'T'HH:mm")
    },
    {
      label: "Next Monday 9 AM",
      value: format(new Date(addDays(new Date(), 7 - new Date().getDay() + 1).setHours(9, 0, 0, 0)), "yyyy-MM-dd'T'HH:mm")
    }
  ];

  const handleSchedule = () => {
    if (!scheduledAt || !title.trim() || !content.trim()) {
      return;
    }

    const scheduleDate = new Date(scheduledAt);
    
    // Validate that the scheduled time is in the future
    if (scheduleDate <= new Date()) {
      return;
    }

    onSchedule(scheduleDate, title.trim(), content.trim());
  };

  const isValidSchedule = () => {
    if (!scheduledAt || !title.trim() || !content.trim()) {
      return false;
    }
    
    const scheduleDate = new Date(scheduledAt);
    return scheduleDate > new Date();
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // At least 5 minutes in the future
    return format(now, "yyyy-MM-dd'T'HH:mm");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule News Post
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Quick Schedule Options */}
          <div className="space-y-2">
            <Label>Quick Schedule</Label>
            <div className="flex gap-2">
              {quickScheduleOptions.map((option) => (
                <Button
                  key={option.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setScheduledAt(option.value)}
                  className="text-xs"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Date/Time */}
          <div className="space-y-2">
            <Label htmlFor="scheduled-at">Custom Schedule Date & Time *</Label>
            <Input
              id="scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={getMinDateTime()}
              required
            />
            <p className="text-xs text-muted-foreground">
              Select when you want this news post to be automatically published
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="schedule-title">Title *</Label>
            <Input
              id="schedule-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter news title"
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="schedule-content">Content *</Label>
            <Textarea
              id="schedule-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your news content here..."
              rows={6}
              required
            />
          </div>

          {/* Schedule Summary */}
          {scheduledAt && isValidSchedule() && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">Scheduled for:</span>
                <span>{format(new Date(scheduledAt), "EEEE, MMMM dd, yyyy 'at' h:mm a")}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This post will be automatically published at the scheduled time.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSchedule}
            disabled={!isValidSchedule() || loading}
          >
            {loading ? "Scheduling..." : "Schedule Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}