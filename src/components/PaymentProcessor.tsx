import { useState } from "react";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { useToast } from "@/hooks/use-toast";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, QrCode } from "lucide-react";

interface PaymentProcessorProps {
  bookingData: {
    id: string;
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

export const PaymentProcessor = ({ bookingData, onPaymentSuccess, onCancel }: PaymentProcessorProps) => {
  const [selectedMethod, setSelectedMethod] = useState("");
  const [processing, setProcessing] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);
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
      console.log('💳 EKQR: Starting payment process for booking:', bookingData.id);
      
      // Validate business settings first
      if (!settings?.ekqr_enabled) {
        throw new Error("EKQR payments are currently disabled. Please try another payment method.");
      }

      // Create transaction record first
      const transaction = await createTransaction({
        booking_id: bookingData.id,
        amount: bookingData.total_amount,
        payment_method: "ekqr",
      });

      if (!transaction) {
        throw new Error("Failed to create transaction record");
      }

      console.log('✅ EKQR: Transaction created:', transaction.id);

      // Create EKQR QR code using the edge function
      console.log('🌐 EKQR: Invoking edge function...');
      const { data: qrResponse, error } = await supabase.functions.invoke('ekqr-payment', {
        body: {
          action: 'createQR',
          amount: bookingData.total_amount,
          bookingId: bookingData.id,
        },
      });

      console.log('📡 EKQR: Function response:', { qrResponse, error });

      if (error) {
        console.error('❌ EKQR Payment Error:', error);
        
        // Provide more user-friendly error messages
        let userMessage = "Failed to generate QR code. Please try again.";
        if (error.message?.includes('MISSING_API_KEY')) {
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
        throw new Error(error.message || 'Failed to generate QR code');
      }

      if (!qrResponse?.qr_image_url || !qrResponse?.qr_id) {
        throw new Error("Invalid QR code response received");
      }

      console.log('✅ EKQR: QR code generated successfully');
      setQrData(qrResponse);
      setShowQR(true);

      // Start polling for payment status
      startPaymentPolling(qrResponse.qr_id, transaction.id);

      toast({
        title: "QR Code Generated",
        description: "Scan the QR code with any UPI app to complete payment",
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

  const startPaymentPolling = (qrId: string, transactionId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const { data: statusResponse, error } = await supabase.functions.invoke('ekqr-payment', {
          body: {
            action: 'checkStatus',
            transactionId: qrId,
          },
        });

        if (error) throw error;

        if (statusResponse.status === 'success') {
          clearInterval(pollInterval);
          await updateTransactionStatus(transactionId, 'completed');
          setShowQR(false);
          toast({
            title: "Payment Successful",
            description: "Your booking has been confirmed!",
          });
          onPaymentSuccess();
        } else if (statusResponse.status === 'failed') {
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
        console.error('Error checking payment status:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (showQR) {
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
      console.log('💳 Razorpay: Starting payment process for booking:', bookingData.id);
      
      // Validate business settings first
      if (!settings?.razorpay_enabled) {
        throw new Error("Razorpay payments are currently disabled. Please try another payment method.");
      }

      // Create transaction record first
      const transaction = await createTransaction({
        booking_id: bookingData.id,
        amount: bookingData.total_amount,
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
          amount: bookingData.total_amount,
          booking_id: bookingData.id,
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
        description: `${bookingData.booking_period} booking for ₹${bookingData.total_amount}`,
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
            toast({
              title: "Payment Successful",
              description: "Your booking has been confirmed!",
            });
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
    const transaction = await createTransaction({
      booking_id: bookingData.id,
      amount: bookingData.total_amount,
      payment_method: "offline",
    });

    if (transaction) {
      toast({
        title: "Booking Reserved",
        description: "Your seat has been reserved. Please pay at the study hall.",
      });
      onPaymentSuccess();
    }
  };

  if (showQR && qrData) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scan QR Code to Pay
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="bg-white p-4 rounded-lg inline-block">
              <img 
                src={qrData.qr_image_url} 
                alt="Payment QR Code" 
                className="w-48 h-48 mx-auto"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Scan this QR code with any UPI app to pay ₹{bookingData.total_amount}</p>
              <p className="mt-2">Waiting for payment confirmation...</p>
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
              <span>₹{bookingData.total_amount}</span>
            </div>
            <div className="flex justify-between">
              <span>Period:</span>
              <span className="capitalize">{bookingData.booking_period}</span>
            </div>
            <div className="flex justify-between">
              <span>Duration:</span>
              <span>{bookingData.start_date} to {bookingData.end_date}</span>
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