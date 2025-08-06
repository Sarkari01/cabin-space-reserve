import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, QrCode, Home } from "lucide-react";
import QRCode from "qrcode";
import { safeFormatDate } from "@/lib/dateUtils";

interface CabinBooking {
  id: string;
  booking_number: number;
  start_date: string;
  end_date: string;
  months_booked: number;
  monthly_amount: number;
  total_amount: number;
  status: string;
  user_id?: string;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  cabin?: {
    cabin_name: string;
    amenities?: string[];
  };
  private_hall?: {
    name: string;
    location: string;
  };
  user?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
}

interface CabinBookingQRCodeProps {
  booking: CabinBooking;
  userRole: "student" | "merchant" | "admin" | "incharge";
}

export function CabinBookingQRCode({ booking, userRole }: CabinBookingQRCodeProps) {
  const [qrCodeData, setQrCodeData] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateQRCode = async () => {
      if (!booking) return;

      // Create QR code data structure for cabin booking
      const qrData = {
        type: "cabin_booking",
        booking_id: booking.id,
        booking_number: booking.booking_number,
        user_name: booking.user?.full_name || booking.guest_name || "N/A",
        user_email: booking.user?.email || booking.guest_email || "N/A",
        user_phone: booking.user?.phone || booking.guest_phone || "N/A",
        private_hall: booking.private_hall?.name || "Private Hall",
        location: booking.private_hall?.location || "N/A",
        cabin: booking.cabin?.cabin_name || "Cabin",
        months_booked: booking.months_booked,
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
        console.error('Error generating cabin QR code:', error);
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
    link.download = `cabin-booking-ticket-${booking.booking_number || 'ticket'}.png`;
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
        {/* Cabin Ticket Header */}
        <div className="bg-primary text-primary-foreground p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Home className="h-5 w-5" />
            <span className="font-bold text-lg">PRIVATE CABIN TICKET</span>
          </div>
          <p className="text-sm opacity-90">
            Booking #{booking.booking_number ? `CB${booking.booking_number}` : 'Pending'}
          </p>
        </div>

        {/* Ticket Body */}
        <div className="p-6 space-y-4">
          {/* QR Code */}
          <div className="text-center">
            <div className="inline-block p-2 sm:p-4 bg-white rounded-lg shadow-inner border">
              <img 
                src={qrCodeData} 
                alt="Cabin Booking QR Code" 
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
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Private Hall</p>
                <p className="font-medium">{booking.private_hall?.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Cabin</p>
                <p className="font-medium text-lg">{booking.cabin?.cabin_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Duration</p>
                <p className="font-medium">{booking.months_booked} month{booking.months_booked > 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Location</p>
                <p className="font-medium">{booking.private_hall?.location}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Period</p>
                <p className="font-medium">
                  {formatDate(booking.start_date)}
                  {booking.start_date !== booking.end_date && (
                    <> - {formatDate(booking.end_date)}</>
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Total Amount</p>
                <p className="font-bold text-lg text-success">₹{Number(booking.total_amount).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Amenities */}
          {booking.cabin?.amenities && booking.cabin.amenities.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Cabin Amenities</p>
              <div className="flex flex-wrap gap-1">
                {booking.cabin.amenities.map((amenity, index) => (
                  <span 
                    key={index}
                    className="inline-block px-2 py-1 bg-secondary/50 text-xs rounded-full"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Customer Info (only for merchants/admins/incharges) */}
          {(userRole === 'merchant' || userRole === 'admin' || userRole === 'incharge') && (
            <div className="border-t pt-4">
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Customer</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">
                    {booking.user?.full_name || booking.guest_name || 'N/A'}
                  </p>
                  <p className="text-muted-foreground">
                    {booking.user?.email || booking.guest_email}
                  </p>
                  {(booking.user?.phone || booking.guest_phone) && (
                    <p className="text-muted-foreground text-xs">
                      {booking.user?.phone || booking.guest_phone}
                    </p>
                  )}
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
            <p>Present this QR code at the private hall entrance</p>
            <p className="mt-1">Generated on {safeFormatDate(new Date(), 'MMM d, yyyy')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}