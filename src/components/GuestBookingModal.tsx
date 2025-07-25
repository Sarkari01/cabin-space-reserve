import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CreditCard, QrCode } from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StudyHall {
  id: string;
  name: string;
  monthly_price: number;
}

interface Seat {
  id: string;
  seat_id: string;
  row_name: string;
  seat_number: number;
}

interface GuestBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studyHall: StudyHall | null;
  selectedSeat: Seat | null;
}

export function GuestBookingModal({
  isOpen,
  onClose,
  onSuccess,
  studyHall,
  selectedSeat
}: GuestBookingModalProps) {
  const { toast } = useToast();
  
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [loading, setLoading] = useState(false);
  
  // Guest details
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  
  // Booking details
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 1));
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'ekqr'>('razorpay');

  const calculateAmount = () => {
    if (!studyHall) return { amount: 0, period: 'monthly' };
    
    const days = Math.max(1, differenceInDays(endDate, startDate) + 1);
    
    // Calculate number of months needed (minimum 1 month)
    const months = Math.max(1, Math.ceil(days / 30));
    const amount = months * studyHall.monthly_price;
    
    return { amount, period: 'monthly' };
  };

  const { amount, period } = calculateAmount();

  const handleNext = () => {
    if (!guestName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }
    
    if (!guestPhone.trim()) {
      toast({
        title: "Phone Required",
        description: "Please enter your phone number.",
        variant: "destructive",
      });
      return;
    }
    
    if (guestPhone.length < 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid phone number.",
        variant: "destructive",
      });
      return;
    }
    
    setStep('payment');
  };

  const handleBooking = async () => {
    if (!studyHall || !selectedSeat) return;
    
    setLoading(true);
    
    try {
      const bookingData = {
        studyHallId: studyHall.id,
        seatId: selectedSeat.id,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim(),
        paymentMethod
      };
      
      const { data, error } = await supabase.functions.invoke('guest-checkout', {
        body: bookingData
      });
      
      if (error) {
        throw error;
      }
      
      if (data.success) {
        // Handle payment gateway redirection based on payment method
        if (paymentMethod === 'razorpay' && data.razorpayData) {
          // Open Razorpay payment in new tab
          initiateRazorpayPayment(data.razorpayData, data.booking);
        } else if (paymentMethod === 'ekqr' && data.ekqrData) {
          // Show QR code for EKQR payment  
          showEKQRPayment(data.ekqrData, data.booking);
        } else {
          // Fallback: booking created, redirect to complete payment
          toast({
            title: "Booking Created!",
            description: `Your booking has been created. Please complete payment to confirm. Booking #${data.booking.booking_number}`,
          });
          
          // Redirect to payment page if available
          if (data.paymentUrl) {
            window.open(data.paymentUrl, '_blank');
          }
          
          onSuccess();
        }
      } else {
        throw new Error(data.error || 'Failed to create booking');
      }
      
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('details');
    setGuestName("");
    setGuestPhone("");
    setGuestEmail("");
    setStartDate(new Date());
    setEndDate(addDays(new Date(), 1));
    setPaymentMethod('razorpay');
  };

  const initiateRazorpayPayment = (razorpayData: any, booking: any) => {
    console.log('Initiating Razorpay payment:', razorpayData);
    
    // For now, redirect to Razorpay payment URL in new tab
    if (razorpayData.payment_url) {
      window.open(razorpayData.payment_url, '_blank');
      
      toast({
        title: "Redirecting to Payment",
        description: `Complete your payment to confirm booking #${booking.booking_number}`,
      });
      
      // Close modal and refresh
      setTimeout(() => {
        onSuccess();
      }, 2000);
      
      return;
    }
    
    // Fallback: Load Razorpay script and initiate payment
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      const options = {
        key: razorpayData.key_id || razorpayData.razorpay_key_id,
        amount: razorpayData.amount,
        currency: razorpayData.currency || 'INR',
        name: studyHall?.name || 'Study Hall',
        description: `Seat booking for ${selectedSeat?.row_name}${selectedSeat?.seat_number}`,
        order_id: razorpayData.razorpay_order_id || razorpayData.order_id,
        prefill: {
          name: guestName,
          email: guestEmail,
          contact: guestPhone
        },
        handler: function (response: any) {
          toast({
            title: "Payment Successful!",
            description: `Your booking has been confirmed. Booking #${booking.booking_number}`,
          });
          onSuccess();
        },
        modal: {
          ondismiss: function () {
            toast({
              title: "Payment Cancelled",
              description: "Your booking is still pending payment.",
              variant: "destructive",
            });
          }
        }
      };
      
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    };
    script.onerror = () => {
      toast({
        title: "Payment Error", 
        description: "Failed to load payment gateway. Please try again.",
        variant: "destructive",
      });
    };
    document.head.appendChild(script);
  };

  const showEKQRPayment = (ekqrData: any, booking: any) => {
    console.log('Showing EKQR payment:', ekqrData);
    
    // If there's a QR code URL, open it in a new tab
    if (ekqrData.qr_code_url) {
      window.open(ekqrData.qr_code_url, '_blank');
    }
    
    toast({
      title: "Complete Payment",
      description: `Scan the QR code or use the payment link to complete your booking #${booking.booking_number}`,
    });
    
    // Close modal and refresh after showing the QR code
    setTimeout(() => {
      onSuccess();
    }, 2000);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!studyHall || !selectedSeat) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'details' ? 'Booking Details' : 'Payment'}
          </DialogTitle>
        </DialogHeader>

        {step === 'details' && (
          <div className="space-y-6">
            {/* Seat Info */}
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm space-y-1">
                  <p><strong>Study Hall:</strong> {studyHall.name}</p>
                  <p><strong>Seat:</strong> {selectedSeat.row_name}{selectedSeat.seat_number}</p>
                </div>
              </CardContent>
            </Card>

            {/* Guest Details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="guestName">Full Name *</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <Label htmlFor="guestPhone">Phone Number *</Label>
                <Input
                  id="guestPhone"
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div>
                <Label htmlFor="guestEmail">Email (Optional)</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Date Selection */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          if (date) {
                            setStartDate(date);
                            if (date > endDate) {
                              setEndDate(addDays(date, 1));
                            }
                          }
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        disabled={(date) => date <= startDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Amount ({period}):</span>
                  <span className="text-lg font-bold">₹{amount}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {differenceInDays(endDate, startDate) + 1} day(s)
                </p>
              </CardContent>
            </Card>

            <Button onClick={handleNext} className="w-full">
              Continue to Payment
            </Button>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-6">
            {/* Booking Summary */}
            <Card>
              <CardContent className="pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Seat:</span>
                  <span>{selectedSeat.row_name}{selectedSeat.seat_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guest:</span>
                  <span>{guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{format(startDate, "MMM dd")} - {format(endDate, "MMM dd")}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>₹{amount}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="razorpay" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Card/UPI
                </TabsTrigger>
                <TabsTrigger value="ekqr" className="gap-2">
                  <QrCode className="h-4 w-4" />
                  QR Code
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="razorpay" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Pay securely using your credit/debit card or UPI via Razorpay.
                </p>
              </TabsContent>
              
              <TabsContent value="ekqr" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Scan QR code to pay instantly using any UPI app.
                </p>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('details')} className="flex-1">
                Back
              </Button>
              <Button onClick={handleBooking} disabled={loading} className="flex-1">
                {loading ? "Processing..." : `Pay ₹${amount}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}