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
  onPaymentSuccess: () => void;
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

      // Create transaction record without booking_id initially
      const transaction = await createTransaction({
        booking_id: null, // No booking exists yet
        amount: bookingIntent.total_amount,
        payment_method: "ekqr",
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
          seatId: bookingIntent.seat_id,
          // Use production domain for redirect
          redirectUrl: `https://sarkarininja.com/payment-success?transaction_id=${transaction.id}&amount=${bookingIntent.total_amount}&study_hall_id=${bookingIntent.study_hall_id}`
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

  const startPaymentPolling = (orderId: string, transactionId: string) => {
    console.log('🔄 Starting payment polling for order:', orderId, 'transaction:', transactionId);
    let hasCreatedBooking = false; // Prevent duplicate booking creation
    
    const pollInterval = setInterval(async () => {
      try {
        // Get today's date in YYYY-MM-DD format for txn_date
        const today = new Date().toISOString().split('T')[0];
        
        const { data: statusResponse, error } = await supabase.functions.invoke('ekqr-payment', {
          body: {
            action: 'checkStatus',
            clientTxnId: orderId,
            txnDate: today
          },
        });

        if (error) throw error;

        if (statusResponse?.success && statusResponse.status === 'success' && !hasCreatedBooking) {
          hasCreatedBooking = true; // Prevent duplicate bookings
          clearInterval(pollInterval);
          
          console.log('✅ EKQR: Payment confirmed, updating transaction status');
          await updateTransactionStatus(transactionId, 'completed');
          
          // Create booking after successful payment verification
          if (user) {
            try {
              console.log('🏗️ EKQR: Creating booking after successful payment');
              const booking = await createBookingFromIntent(
                bookingIntent, 
                user.id, 
                transactionId, 
                'confirmed', 
                'paid'
              );
              console.log('✅ EKQR: Booking created successfully:', booking);
              
              setShowQR(false);
              toast({
                title: "Payment Successful!",
                description: "Your booking has been confirmed!",
              });
              
              // Call success callback
              onPaymentSuccess();
            } catch (error) {
              console.error('❌ EKQR: Error creating booking after payment:', error);
              toast({
                title: "Payment Successful, Booking Error",
                description: "Payment completed but booking creation failed. Please contact support.",
                variant: "destructive",
              });
            }
          }
        } else if (statusResponse?.status === 'failed' && !hasCreatedBooking) {
          hasCreatedBooking = true; // Prevent further attempts
          clearInterval(pollInterval);
          await updateTransactionStatus(transactionId, 'failed');
          setShowQR(false);
          toast({
            title: "Payment Failed",
            description: "Payment was not completed. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('❌ Error checking payment status:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (showQR && !hasCreatedBooking) {
        setShowQR(false);
        toast({
          title: "Payment Timeout",
          description: "Payment session expired. Please try again.",
          variant: "destructive",
        });
      }
    }, 600000);
  };

  const handleRazorpayPayment = async () => {
    try {
      console.log('💳 Razorpay: Starting payment process for booking intent');
      
      // Validate business settings first
      if (!settings?.razorpay_enabled) {
        throw new Error("Razorpay payments are currently disabled. Please try another payment method.");
      }

      // Create transaction record without booking_id initially
      const transaction = await createTransaction({
        booking_id: null, // No booking exists yet
        amount: bookingIntent.total_amount,
        payment_method: "razorpay",
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

            console.log('✅ Payment verified successfully');
            
            // Create booking after successful payment verification
            if (user) {
              try {
                console.log('Razorpay: Creating booking after successful payment');
                const booking = await createBookingFromIntent(
                  bookingIntent, 
                  user.id, 
                  transaction.id, 
                  'confirmed', 
                  'paid'
                );
                console.log('Razorpay: Booking created successfully:', booking);
                
                toast({
                  title: "Payment Successful!",
                  description: "Your booking has been confirmed!",
                });
                
                // Call success callback
                onPaymentSuccess();
              } catch (error) {
                console.error('Razorpay: Error creating booking after payment:', error);
                toast({
                  title: "Payment Successful, Booking Error",
                  description: "Payment completed but booking creation failed. Please contact support.",
                  variant: "destructive",
                });
              }
            }
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
      console.log('=== Starting offline payment process ===');
      
      // Create booking first with pending status
      const booking = await createBookingFromIntent(
        bookingIntent, 
        user.id, 
        undefined, // No transaction ID yet
        'pending', // booking status - waiting for merchant confirmation
        'unpaid'   // payment status - will be paid at merchant
      );

      if (!booking) {
        throw new Error("Failed to create booking");
      }

      console.log('Booking created for offline payment:', booking);

      // Create transaction and link to booking
      const transaction = await createTransaction({
        booking_id: booking.id,
        amount: bookingIntent.total_amount,
        payment_method: "offline",
        payment_id: `offline_${Date.now()}`,
        payment_data: { 
          method: 'offline',
          timestamp: new Date().toISOString(),
          status: 'pending'
        }
      });

      if (!transaction) {
        console.error('Failed to create transaction, but booking exists:', booking.id);
      }

      console.log('Transaction created for offline payment:', transaction);
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