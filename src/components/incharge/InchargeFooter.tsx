import { Building, Users, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrandSettings } from "@/hooks/useBrandSettings";

export const InchargeFooter = () => {
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
                "Incharge Portal - Manage study halls efficiently and effectively."}
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
              Hall Management
            </Button>
            <Button variant="link" size="sm" className="text-xs h-auto p-0">
              Best Practices
            </Button>
            <Button variant="link" size="sm" className="text-xs h-auto p-0">
              Training Center
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};