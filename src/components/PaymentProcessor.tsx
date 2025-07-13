import { useState } from "react";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { useToast } from "@/hooks/use-toast";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { createBookingFromIntent } from "./BookingCreator";
import { Loader2, QrCode } from "lucide-react";

interface PaymentProcessorProps {
  bookingIntent: {
    study_hall_id: string;
    seat_id: string;
    booking_period: "daily" | "weekly" | "monthly";
    start_date: string;
    end_date: string;
    total_amount: number;
  };
  onPaymentSuccess: (booking?: any) => void;
  onCancel: () => void;
}

export const PaymentProcessor = ({ bookingIntent, onPaymentSuccess, onCancel }: PaymentProcessorProps) => {
  const [selectedMethod, setSelectedMethod] = useState("");
  const [processing, setProcessing] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);
  const { user } = useAuth();
  const { createTransaction, updateTransactionStatus } = useTransactions();
  const { settings } = useBusinessSettings();
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast({
        title: "Error",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      switch (selectedMethod) {
        case "ekqr":
          await handleEKQRPayment();
          break;
        case "razorpay":
          await handleRazorpayPayment();
          break;
        case "offline":
          await handleOfflinePayment();
          break;
        default:
          throw new Error("Invalid payment method");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleEKQRPayment = async () => {
    try {
      console.log('💳 EKQR: Starting payment process for booking intent');
      
      // Validate business settings first
      if (!settings?.ekqr_enabled) {
        throw new Error("EKQR payments are currently disabled. Please try another payment method.");
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Create transaction record with booking intent data
      const transaction = await createTransaction({
        booking_id: null, // No booking exists yet
        amount: bookingIntent.total_amount,
        payment_method: "ekqr",
        payment_data: {
          bookingIntent: bookingIntent
        }
      });

      if (!transaction) {
        throw new Error("Failed to create transaction record");
      }

      console.log('✅ EKQR: Transaction created:', transaction.id);

      // Create EKQR order using the edge function
      console.log('🌐 EKQR: Invoking edge function...');
      const { data: orderResponse, error } = await supabase.functions.invoke('ekqr-payment', {
        body: {
          action: 'createOrder',
          amount: bookingIntent.total_amount,
          bookingId: transaction.id, // Use transaction ID as temporary identifier
          customerName: user?.user_metadata?.full_name || user?.email || 'Customer',
          customerEmail: user?.email || 'customer@example.com',
          customerMobile: user?.user_metadata?.phone || '9999999999',
          studyHallId: bookingIntent.study_hall_id,
          seatId: bookingIntent.seat_id
        },
      });

      console.log('📡 EKQR: Function response:', { orderResponse, error });

      if (error) {
        console.error('❌ EKQR Payment Error:', error);
        
        // Provide more user-friendly error messages
        let userMessage = "Failed to create payment order. Please try again.";
        if (error.message?.includes('EKQR_API_KEY not configured')) {
          userMessage = "EKQR payment service is not configured. Please contact support.";
        } else if (error.message?.includes('Invalid amount')) {
          userMessage = "Invalid payment amount. Please refresh and try again.";
        } else if (error.message?.includes('API Error')) {
          userMessage = "Payment service is temporarily unavailable. Please try Razorpay or offline payment.";
        }
        
        toast({
          title: "EKQR Payment Failed",
          description: userMessage,
          variant: "destructive",
        });
        throw new Error(error.message || 'Failed to create order');
      }

      if (!orderResponse?.success || !orderResponse?.orderId) {
        throw new Error("Invalid order response received");
      }

      // Update transaction with EKQR order details
      await supabase
        .from('transactions')
        .update({
          payment_id: orderResponse.orderId,
          payment_data: {
            bookingIntent: bookingIntent,
            sessionId: orderResponse.sessionId,
            paymentUrl: orderResponse.paymentUrl,
            upiIntent: orderResponse.upiIntent,
            isUtrRequired: orderResponse.isUtrRequired
          }
        })
        .eq('id', transaction.id);

      console.log('✅ EKQR: Order created successfully');
      setQrData(orderResponse);
      setShowQR(true);

      // Start polling for payment status
      startPaymentPolling(orderResponse.orderId, transaction.id);

      toast({
        title: "Payment Options Ready",
        description: "Choose your preferred payment method below",
      });
    } catch (error) {
      console.error('💥 EKQR payment error:', error);
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Unable to set up EKQR payment. Please try another method.",
        variant: "destructive",
      });
    }
  };

  const startPaymentPolling = async (orderId: string, transactionId: string) => {
    console.log('Starting enhanced payment polling for order:', orderId);
    setShowQR(true);
    
    const maxAttempts = 120; // Poll for 10 minutes (every 5 seconds)
    let attempts = 0;
    let backoffDelay = 5000; // Start with 5 second delay
    
    const pollPaymentStatus = async (): Promise<boolean> => {
      if (attempts >= maxAttempts) {
        console.log('Payment polling timeout reached');
        setProcessing(false);
        setShowQR(false);
        toast({
          title: "Payment Verification Timeout",
          description: "Payment verification taking longer than expected. Please check your bookings or contact support.",
          variant: "destructive",
        });
        return false;
      }
      
      attempts++;
      console.log(`Enhanced payment polling attempt ${attempts}/${maxAttempts}`);
      
      try {
        // First check local transaction status (faster via real-time)
        const { data: transactionCheck } = await supabase
          .from('transactions')
          .select('status, booking_id')
          .eq('id', transactionId)
          .single();
        
        if (transactionCheck?.status === 'completed') {
          console.log('Payment confirmed via real-time update!');
          setProcessing(false);
          setShowQR(false);
          toast({
            title: "Payment Successful!",
            description: "Your booking has been confirmed!",
          });
          
          // Fetch the booking details if available
          if (transactionCheck.booking_id) {
            const { data: booking } = await supabase
              .from('bookings')
              .select('*, study_hall:study_halls(*), seat:seats(*)')
              .eq('id', transactionCheck.booking_id)
              .single();
            
            if (booking) {
              onPaymentSuccess(booking);
              return true;
            }
          }
          
          // Fallback - just trigger success
          onPaymentSuccess(null);
          return true;
        }
        
        // If still pending locally, check with EKQR API (with exponential backoff for API calls)
        if (attempts % 3 === 0) { // Only call EKQR API every 3rd attempt to reduce load
          const { data, error } = await supabase.functions.invoke('ekqr-payment', {
            body: { 
              action: 'checkOrderStatus',
              orderId: orderId,
              transactionId: transactionId
            }
          });
          
          if (!error && data) {
            console.log('EKQR payment status response:', data);
            
            if (data.status === 'SUCCESS' || data.paid === true) {
              console.log('Payment successful via EKQR API!');
              setProcessing(false);
              setShowQR(false);
              toast({
                title: "Payment Successful!",
                description: "Your booking has been confirmed!",
              });
              onPaymentSuccess(data.booking);
              return true;
            } else if (data.status === 'FAILED') {
              console.log('Payment failed via EKQR API');
              setProcessing(false);
              setShowQR(false);
              toast({
                title: "Payment Failed",
                description: "Payment was not completed. Please try again.",
                variant: "destructive",
              });
              return false;
            }
          }
        }
        
        // Exponential backoff for delays (but cap at 10 seconds)
        if (attempts > 10) {
          backoffDelay = Math.min(backoffDelay * 1.1, 10000);
        }
        
        // Continue polling if still pending
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return pollPaymentStatus();
        
      } catch (error) {
        console.error('Payment polling error:', error);
        
        // If we get errors, slow down the polling
        backoffDelay = Math.min(backoffDelay * 1.5, 15000);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return pollPaymentStatus();
      }
    };
    
    pollPaymentStatus();
  };

  const handleRazorpayPayment = async () => {
    try {
      console.log('💳 Razorpay: Starting payment process for booking intent');
      
      // Validate business settings first
      if (!settings?.razorpay_enabled) {
        throw new Error("Razorpay payments are currently disabled. Please try another payment method.");
      }

      // Create transaction record with booking intent data
      const transaction = await createTransaction({
        booking_id: null, // No booking exists yet
        amount: bookingIntent.total_amount,
        payment_method: "razorpay",
        payment_data: {
          bookingIntent: bookingIntent
        }
      });

      if (!transaction) {
        throw new Error("Failed to create transaction record");
      }

      console.log('✅ Razorpay: Transaction created:', transaction.id);

      // Create Razorpay order
      console.log('🌐 Razorpay: Invoking edge function...');
      const { data: orderResponse, error } = await supabase.functions.invoke('razorpay-payment', {
        body: {
          action: 'create_order',
          amount: bookingIntent.total_amount,
          booking_id: transaction.id, // Use transaction ID as temporary identifier
        },
      });

      console.log('📡 Razorpay: Function response:', { orderResponse, error });

      if (error) {
        console.error('❌ Razorpay Payment Error:', error);
        
        // Provide more user-friendly error messages
        let userMessage = "Failed to initiate payment. Please try again.";
        if (error.message?.includes('MISSING_CREDENTIALS')) {
          userMessage = "Razorpay payment service is not configured. Please contact support.";
        } else if (error.message?.includes('Invalid amount')) {
          userMessage = "Invalid payment amount. Please refresh and try again.";
        } else if (error.message?.includes('Invalid Razorpay credentials')) {
          userMessage = "Payment service configuration error. Please contact support.";
        } else if (error.message?.includes('service is temporarily unavailable')) {
          userMessage = "Payment service is temporarily unavailable. Please try EKQR or offline payment.";
        }
        
        toast({
          title: "Razorpay Payment Failed", 
          description: userMessage,
          variant: "destructive",
        });
        throw new Error(error.message || 'Failed to create payment order');
      }

      if (!orderResponse?.order_id || !orderResponse?.key_id) {
        throw new Error("Invalid payment order response received");
      }

      console.log('✅ Razorpay: Order created successfully');

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        console.log('📦 Loading Razorpay checkout script...');
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = () => {
            console.log('✅ Razorpay script loaded successfully');
            resolve(null);
          };
          script.onerror = () => {
            console.error('❌ Failed to load Razorpay script');
            reject(new Error('Failed to load Razorpay checkout'));
          };
        });
      }

      // Configure Razorpay options
      const options = {
        key: orderResponse.key_id,
        amount: orderResponse.amount,
        currency: orderResponse.currency || 'INR',
        name: "Study Hall Booking",
        description: `${bookingIntent.booking_period} booking for ₹${bookingIntent.total_amount}`,
        order_id: orderResponse.order_id,
        handler: async function (response: any) {
          try {
            console.log('💰 Payment completed, verifying...', response);
            
            // Verify payment
            const { data: verifyResponse, error: verifyError } = await supabase.functions.invoke('razorpay-payment', {
              body: {
                action: 'verify_payment',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                transaction_id: transaction.id,
              },
            });

            console.log('🔍 Verification response:', { verifyResponse, verifyError });

            if (verifyError) {
              throw new Error(verifyError.message || 'Payment verification failed');
            }

            console.log('✅ Payment verified successfully - booking created automatically by edge function');
            
            toast({
              title: "Payment Successful!",
              description: "Your booking has been confirmed!",
            });
            
            // Call success callback
            onPaymentSuccess();
          } catch (error) {
            console.error('💥 Payment verification error:', error);
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Please contact support for assistance.",
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: function() {
            console.log('ℹ️ Payment modal closed by user');
            toast({
              title: "Payment Cancelled",
              description: "You can try again or choose a different payment method.",
            });
          }
        },
        theme: {
          color: "#3399cc"
        },
        retry: {
          enabled: true,
          max_count: 3
        }
      };

      console.log('🚀 Opening Razorpay checkout...');
      const rzp = new window.Razorpay(options);
      rzp.open();

      toast({
        title: "Payment Initiated",
        description: "Complete the payment in the Razorpay window",
      });
    } catch (error) {
      console.error('💥 Razorpay payment error:', error);
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Unable to set up Razorpay payment. Please try another method.",
        variant: "destructive",
      });
    }
  };

  const handleOfflinePayment = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to make a booking",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Offline: Creating transaction and booking');
      
      // Create transaction record first
      const transaction = await createTransaction({
        booking_id: null, // Will be updated after booking creation
        amount: bookingIntent.total_amount,
        payment_method: "offline",
      });

      if (!transaction) {
        throw new Error("Failed to create transaction record");
      }

      // Create booking for offline payment (immediate but pending)
      const booking = await createBookingFromIntent(
        bookingIntent, 
        user.id, 
        transaction.id, 
        'pending', 
        'unpaid'
      );
      console.log('Offline: Booking created successfully:', booking);

      toast({
        title: "Booking Reserved",
        description: "Your seat has been reserved. Please pay at the study hall.",
      });
      
      // Call success callback
      onPaymentSuccess();
      
    } catch (error: any) {
      console.error('Offline payment error:', error);
      toast({
        title: "Booking Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    }
  };

  if (showQR && qrData) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Complete Your Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            
            {qrData.upiIntent && (
              <div className="space-y-2">
                <Button 
                  onClick={() => window.open(qrData.upiIntent, '_blank')}
                  className="w-full"
                >
                  Pay with UPI App
                </Button>
              </div>
            )}
            
            {qrData.paymentUrl && (
              <div className="space-y-2">
                <Button 
                  variant="outline"
                  onClick={() => window.open(qrData.paymentUrl, '_blank')}
                  className="w-full"
                >
                  Pay via Web
                </Button>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Amount: ₹{bookingIntent.total_amount}</p>
              <p>Order ID: {qrData.orderId}</p>
              <p className="text-orange-600 font-medium mt-2">
                Do not close this window until payment is complete
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowQR(false)} className="w-full">
            Cancel Payment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Booking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h4 className="font-medium">Booking Summary</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Amount:</span>
              <span>₹{bookingIntent.total_amount}</span>
            </div>
            <div className="flex justify-between">
              <span>Period:</span>
              <span className="capitalize">{bookingIntent.booking_period}</span>
            </div>
            <div className="flex justify-between">
              <span>Duration:</span>
              <span>{bookingIntent.start_date} to {bookingIntent.end_date}</span>
            </div>
          </div>
        </div>

        <PaymentMethodSelector
          onMethodSelect={setSelectedMethod}
          selectedMethod={selectedMethod}
        />
        
        {!selectedMethod && (
          <div className="text-sm text-muted-foreground text-center">
            Please select a payment method to continue
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handlePayment} 
            disabled={!selectedMethod || processing}
            className="flex-1"
          >
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selectedMethod === "offline" ? "Reserve Seat" : selectedMethod === "razorpay" ? "Pay with Razorpay" : "Pay Now"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};