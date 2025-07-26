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
    booking_period: "1_month" | "2_months" | "3_months" | "6_months" | "12_months";
    start_date: string;
    end_date: string;
    total_amount: number;
    original_amount?: number;
    coupon_code?: string;
    coupon_discount?: number;
    reward_points_used?: number;
    reward_discount?: number;
    total_discount?: number;
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
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to make a payment");
      }
      
      // First, validate payment gateways to get current configuration status
      console.log('🔧 EKQR: Validating payment gateway configuration...');
      const { data: gatewayData, error: gatewayError } = await supabase.functions.invoke('validate-payment-gateways');
      
      if (gatewayData?.gateways?.ekqr) {
        const ekqrStatus = gatewayData.gateways.ekqr;
        console.log('🔧 EKQR: Gateway status:', ekqrStatus);
        
        if (ekqrStatus === 'missing_config') {
          throw new Error("QR payment service is not configured. Please contact support or try Card/UPI Payment.");
        } else if (ekqrStatus === 'invalid_credentials') {
          throw new Error("QR payment service configuration is invalid. Please contact support or try Card/UPI Payment.");
        } else if (ekqrStatus === 'disabled') {
          throw new Error("QR payments are currently disabled. Please try Card/UPI Payment instead.");
        } else if (ekqrStatus !== 'configured') {
          throw new Error(`QR payment service status: ${ekqrStatus}. Please try Card/UPI Payment or contact support.`);
        }
      }
      
      // Enhanced validation of business settings
      console.log('🔧 EKQR: Business settings:', settings);
      if (!settings) {
        console.log('⚠️ EKQR: Business settings not loaded, attempting to fetch...');
        
        // Try to fetch business settings directly
        const { data: freshSettings, error: settingsError } = await supabase
          .from('business_settings')
          .select('*')
          .single();
        
        if (settingsError || !freshSettings) {
          console.error('❌ EKQR: Failed to load business settings:', settingsError);
          
          // More specific error message based on the type of error
          if (settingsError?.code === 'PGRST116') {
            throw new Error("Payment system not initialized. Please contact support to set up payments.");
          } else {
            throw new Error("Unable to load payment configuration. Please refresh the page or contact support.");
          }
        }
        
        if (!freshSettings.ekqr_enabled) {
          throw new Error("QR payments are currently disabled. Please try Card/UPI Payment or contact support.");
        }
      } else if (!settings.ekqr_enabled) {
        throw new Error("QR payments are currently disabled. Please try Card/UPI Payment instead.");
      }

      // Create transaction record with booking intent data
      console.log('💾 EKQR: Creating transaction record...');
      const transaction = await createTransaction({
        booking_id: null, // No booking exists yet
        amount: bookingIntent.total_amount,
        payment_method: "ekqr",
        payment_data: {
          bookingIntent: bookingIntent
        }
      });

      if (!transaction) {
        throw new Error("Failed to create payment record. Please try again.");
      }

      console.log('✅ EKQR: Transaction created:', transaction.id);

      // Prepare customer data with defaults
      const customerData = {
        customerName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Customer',
        customerEmail: user?.email || settings?.support_email || 'customer@example.com',
        customerMobile: user?.user_metadata?.phone || settings?.support_phone || '9999999999'
      };

      console.log('👤 EKQR: Customer data:', customerData);

      // Create EKQR order using the edge function
      console.log('🌐 EKQR: Invoking edge function...');
      const { data: orderResponse, error } = await supabase.functions.invoke('ekqr-payment', {
        body: {
          action: 'createOrder',
          amount: bookingIntent.total_amount,
          bookingId: transaction.id, // Use transaction ID as temporary identifier
          ...customerData,
          studyHallId: bookingIntent.study_hall_id,
          seatId: bookingIntent.seat_id
        },
      });

      console.log('📡 EKQR: Function response:', { orderResponse, error });

      if (error) {
        console.error('❌ EKQR Payment Error:', error);
        
        // Provide more user-friendly error messages based on error type
        let userMessage = "Failed to set up QR payment. Please try Card/UPI Payment.";
        let shouldLogDetails = true;
        
        if (error.message?.includes('EKQR_API_KEY not configured')) {
          userMessage = "QR payment service is not configured. Please contact support or try Card/UPI Payment.";
          shouldLogDetails = false; // Don't log this as it's a known config issue
        } else if (error.message?.includes('Invalid amount')) {
          userMessage = "Invalid payment amount. Please refresh the page and try again.";
        } else if (error.message?.includes('API Error') || error.message?.includes('Failed to create EKQR order')) {
          userMessage = "QR payment service is temporarily unavailable. Please try Card/UPI Payment.";
        } else if (error.message?.includes('Network') || error.message?.includes('timeout')) {
          userMessage = "Network error. Please check your connection and try again.";
        } else if (error.message?.includes('fetch')) {
          userMessage = "Unable to connect to payment service. Please check your connection and try again.";
        }
        
        // Log detailed error for debugging if it's not a known config issue
        if (shouldLogDetails) {
          console.error('🔍 Detailed EKQR error for debugging:', {
            error,
            bookingIntent,
            settings,
            user: user?.id
          });
        }
        
        toast({
          title: "QR Payment Setup Failed",
          description: userMessage,
          variant: "destructive",
        });
        
        // Don't throw here - let user try other payment methods
        return;
      }

      if (!orderResponse?.success || !orderResponse?.orderId) {
        console.error('❌ EKQR: Invalid order response:', orderResponse);
        toast({
          title: "QR Payment Setup Failed",
          description: "Invalid response from payment service. Please try Card/UPI Payment.",
          variant: "destructive",
        });
        return;
      }

      // Get existing payment data to preserve qr_id
      console.log('💾 EKQR: Fetching current transaction data to preserve qr_id...');
      const { data: currentTransaction } = await supabase
        .from('transactions')
        .select('payment_data, qr_id')
        .eq('id', transaction.id)
        .single();

      const existingPaymentData = (currentTransaction?.payment_data as any) || {};
      
      // Update transaction with EKQR order details (preserve existing data including qr_id)
      const updateData = {
        payment_id: orderResponse.orderId,
        payment_data: {
          ...existingPaymentData, // Preserve existing data including bookingIntent
          sessionId: orderResponse.sessionId,
          paymentUrl: orderResponse.paymentUrl,
          upiIntent: orderResponse.upiIntent,
          isUtrRequired: orderResponse.isUtrRequired,
          frontend_updated_at: new Date().toISOString()
        }
      };

      console.log('💾 EKQR: Updating transaction with preserved data:', { 
        existingQrId: currentTransaction?.qr_id,
        hasExistingPaymentData: !!existingPaymentData,
        updateData 
      });

      const { error: updateError } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transaction.id);

      if (updateError) {
        console.error('❌ EKQR: Failed to update transaction:', updateError);
        // Continue anyway as the order was created successfully
      }

      console.log('✅ EKQR: Order created successfully');
      setQrData(orderResponse);
      setShowQR(true);

      // Start polling for payment status
      startPaymentPolling(orderResponse.orderId, transaction.id);

      toast({
        title: "QR Payment Ready",
        description: "Scan the QR code or use UPI to complete payment",
      });
      
    } catch (error: any) {
      console.error('💥 EKQR payment error:', error);
      
      // Default error message
      let errorMessage = "Unable to set up QR payment. Please try Card/UPI Payment.";
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Payment Setup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Enhanced polling with real-time listeners for instant payment detection
  const startPaymentPolling = async (orderId: string, transactionId: string) => {
    console.log('🚀 Starting automatic EKQR payment detection for order:', orderId);
    setShowQR(true);
    
    let pollInterval: NodeJS.Timeout;
    let realtimeChannel: any;
    let cleanup: (() => void) | null = null;
    
    // Real-time subscription for instant detection
    const setupRealtimeListener = () => {
      console.log('📡 Setting up real-time listener for instant payment detection');
      
      realtimeChannel = supabase
        .channel(`transaction-${transactionId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'transactions',
            filter: `id=eq.${transactionId}`
          },
          async (payload) => {
            console.log('⚡ Real-time transaction update:', payload);
            
            if (payload.new.status === 'completed') {
              console.log('🎉 Payment successful via real-time notification!');
              handlePaymentSuccess(payload.new.booking_id);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'bookings',
            filter: `user_id=eq.${user?.id}`
          },
          async (payload) => {
            console.log('⚡ Real-time booking creation:', payload);
            
            // Check if this booking is related to our transaction
            const { data: relatedTransaction } = await supabase
              .from('transactions')
              .select('*')
              .eq('id', transactionId)
              .eq('booking_id', payload.new.id)
              .single();
            
            if (relatedTransaction) {
              console.log('🎉 Booking created via real-time notification!');
              handlePaymentSuccess(payload.new.id);
            }
          }
        )
        .subscribe();
    };
    
    // Handle successful payment
    const handlePaymentSuccess = async (bookingId?: string) => {
      if (cleanup) cleanup();
      
      setProcessing(false);
      setShowQR(false);
      
      toast({
        title: "Payment Successful!",
        description: "Your booking has been confirmed instantly!",
      });
      
      // Get full booking data for success page
      if (bookingId) {
        console.log('📍 Redirecting to success page with booking ID:', bookingId);
        
        const successParams = new URLSearchParams({
          booking_id: bookingId,
          amount: bookingIntent.total_amount.toString(),
          study_hall_id: bookingIntent.study_hall_id,
          transaction_id: transactionId
        });
        
        window.location.href = `/payment-success?${successParams.toString()}`;
      } else {
        onPaymentSuccess(null);
      }
    };
    
    // Smart polling with exponential backoff
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes total (initially every 3 seconds)
    let currentDelay = 3000; // Start with 3 seconds
    
    const smartPoll = async () => {
      if (attempts >= maxAttempts) {
        console.log('⏰ Payment polling timeout - switching to patient mode');
        if (cleanup) cleanup();
        
        toast({
          title: "Taking longer than expected",
          description: "Your payment is being processed. You'll be notified when it's complete.",
          variant: "default",
        });
        return;
      }
      
      attempts++;
      console.log(`🔍 Smart polling attempt ${attempts}/${maxAttempts} (${currentDelay}ms intervals)`);
      
      try {
        // Quick local check first
        const { data: transactionCheck } = await supabase
          .from('transactions')
          .select(`
            status, 
            booking_id,
            booking:bookings(
              *,
              study_hall:study_halls(name, location),
              seat:seats(seat_id, row_name, seat_number)
            )
          `)
          .eq('id', transactionId)
          .single();
        
        if (transactionCheck?.status === 'completed') {
          console.log('✅ Payment confirmed via polling!');
          handlePaymentSuccess(transactionCheck.booking_id);
          return;
        }
        
        // EKQR API check every few attempts (to reduce API calls)
        if (attempts % 3 === 0) {
          console.log('🌐 Checking EKQR API status...');
          
          const { data: latestTransaction } = await supabase
            .from('transactions')
            .select('qr_id, payment_id, payment_data')
            .eq('id', transactionId)
            .single();
          
          const paymentData = latestTransaction?.payment_data as any;
          const orderIdToUse = latestTransaction?.qr_id || 
                              orderId || 
                              paymentData?.ekqr_order_id || 
                              latestTransaction?.payment_id;
          
          if (orderIdToUse) {
            const { data, error } = await supabase.functions.invoke('ekqr-payment', {
              body: { 
                action: 'checkOrderStatus',
                orderId: orderIdToUse,
                transactionId: transactionId,
                txnDate: new Date().toISOString().split('T')[0]
              }
            });
            
            if (!error && data) {
              const isPaymentSuccessful = data.status === 'success' || 
                                        data.paid === true || 
                                        data.booking?.id;
              
              if (isPaymentSuccessful) {
                console.log('🎉 Payment successful via EKQR API!');
                const bookingId = data.booking?.id || data.bookingId;
                handlePaymentSuccess(bookingId);
                return;
              }
            }
          }
        }
        
        // Exponential backoff: increase delay gradually
        if (attempts % 10 === 0 && currentDelay < 10000) {
          currentDelay = Math.min(currentDelay * 1.5, 10000);
          console.log(`⏲️ Increasing polling interval to ${currentDelay}ms`);
        }
        
        // Schedule next poll
        pollInterval = setTimeout(smartPoll, currentDelay);
        
      } catch (error) {
        console.error('❌ Polling error:', error);
        // Continue polling despite errors
        pollInterval = setTimeout(smartPoll, currentDelay);
      }
    };
    
    // Cleanup function
    cleanup = () => {
      console.log('🧹 Cleaning up payment detection');
      if (pollInterval) clearTimeout(pollInterval);
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
    
    // Start both real-time and polling
    setupRealtimeListener();
    smartPoll();
    
    // Auto-cleanup after 10 minutes
    setTimeout(() => {
      if (cleanup) cleanup();
    }, 10 * 60 * 1000);
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

            console.log('✅ Payment verified successfully - fetching booking data...');
            
            // Fetch the created booking data with study hall and seat details
            const { data: transactionWithBooking, error: fetchError } = await supabase
              .from('transactions')
              .select(`
                booking:bookings(
                  *,
                  study_hall:study_halls(name, location),
                  seat:seats(seat_id, row_name, seat_number)
                )
              `)
              .eq('id', transaction.id)
              .single();
            
            if (fetchError) {
              console.error('Failed to fetch booking after payment:', fetchError);
              // Still show success but without booking data
              toast({
                title: "Payment Successful!",
                description: "Your booking has been confirmed! Check your dashboard for details.",
              });
              onPaymentSuccess();
              return;
            }
            
            const bookingData = transactionWithBooking?.booking;
            
            toast({
              title: "Payment Successful!",
              description: "Your booking has been confirmed!",
            });
            
            // Pass booking data to success callback for proper redirection
            if (bookingData) {
              console.log('Passing booking data to success callback:', bookingData);
              onPaymentSuccess(bookingData);
            } else {
              console.log('No booking data found, triggering success without data');
              onPaymentSuccess();
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
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <QrCode className="h-5 w-5" />
            Complete Your Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-3">
            
            {qrData.upiIntent && (
              <div className="space-y-2">
                <Button 
                  onClick={() => window.open(qrData.upiIntent, '_blank')}
                  className="w-full min-h-[44px]"
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
                  className="w-full min-h-[44px]"
                >
                  Pay via Web
                </Button>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg">
              <p>Amount: ₹{bookingIntent.total_amount}</p>
              <p className="break-all">Order ID: {qrData.orderId}</p>
              <p className="text-orange-600 font-medium mt-2">
                Do not close this window until payment is complete
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowQR(false)} 
            className="w-full min-h-[44px]"
          >
            Cancel Payment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-4 pointer-events-auto">
      <Card className="pointer-events-auto">
        <CardHeader className="pb-3 pointer-events-auto">
          <CardTitle className="text-lg pointer-events-auto">Complete Your Booking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pointer-events-auto">
          <div className="space-y-2 pointer-events-auto">
            <h4 className="font-medium pointer-events-auto">Booking Summary</h4>
            <div className="text-sm space-y-1 bg-muted/30 p-3 rounded-lg pointer-events-auto">
              <div className="flex justify-between pointer-events-auto">
                <span className="pointer-events-auto">Amount:</span>
                <span className="font-medium pointer-events-auto">₹{bookingIntent.total_amount}</span>
              </div>
              <div className="flex justify-between pointer-events-auto">
                <span className="pointer-events-auto">Period:</span>
                <span className="capitalize pointer-events-auto">{bookingIntent.booking_period}</span>
              </div>
              <div className="flex justify-between flex-wrap pointer-events-auto">
                <span className="pointer-events-auto">Duration:</span>
                <span className="text-right pointer-events-auto">{bookingIntent.start_date} to {bookingIntent.end_date}</span>
              </div>
            </div>
          </div>

          <div className="pointer-events-auto">
            <PaymentMethodSelector
              onMethodSelect={setSelectedMethod}
              selectedMethod={selectedMethod}
            />
          </div>
          
          {!selectedMethod && (
            <div className="text-sm text-muted-foreground text-center p-2 bg-muted/20 rounded pointer-events-auto">
              Please select a payment method to continue
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pointer-events-auto">
            <Button 
              variant="outline" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCancel();
              }}
              className="flex-1 min-h-[44px] pointer-events-auto touch-manipulation"
              style={{ position: 'relative', zIndex: 10001 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePayment();
              }}
              disabled={!selectedMethod || processing}
              className="flex-1 min-h-[44px] pointer-events-auto touch-manipulation"
              style={{ position: 'relative', zIndex: 10001 }}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedMethod === "offline" ? "Reserve Seat" : selectedMethod === "razorpay" ? "Pay with Razorpay" : "Pay Now"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};