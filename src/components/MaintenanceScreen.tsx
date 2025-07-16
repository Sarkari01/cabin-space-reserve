import React from 'react';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { Clock, Wrench, Mail, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const MaintenanceScreen = () => {
  const { maintenanceStatus } = useMaintenanceMode();
  const { settings } = useBusinessSettings();

  const formatEstimatedReturn = (dateString: string | null) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-border/50 shadow-2xl">
        <CardContent className="p-8 text-center space-y-6">
          {/* Logo/Brand */}
          {settings?.logo_url ? (
            <img 
              src={settings.logo_url} 
              alt={settings.brand_name || 'Platform'} 
              className="h-16 mx-auto"
            />
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Wrench className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                {settings?.brand_name || 'StudySpace Platform'}
              </h1>
            </div>
          )}

          {/* Maintenance Icon */}
          <div className="relative">
            <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Wrench className="h-12 w-12 text-primary animate-pulse" />
            </div>
          </div>

          {/* Main Message */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground">
              Under Maintenance
            </h2>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              {maintenanceStatus.message}
            </p>
          </div>

          {/* Estimated Return Time */}
          {maintenanceStatus.estimatedReturn && (
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center justify-center space-x-2 text-primary">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Expected Back Online</span>
              </div>
              <p className="text-foreground font-semibold mt-2">
                {formatEstimatedReturn(maintenanceStatus.estimatedReturn)}
              </p>
            </div>
          )}

          {/* Contact Information */}
          {(settings?.support_email || settings?.support_phone) && (
            <div className="space-y-3 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground font-medium">
                Need immediate assistance?
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {settings.support_email && (
                  <a 
                    href={`mailto:${settings.support_email}`}
                    className="inline-flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{settings.support_email}</span>
                  </a>
                )}
                
                {settings.support_phone && (
                  <a 
                    href={`tel:${settings.support_phone}`}
                    className="inline-flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{settings.support_phone}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-6 text-xs text-muted-foreground">
            {settings?.copyright_text || `© ${new Date().getFullYear()} ${settings?.brand_name || 'StudySpace Platform'}. All rights reserved.`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};