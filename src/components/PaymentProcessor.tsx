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
    // Remove the API key check here - rely on PaymentMethodSelector validation
    // The payment method selector has already validated that EKQR is available

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

      // Create EKQR QR code using official API
      const { data: qrResponse, error } = await supabase.functions.invoke('ekqr-payment', {
        body: {
          action: 'createQR',
          amount: bookingData.total_amount,
          bookingId: bookingData.id,
        },
      });

      if (error) {
        console.error('EKQR Payment Error:', error);
        const errorMessage = error.message || 'Failed to generate QR code';
        
        // Provide more specific error messages
        if (errorMessage.includes('API Key not configured')) {
          throw new Error('EKQR payment is not properly configured. Please contact support.');
        } else if (errorMessage.includes('Failed to create QR code')) {
          throw new Error('Unable to create QR code. Please try again or contact support.');
        }
        
        throw new Error(errorMessage);
      }

      setQrData(qrResponse);
      setShowQR(true);

      // Start polling for payment status
      startPaymentPolling(qrResponse.qr_id, transaction.id);
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
            {selectedMethod === "offline" ? "Reserve Seat" : "Pay Now"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};