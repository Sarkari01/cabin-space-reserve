
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QrCode, Download, Eye, RefreshCw, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StudyHall {
  id: string;
  name: string;
  qr_code_url?: string;
  qr_booking_enabled: boolean;
}

interface QRCodeManagerProps {
  studyHall: StudyHall;
  onUpdate: () => void;
}

export function QRCodeManager({ studyHall, onUpdate }: QRCodeManagerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-qr-code', {
        body: { studyHallId: studyHall.id }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "QR Code Generated!",
          description: `Scannable QR code for ${data.studyHallName} has been created successfully.`,
        });
        onUpdate();
      } else {
        throw new Error(data.error || 'Failed to generate QR code');
      }
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = async () => {
    if (!studyHall.qr_code_url) {
      toast({
        title: "No QR Code",
        description: "Please generate a QR code first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Add timestamp to prevent caching issues
      const downloadUrl = `${studyHall.qr_code_url}?t=${Date.now()}`;
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Verify it's a valid image
      if (!blob.type.startsWith('image/')) {
        throw new Error('Downloaded file is not a valid image');
      }
      
      const url = window.URL.createObjectURL(blob);
      const fileName = `qr-code-${studyHall.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}.png`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Downloaded Successfully!",
        description: `QR code image "${fileName}" has been downloaded.`,
      });
    } catch (error: any) {
      console.error('Error downloading QR code:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleQRBooking = async () => {
    try {
      const { error } = await supabase
        .from('study_halls')
        .update({ qr_booking_enabled: !studyHall.qr_booking_enabled })
        .eq('id', studyHall.id);

      if (error) {
        throw error;
      }

      toast({
        title: studyHall.qr_booking_enabled ? "QR Booking Disabled" : "QR Booking Enabled",
        description: `QR code booking has been ${studyHall.qr_booking_enabled ? 'disabled' : 'enabled'} for ${studyHall.name}.`,
      });
      
      onUpdate();
    } catch (error: any) {
      console.error('Error toggling QR booking:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update QR booking settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getBookingUrl = () => {
    const domain = window.location.origin;
    return `${domain}/studyhall/${studyHall.id}/booking`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Booking
          </div>
          <Badge variant={studyHall.qr_booking_enabled ? "default" : "secondary"}>
            {studyHall.qr_booking_enabled ? "Enabled" : "Disabled"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Generate a scannable QR code that allows guests to book seats without creating an account.
        </p>

        {/* QR Code Status */}
        {studyHall.qr_code_url ? (
          <div className="flex items-center justify-between p-4 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={studyHall.qr_code_url}
                  alt="Scannable QR Code"
                  className="w-16 h-16 border-2 border-success/30 rounded-lg shadow-sm"
                  onError={(e) => {
                    console.error('QR code image failed to load');
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background"></div>
              </div>
              <div>
                <p className="font-semibold text-success-foreground">✓ Scannable QR Code Ready</p>
                <p className="text-sm text-muted-foreground">PNG format • Click to test scan or download</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Size: 512x512px • High quality for printing
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(true)}
                className="gap-1"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQRCode}
                className="gap-1"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <QrCode className="h-16 w-16 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              No scannable QR code generated yet
            </p>
            <p className="text-xs text-muted-foreground">
              Generate a high-quality QR code for guest bookings
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={generateQRCode}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating Scannable QR...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                {studyHall.qr_code_url ? "Regenerate Scannable QR Code" : "Generate Scannable QR Code"}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={toggleQRBooking}
            className="w-full"
          >
            {studyHall.qr_booking_enabled ? "Disable QR Booking" : "Enable QR Booking"}
          </Button>

          {studyHall.qr_booking_enabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(getBookingUrl(), '_blank')}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview Booking Page
            </Button>
          )}
        </div>

        {/* Booking URL */}
        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Booking URL:</p>
          <code className="bg-muted px-2 py-1 rounded text-xs break-all">
            {getBookingUrl()}
          </code>
        </div>
      </CardContent>

      {/* QR Code Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">QR Code for {studyHall.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {studyHall.qr_code_url && (
              <div className="text-center">
                <div className="relative inline-block">
                  <img
                    src={studyHall.qr_code_url}
                    alt="Scannable QR Code"
                    className="w-72 h-72 mx-auto border-2 border-muted rounded-xl shadow-lg"
                    onError={(e) => {
                      console.error('QR code preview failed to load');
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-success text-success-foreground text-xs px-2 py-1 rounded-full font-medium">
                    Scannable
                  </div>
                </div>
              </div>
            )}
            <div className="text-center space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  📱 <strong>How to use:</strong>
                </p>
                <ol className="text-xs text-muted-foreground text-left space-y-1">
                  <li>1. Print this QR code or display on screen</li>
                  <li>2. Guests scan with any QR scanner app</li>
                  <li>3. They can book seats without creating account</li>
                </ol>
              </div>
              
              <div className="space-y-2">
                <Button onClick={downloadQRCode} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download High-Quality PNG
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(getBookingUrl(), '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Test Booking Page
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
