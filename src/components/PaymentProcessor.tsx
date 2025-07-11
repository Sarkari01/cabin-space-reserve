import { useState } from "react";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { useToast } from "@/hooks/use-toast";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, QrCode } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

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
        case "razorpay":
          await handleRazorpayPayment();
          break;
        case "ekqr":
          await handleEKQRPayment();
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

  const handleRazorpayPayment = async () => {
    if (!settings?.razorpay_key_id) {
      toast({
        title: "Configuration Error",
        description: "Razorpay is not properly configured",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create transaction record first
      const transaction = await createTransaction({
        booking_id: bookingData.id,
        amount: bookingData.total_amount,
        payment_method: "razorpay",
      });

      if (!transaction) {
        throw new Error("Failed to create transaction record");
      }

      // Create Razorpay order
      const { data: orderData, error } = await supabase.functions.invoke('razorpay-payment', {
        body: {
          action: 'createOrder',
          amount: bookingData.total_amount,
          bookingId: bookingData.id,
        },
      });

      if (error) throw error;

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }

      // Initialize Razorpay checkout
      const options = {
        key: settings.razorpay_key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'Study Hall Booking',
        description: `Booking for ${bookingData.booking_period} period`,
        handler: async (response: any) => {
          try {
            // Verify payment
            const { error: verifyError } = await supabase.functions.invoke('razorpay-payment', {
              body: {
                action: 'verifyPayment',
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                bookingId: bookingData.id,
              },
            });

            if (verifyError) throw verifyError;

            toast({
              title: "Payment Successful",
              description: "Your booking has been confirmed!",
            });
            onPaymentSuccess();
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast({
              title: "Payment Verification Failed",
              description: "Please contact support if amount was deducted",
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Razorpay payment error:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEKQRPayment = async () => {
    if (!settings?.ekqr_merchant_code) {
      toast({
        title: "Configuration Error",
        description: "EKQR is not properly configured",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create transaction record first
      const transaction = await createTransaction({
        booking_id: bookingData.id,
        amount: bookingData.total_amount,
        payment_method: "ekqr",
      });

      if (!transaction) {
        throw new Error("Failed to create transaction record");
      }

      // Create EKQR QR code
      const { data: qrResponse, error } = await supabase.functions.invoke('ekqr-payment', {
        body: {
          action: 'createQR',
          amount: bookingData.total_amount,
        },
      });

      if (error) throw error;

      setQrData(qrResponse);
      setShowQR(true);

      // Start polling for payment status
      startPaymentPolling(qrResponse.qrId, transaction.id);
    } catch (error) {
      console.error('EKQR payment error:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to generate QR code. Please try again.",
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

        if (statusResponse.status === 'completed') {
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
                src={qrData.qrImage} 
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
            {selectedMethod === "offline" ? "Reserve Seat" : "Pay Now"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};