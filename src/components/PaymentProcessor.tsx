import { useState } from "react";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
  const { createTransaction } = useTransactions();
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
    // TODO: Implement Razorpay integration
    toast({
      title: "Coming Soon",
      description: "Razorpay integration will be available soon",
    });
  };

  const handleEKQRPayment = async () => {
    // TODO: Implement EKQR integration
    toast({
      title: "Coming Soon",
      description: "EKQR payment will be available soon",
    });
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