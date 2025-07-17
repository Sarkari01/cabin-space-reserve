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
          description: `QR code for ${data.studyHallName} has been created successfully.`,
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
    if (!studyHall.qr_code_url) return;
    
    try {
      const response = await fetch(studyHall.qr_code_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-code-${studyHall.name.replace(/\s+/g, '-').toLowerCase()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download QR code. Please try again.",
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
          Generate a QR code that allows guests to book seats without creating an account.
        </p>

        {/* QR Code Status */}
        {studyHall.qr_code_url ? (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <img
                src={studyHall.qr_code_url}
                alt="QR Code"
                className="w-12 h-12 border rounded"
              />
              <div>
                <p className="font-medium">QR Code Ready</p>
                <p className="text-xs text-muted-foreground">Click to preview or download</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQRCode}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <QrCode className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground mb-4">
              No QR code generated yet
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
                Generating...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                {studyHall.qr_code_url ? "Regenerate QR Code" : "Generate QR Code"}
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code for {studyHall.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {studyHall.qr_code_url && (
              <div className="text-center">
                <img
                  src={studyHall.qr_code_url}
                  alt="QR Code"
                  className="w-full max-w-64 mx-auto border rounded-lg"
                />
              </div>
            )}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Scan this QR code to book a seat at {studyHall.name}
              </p>
              <Button onClick={downloadQRCode} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}