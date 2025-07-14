import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft, QrCode, Ticket } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import QRCodeLib from "qrcode";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodePreview, setQrCodePreview] = useState<string>("");

  useEffect(() => {
    console.log('PaymentSuccess: Component mounted');
    const initializeSuccessPage = async () => {
      // Extract booking info from URL params if available
      const bookingId = searchParams.get('booking_id');
      const transactionId = searchParams.get('transaction_id');
      const amount = searchParams.get('amount');
      const studyHallId = searchParams.get('study_hall_id');
      const error = searchParams.get('error');
      
      console.log('PaymentSuccess: URL params:', { bookingId, transactionId, amount, studyHallId, error });
      
      if (error === 'booking_creation') {
        toast({
          title: "Payment Successful, Booking Issue",
          description: "Your payment was processed but there was an issue creating the booking. Please contact support.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // For successful payments, try to fetch the actual booking data
      if (bookingId) {
        try {
          const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select(`
              *,
              study_hall:study_halls(name, location),
              seat:seats(seat_id, row_name, seat_number),
              booking_number
            `)
            .eq('id', bookingId)
            .single();

          if (!bookingError && booking) {
            const details = {
              bookingId: booking.id,
              bookingNumber: booking.booking_number,
              studyHallName: booking.study_hall?.name,
              seatInfo: `${booking.seat?.row_name}${booking.seat?.seat_number}`,
              amount: booking.total_amount,
              startDate: booking.start_date,
              endDate: booking.end_date,
              period: booking.booking_period
            };
            setBookingDetails(details);

            // Generate QR code preview for confirmed bookings
            if (booking.status === 'confirmed' || booking.status === 'completed') {
              try {
                const qrData = {
                  type: "study_hall_booking",
                  booking_id: booking.id,
                  study_hall: booking.study_hall?.name,
                  seat: `${booking.seat?.row_name}${booking.seat?.seat_number}`,
                  amount: booking.total_amount
                };
                const qrCodeUrl = await QRCodeLib.toDataURL(JSON.stringify(qrData), {
                  width: 128,
                  margin: 1,
                  color: { dark: '#000000', light: '#FFFFFF' }
                });
                setQrCodePreview(qrCodeUrl);
              } catch (error) {
                console.error('Error generating QR preview:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching booking details:', error);
        }
      } else if (transactionId) {
        // Try to fetch transaction and linked booking
        try {
          const { data: transaction, error: txnError } = await supabase
            .from('transactions')
            .select(`
              *,
              booking:bookings(
                *,
                study_hall:study_halls(name, location),
                seat:seats(seat_id, row_name, seat_number),
                booking_number
              )
            `)
            .eq('id', transactionId)
            .single();

          if (!txnError && transaction) {
            if (transaction.booking) {
              setBookingDetails({
                bookingId: transaction.booking.id,
                bookingNumber: transaction.booking.booking_number,
                studyHallName: transaction.booking.study_hall?.name,
                seatInfo: `${transaction.booking.seat?.row_name}${transaction.booking.seat?.seat_number}`,
                amount: transaction.booking.total_amount,
                startDate: transaction.booking.start_date,
                endDate: transaction.booking.end_date,
                period: transaction.booking.booking_period
              });
            } else {
              setBookingDetails({
                transactionId: transaction.id,
                amount: transaction.amount,
                status: 'Payment processed, booking being created...'
              });
            }
          }
        } catch (error) {
          console.error('Error fetching transaction details:', error);
        }
      }
      
      // Set basic booking details from URL params if no database data
      if (!bookingDetails && (bookingId || transactionId || amount)) {
        setBookingDetails({
          bookingId,
          transactionId,
          amount,
          studyHallId
        });
      }

      // Show success message
      toast({
        title: "Payment Successful!",
        description: "Your booking has been confirmed successfully.",
      });

      setLoading(false);
    };

    initializeSuccessPage();
  }, [searchParams, toast]);

  const handleGoToDashboard = () => {
    console.log('PaymentSuccess: Navigating to dashboard for user role:', user?.role);
    
    // Navigate to appropriate dashboard and trigger refresh
    if (user?.role === 'student') {
      navigate('/student/dashboard', { 
        replace: true,
        state: { refreshBookings: true }
      });
    } else if (user?.role === 'merchant') {
      navigate('/merchant/dashboard', { 
        replace: true,
        state: { refreshBookings: true, activeTab: 'bookings' }
      });
    } else if (user?.role === 'admin') {
      navigate('/admin/dashboard', { 
        replace: true,
        state: { refreshBookings: true }
      });
    } else {
      navigate('/', { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">Loading payment details...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-success" />
          </div>
          <CardTitle className="text-2xl text-success">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Your booking has been confirmed successfully.
          </p>
          
          {bookingDetails && (
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              {(bookingDetails.bookingNumber || bookingDetails.bookingId) && (
                <p><strong>Booking ID:</strong> #{bookingDetails.bookingNumber ? bookingDetails.bookingNumber.toString().padStart(6, '0') : 'Processing...'}</p>
              )}
              {bookingDetails.studyHallName && (
                <p><strong>Study Hall:</strong> {bookingDetails.studyHallName}</p>
              )}
              {bookingDetails.seatInfo && (
                <p><strong>Seat:</strong> {bookingDetails.seatInfo}</p>
              )}
              {bookingDetails.period && (
                <p><strong>Period:</strong> {bookingDetails.period}</p>
              )}
              {bookingDetails.amount && (
                <p><strong>Amount:</strong> ₹{bookingDetails.amount}</p>
              )}
              {bookingDetails.transactionId && !bookingDetails.bookingId && (
                <p><strong>Transaction ID:</strong> {bookingDetails.transactionId}</p>
              )}
              {bookingDetails.status && (
                <p className="text-blue-600"><strong>Status:</strong> {bookingDetails.status}</p>
              )}
            </div>
          )}

          {/* QR Code Preview */}
          {qrCodePreview && (
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 p-4 rounded-lg border border-primary/20">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Ticket className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Your Digital Ticket</span>
              </div>
              <div className="flex justify-center mb-3">
                <div className="p-2 bg-white rounded-lg border">
                  <img src={qrCodePreview} alt="Booking QR Code" className="w-20 h-20" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Full ticket with QR code available in your dashboard
              </p>
            </div>
          )}

          <div className="pt-4">
            <Button 
              onClick={handleGoToDashboard} 
              className="w-full mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Your booking will be visible in your dashboard
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;