import { BookOpen, Heart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrandSettings } from "@/hooks/useBrandSettings";

export const StudentFooter = () => {
  const { brandSettings } = useBrandSettings();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 lg:px-6 py-4">
        {/* Bottom Section - Extended Info */}
        <div className="mt-3 pt-3 border-t flex flex-col lg:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-4">
            <span>
              {brandSettings.copyright_text || 
                "Find your perfect study space. Study better, achieve more."}
            </span>
            {brandSettings.support_email && (
              <>
                <div className="hidden lg:block w-px h-3 bg-border" />
                <span>Help: {brandSettings.support_email}</span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="link" size="sm" className="text-xs h-auto p-0">
              Study Tips
            </Button>
            <Button variant="link" size="sm" className="text-xs h-auto p-0">
              How to Book
            </Button>
            <Button variant="link" size="sm" className="text-xs h-auto p-0">
              Safety Guidelines
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};