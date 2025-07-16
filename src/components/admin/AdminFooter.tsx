import { Heart, Shield, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrandSettings } from "@/hooks/useBrandSettings";

export const AdminFooter = () => {
  const { brandSettings } = useBrandSettings();
  const currentYear = new Date().getFullYear();
  const lastUpdate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 lg:px-6 py-4">
        {/* Main Footer Content */}

        {/* Bottom Section - Extended Info */}
        <div className="mt-3 pt-3 border-t flex flex-col lg:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-4">
            <span>
              {brandSettings.copyright_text || 
               "All rights reserved. Built with care for educational institutions."}
            </span>
            {brandSettings.support_email && (
              <>
                <div className="hidden lg:block w-px h-3 bg-border" />
                <span>Support: {brandSettings.support_email}</span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="link" size="sm" className="text-xs h-auto p-0">
              Privacy Policy
            </Button>
            <Button variant="link" size="sm" className="text-xs h-auto p-0">
              Terms of Service
            </Button>
            <Button variant="link" size="sm" className="text-xs h-auto p-0">
              Data Processing
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};