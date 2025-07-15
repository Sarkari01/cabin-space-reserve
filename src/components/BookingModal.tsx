import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, AlertCircle } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { useBookingAvailability } from "@/hooks/useBookingAvailability";
import { PaymentProcessor } from "./PaymentProcessor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface StudyHall {
  id: string;
  name: string;
  location: string;
  daily_price: number;
  weekly_price: number;
  monthly_price: number;
  image_url?: string;
}

interface Seat {
  id: string;
  seat_id: string;
  row_name: string;
  seat_number: number;
  is_available: boolean;
}

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studyHall: StudyHall | null;
  seats: Seat[];
  onSuccess?: () => void;
}

export function BookingModal({ open, onOpenChange, studyHall, seats, onSuccess }: BookingModalProps) {
  const [selectedSeat, setSelectedSeat] = useState<string>("");
  const [bookingPeriod, setBookingPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [bookingIntent, setBookingIntent] = useState<any>(null);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, boolean>>({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string>("");
  const [calculatedAmount, setCalculatedAmount] = useState<{amount: number; days: number; method: string} | null>(null);

  const { toast } = useToast();
  const { checkSeatAvailability, getSeatAvailabilityMap, calculateBookingAmount } = useBookingAvailability();

  // Filter seats based on date-specific availability
  const getAvailableSeats = () => {
    if (Object.keys(availabilityMap).length === 0) {
      return seats.filter(seat => seat.is_available);
    }
    return seats.filter(seat => seat.is_available && availabilityMap[seat.id]);
  };

  const availableSeats = getAvailableSeats();

  // Check availability when dates change
  useEffect(() => {
    let isCancelled = false;
    const timeoutId = setTimeout(() => {
      if (!isCancelled) {
        setCheckingAvailability(false);
        setAvailabilityError("Request timeout - please try again");
      }
    }, 15000); // 15 second timeout

    const checkAvailability = async () => {
      if (!studyHall || !startDate || !endDate) {
        setAvailabilityMap({});
        setCalculatedAmount(null);
        clearTimeout(timeoutId);
        return;
      }

      setCheckingAvailability(true);
      setAvailabilityError("");
      
      try {
        console.log('Starting availability check for dates:', startDate, 'to', endDate);
        
        // Calculate amount based on actual date range
        const amountCalc = calculateBookingAmount(
          startDate, 
          endDate, 
          studyHall.daily_price, 
          studyHall.weekly_price, 
          studyHall.monthly_price
        );
        
        if (!isCancelled) {
          setCalculatedAmount(amountCalc);
        }

        // Get availability for the date range
        const availability = await getSeatAvailabilityMap(studyHall.id, startDate, endDate);
        
        if (!isCancelled) {
          setAvailabilityMap(availability);
          
          // Clear selected seat if it's no longer available
          if (selectedSeat && !availability[selectedSeat]) {
            setSelectedSeat("");
            toast({
              title: "Seat No Longer Available",
              description: "Your selected seat is not available for the chosen dates. Please select another seat.",
              variant: "destructive",
            });
          }
          
          console.log('Availability check completed successfully');
        }
      } catch (error: any) {
        console.error('Error checking availability:', error);
        if (!isCancelled) {
          setAvailabilityError(error.message || "Failed to check availability for selected dates");
        }
      } finally {
        clearTimeout(timeoutId);
        if (!isCancelled) {
          setCheckingAvailability(false);
        }
      }
    };

    checkAvailability();
    
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [studyHall, startDate, endDate, selectedSeat]);

  useEffect(() => {
    if (open && studyHall) {
      setSelectedSeat("");
      setBookingPeriod("daily");
      setAvailabilityMap({});
      setAvailabilityError("");
      setCalculatedAmount(null);
      
      // Set default dates
      const today = new Date();
      setStartDate(today.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  }, [open, studyHall]);

  // Update end date when booking period changes
  useEffect(() => {
    if (!startDate) return;
    
    const start = new Date(startDate);
    let end = new Date(start);
    
    if (bookingPeriod === "weekly") {
      end.setDate(end.getDate() + 6); // 7 days total
    } else if (bookingPeriod === "monthly") {
      end.setMonth(end.getMonth() + 1);
      end.setDate(end.getDate() - 1); // 30 days total
    }
    
    setEndDate(end.toISOString().split('T')[0]);
  }, [bookingPeriod, startDate]);

  const getCurrentAmount = () => {
    return calculatedAmount?.amount || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studyHall || !selectedSeat || !startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Final availability check before creating booking intent
      const { available, conflicts } = await checkSeatAvailability(selectedSeat, startDate, endDate);
      
      if (!available) {
        toast({
          title: "Seat Not Available",
          description: `This seat is not available for the selected dates. ${conflicts.length} conflicting booking(s) found.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create booking intent with calculated amount
      const intent = {
        study_hall_id: studyHall.id,
        seat_id: selectedSeat,
        booking_period: calculatedAmount?.method === 'daily' ? 'daily' : 
                       calculatedAmount?.method === 'weekly' ? 'weekly' : 'monthly',
        start_date: startDate,
        end_date: endDate,
        total_amount: getCurrentAmount(),
      };

      setBookingIntent(intent);
      setShowPayment(true);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "Failed to process booking request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (bookingData?: any) => {
    setShowPayment(false);
    setBookingIntent(null);
    onOpenChange(false);
    
    // If we have booking data, navigate to payment success page with details
    if (bookingData) {
      const params = new URLSearchParams({
        booking_id: bookingData.id,
        amount: bookingData.total_amount.toString(),
        study_hall_name: bookingData.study_hall?.name || '',
        seat_info: `${bookingData.seat?.row_name}${bookingData.seat?.seat_number}` || '',
      });
      window.location.href = `/payment-success?${params.toString()}`;
    } else {
      // Fallback: refresh the current page or call onSuccess
      onSuccess?.();
    }
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setBookingIntent(null);
  };

  if (!studyHall) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {showPayment && bookingIntent ? (
          <>
            <DialogHeader>
              <DialogTitle>Complete Payment</DialogTitle>
              <DialogDescription>
                Choose your payment method to complete the booking
              </DialogDescription>
            </DialogHeader>
            <PaymentProcessor
              bookingIntent={bookingIntent}
              onPaymentSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </>
        ) : (
          <>
            <DialogHeader>
          <DialogTitle>Book Study Hall</DialogTitle>
          <DialogDescription>
            Reserve your seat at {studyHall.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {studyHall.image_url && (
            <div className="aspect-video w-full rounded-lg overflow-hidden">
              <img 
                src={studyHall.image_url} 
                alt={studyHall.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold">{studyHall.name}</h3>
              <p className="text-sm text-muted-foreground">{studyHall.location}</p>
            </CardContent>
          </Card>

          {availabilityError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{availabilityError}</AlertDescription>
            </Alert>
          )}

          {checkingAvailability && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Checking seat availability for selected dates...</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Select Seat {checkingAvailability && "(Checking availability...)"}</Label>
            <div className="max-h-64 overflow-y-auto border rounded-lg p-4">
              {availableSeats.length > 0 ? (
                <div className="space-y-3">
                  {/* Group seats by row */}
                  {Object.entries(
                    availableSeats.reduce((acc, seat) => {
                      if (!acc[seat.row_name]) acc[seat.row_name] = [];
                      acc[seat.row_name].push(seat);
                      return acc;
                    }, {})
                  ).map(([rowName, rowSeats]) => (
                    <div key={rowName} className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Row {rowName}</h4>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {(rowSeats as Seat[]).sort((a, b) => a.seat_number - b.seat_number).map((seat) => (
                          <button
                            key={seat.id}
                            type="button"
                            onClick={() => setSelectedSeat(seat.id)}
                            className={`
                              w-10 h-10 sm:w-8 sm:h-8 rounded text-xs font-medium border-2 transition-all touch-manipulation
                              ${selectedSeat === seat.id
                                ? 'border-primary bg-primary text-primary-foreground'
                                : (seat.is_available && availabilityMap[seat.id] !== false)
                                ? 'border-green-300 bg-green-50 text-green-700 hover:border-green-400 hover:bg-green-100'
                                : 'border-red-300 bg-red-50 text-red-700 cursor-not-allowed'
                              }
                            `}
                            disabled={!seat.is_available || availabilityMap[seat.id] === false}
                            title={`Seat ${seat.seat_id} - ${
                              !seat.is_available ? 'Permanently Occupied' : 
                              availabilityMap[seat.id] === false ? 'Booked for Selected Dates' : 
                              'Available'
                            }`}
                          >
                            {seat.seat_number}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {checkingAvailability ? "Checking availability..." : "No seats available for the selected dates"}
                </div>
              )}
            </div>
            
            {/* Seat Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border-2 border-green-300 bg-green-50"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border-2 border-red-300 bg-red-50"></div>
                <span>Occupied</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border-2 border-primary bg-primary"></div>
                <span>Selected</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Booking Period</Label>
            <Select value={bookingPeriod} onValueChange={(value: "daily" | "weekly" | "monthly") => setBookingPeriod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily - ₹{studyHall.daily_price}</SelectItem>
                <SelectItem value="weekly">Weekly - ₹{studyHall.weekly_price}</SelectItem>
                <SelectItem value="monthly">Monthly - ₹{studyHall.monthly_price}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full"
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Amount:</span>
                  <span className="text-lg font-bold">₹{getCurrentAmount().toLocaleString()}</span>
                </div>
                {calculatedAmount && (
                  <div className="text-sm text-muted-foreground">
                    {calculatedAmount.days} day{calculatedAmount.days !== 1 ? 's' : ''} • 
                    Calculated using {calculatedAmount.method} pricing
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1 min-h-[44px]"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !selectedSeat || checkingAvailability || !!availabilityError} 
              className="flex-1 min-h-[44px]"
            >
              {loading ? "Booking..." : checkingAvailability ? "Checking..." : "Book Now"}
            </Button>
          </div>
        </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}