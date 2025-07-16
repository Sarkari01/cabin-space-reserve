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
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left Section - Copyright & Platform Info */}
          <div className="flex flex-col lg:flex-row items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span>© {currentYear}</span>
                <span className="font-medium text-foreground">
                  {brandSettings.brand_name || "StudySpace"}
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                Admin Panel v2.1.0
              </Badge>
            </div>
            
            <div className="hidden lg:block w-px h-4 bg-border" />
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span className="text-xs">Platform Status: Active</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="text-xs">Last Updated: {lastUpdate}</span>
              </div>
            </div>
          </div>

          {/* Center Section - Quick Stats */}
          <div className="hidden lg:flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>System Health: Optimal</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3 text-red-500" />
              <span>Uptime: 99.9%</span>
            </div>
          </div>

          {/* Right Section - Quick Links */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs h-7">
              Documentation
            </Button>
            <Button variant="ghost" size="sm" className="text-xs h-7">
              Support
            </Button>
            <Button variant="ghost" size="sm" className="text-xs h-7">
              API Status
            </Button>
          </div>
        </div>

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