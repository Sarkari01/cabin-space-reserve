import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    console.log('PaymentSuccess: Component mounted');
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
    }
    
    // For successful payments, show success message
    if (bookingId || transactionId) {
      toast({
        title: "Payment Successful!",
        description: "Your booking has been confirmed successfully.",
      });
    }
    
    if (bookingId || transactionId || amount) {
      setBookingDetails({
        bookingId,
        transactionId,
        amount,
        studyHallId
      });
    }
  }, [searchParams, toast]);

  const handleGoToDashboard = () => {
    console.log('PaymentSuccess: Navigating to dashboard for user role:', user?.role);
    if (user?.role === 'student') {
      navigate('/student/dashboard');
    } else if (user?.role === 'merchant') {
      navigate('/merchant/dashboard');
    } else if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/');
    }
    
    // Trigger a page refresh to ensure bookings are fetched
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

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
              {bookingDetails.bookingId && (
                <p><strong>Booking ID:</strong> {bookingDetails.bookingId}</p>
              )}
              {bookingDetails.transactionId && !bookingDetails.bookingId && (
                <p><strong>Transaction ID:</strong> {bookingDetails.transactionId}</p>
              )}
              {bookingDetails.amount && (
                <p><strong>Amount:</strong> ₹{bookingDetails.amount}</p>
              )}
            </div>
          )}

          <div className="pt-4">
            <Button onClick={handleGoToDashboard} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;