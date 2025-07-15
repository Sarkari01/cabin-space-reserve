import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, QrCode, Ticket } from "lucide-react";
import QRCode from "qrcode";
import { Booking } from "@/hooks/useBookings";
import { safeFormatDate } from "@/lib/dateUtils";

interface BookingQRCodeProps {
  booking: Booking;
  userRole: "student" | "merchant" | "admin" | "incharge";
}

export function BookingQRCode({ booking, userRole }: BookingQRCodeProps) {
  const [qrCodeData, setQrCodeData] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateQRCode = async () => {
      if (!booking) return;

      // Create QR code data structure
      const qrData = {
        type: "study_hall_booking",
        booking_id: booking.id,
        booking_number: booking.booking_number,
        user_name: booking.user?.full_name || "N/A",
        user_email: booking.user?.email || "N/A",
        study_hall: booking.study_hall?.name || "Study Hall",
        location: booking.study_hall?.location || "N/A",
        seat: `${booking.seat?.row_name}${booking.seat?.seat_number}`,
        period: booking.booking_period,
        start_date: booking.start_date,
        end_date: booking.end_date,
        amount: Number(booking.total_amount),
        status: booking.status,
        verification_hash: `${booking.booking_number || booking.id.substring(0, 8)}-${Date.now()}`,
        generated_at: new Date().toISOString()
      };

      try {
        const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M'
        });
        setQrCodeData(qrCodeUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      } finally {
        setLoading(false);
      }
    };

    generateQRCode();
  }, [booking]);

  const downloadQRCode = () => {
    if (!qrCodeData) return;

    const link = document.createElement('a');
    link.href = qrCodeData;
    link.download = `booking-ticket-${booking.booking_number || 'ticket'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return safeFormatDate(dateString, 'MMM d, yyyy', 'Invalid Date');
  };

  if (loading) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-6">
          <div className="text-center">
            <QrCode className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Generating QR code...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20">
      <CardContent className="p-0">
        {/* Movie Ticket Header */}
        <div className="bg-primary text-primary-foreground p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Ticket className="h-5 w-5" />
            <span className="font-bold text-lg">STUDY HALL TICKET</span>
          </div>
          <p className="text-sm opacity-90">
            Booking #{booking.booking_number?.toString().padStart(6, '0') || 'Pending'}
          </p>
        </div>

        {/* Ticket Body */}
        <div className="p-6 space-y-4">
          {/* QR Code */}
          <div className="text-center">
            <div className="inline-block p-2 sm:p-4 bg-white rounded-lg shadow-inner border">
              <img 
                src={qrCodeData} 
                alt="Booking QR Code" 
                className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Scan this QR code at the venue
            </p>
          </div>

          {/* Ticket Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t pt-4">
            <div className="space-y-2">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Study Hall</p>
                <p className="font-medium">{booking.study_hall?.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Seat</p>
                <p className="font-medium text-lg">{booking.seat?.row_name}{booking.seat?.seat_number}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Period</p>
                <p className="font-medium capitalize">{booking.booking_period}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Location</p>
                <p className="font-medium">{booking.study_hall?.location}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Dates</p>
                <p className="font-medium">
                  {formatDate(booking.start_date)}
                  {booking.start_date !== booking.end_date && (
                    <> - {formatDate(booking.end_date)}</>
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Amount</p>
                <p className="font-bold text-lg text-success">₹{Number(booking.total_amount).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Customer Info (only for merchants/admins/incharges) */}
          {(userRole === 'merchant' || userRole === 'admin' || userRole === 'incharge') && (
            <div className="border-t pt-4">
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Customer</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">{booking.user?.full_name || 'N/A'}</p>
                  <p className="text-muted-foreground">{booking.user?.email}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium text-success capitalize">{booking.status}</p>
                </div>
              </div>
            </div>
          )}

          {/* Download Button */}
          <div className="border-t pt-4">
            <Button 
              onClick={downloadQRCode}
              variant="outline" 
              className="w-full"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Ticket
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground border-t pt-4">
            <p>Present this QR code at the study hall entrance</p>
            <p className="mt-1">Generated on {safeFormatDate(new Date(), 'MMM d, yyyy')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}