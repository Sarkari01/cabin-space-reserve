import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, AlertCircle } from "lucide-react";
import { useBookingAvailability } from "@/hooks/useBookingAvailability";
import { useMonthlyPricing } from "@/hooks/useMonthlyPricing";
import { PaymentProcessor } from "./PaymentProcessor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { CouponInput } from "./CouponInput";
import { RewardsInput } from "./RewardsInput";

interface StudyHall {
  id: string;
  name: string;
  location: string;
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
  const [bookingPeriod, setBookingPeriod] = useState<"1_month" | "2_months" | "3_months" | "6_months" | "12_months">("1_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [bookingIntent, setBookingIntent] = useState<any>(null);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, boolean>>({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string>("");
  const [calculatedAmount, setCalculatedAmount] = useState<{
    amount: number; 
    months: number; 
    periodType: string;
  } | null>(null);
  
  // Coupon and Rewards state
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    title?: string;
  } | null>(null);
  
  const [appliedRewards, setAppliedRewards] = useState<{
    pointsUsed: number;
    discount: number;
  } | null>(null);

  const { toast } = useToast();
  const { checkSeatAvailability, getSeatAvailabilityMap } = useBookingAvailability();
  const { getPricingPlan, calculateMonthlyBookingAmount } = useMonthlyPricing();
  
  // Monthly pricing state
  const [monthlyPricingPlan, setMonthlyPricingPlan] = useState<any>(null);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>(["1_month"]);

  // Filter seats based on date-specific availability
  const getAvailableSeats = () => {
    if (Object.keys(availabilityMap).length === 0) {
      return seats.filter(seat => seat.is_available);
    }
    return seats.filter(seat => seat.is_available && availabilityMap[seat.id]);
  };

  const availableSeats = getAvailableSeats();

  // Load monthly pricing plan when study hall changes
  useEffect(() => {
    const loadMonthlyPricing = async () => {
      if (!studyHall?.id) {
        setAvailablePeriods(["1_month", "2_months", "3_months", "6_months", "12_months"]);
        return;
      }
      
      try {
        console.log('Loading monthly pricing for study hall:', studyHall.id);
        const plan = await getPricingPlan(studyHall.id);
        console.log('Loaded monthly pricing plan:', plan);
        setMonthlyPricingPlan(plan);
        
        // Update available periods based on plan - ONLY include enabled periods with valid prices
        if (plan) {
          const periods: string[] = [];
          
          if (plan.months_1_enabled && plan.months_1_price && plan.months_1_price > 0) {
            periods.push("1_month");
          }
          if (plan.months_2_enabled && plan.months_2_price && plan.months_2_price > 0) {
            periods.push("2_months");
          }
          if (plan.months_3_enabled && plan.months_3_price && plan.months_3_price > 0) {
            periods.push("3_months");
          }
          if (plan.months_6_enabled && plan.months_6_price && plan.months_6_price > 0) {
            periods.push("6_months");
          }
          if (plan.months_12_enabled && plan.months_12_price && plan.months_12_price > 0) {
            periods.push("12_months");
          }
          
          console.log('Available periods after filtering:', periods);
          setAvailablePeriods(periods);
          
          // Set default period to first available
          if (periods.length > 0) {
            if (!periods.includes(bookingPeriod)) {
              setBookingPeriod(periods[0] as any);
              console.log('Updated booking period to:', periods[0]);
            }
          } else {
            // If no periods are enabled, fallback to 1_month
            console.warn('No pricing periods enabled for this study hall');
            setAvailablePeriods(["1_month"]);
            setBookingPeriod("1_month");
          }
        } else {
          // No monthly pricing plan, use all periods
          console.log('No monthly pricing plan found, using default periods');
          setAvailablePeriods(["1_month", "2_months", "3_months", "6_months", "12_months"]);
        }
      } catch (error) {
        console.error('Error loading monthly pricing:', error);
        setAvailablePeriods(["1_month", "2_months", "3_months", "6_months", "12_months"]);
      }
    };

    loadMonthlyPricing();
  }, [studyHall?.id, getPricingPlan]);

  // Check availability when dates change
  useEffect(() => {
    let isCancelled = false;
    const timeoutId = setTimeout(() => {
      if (!isCancelled) {
        setCheckingAvailability(false);
        setAvailabilityError("Request timeout - please try again");
      }
    }, 15000);

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
        
        // Calculate amount using monthly pricing
        let amountCalc;
        if (monthlyPricingPlan) {
          try {
            amountCalc = calculateMonthlyBookingAmount(
              startDate, 
              endDate, 
              monthlyPricingPlan
            );
            console.log('Using monthly pricing calculation:', amountCalc);
          } catch (error: any) {
            console.error('Error with monthly pricing:', error);
            // Fallback to study hall base monthly price
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
            const months = Math.ceil(days / 30);
            amountCalc = {
              amount: months * studyHall.monthly_price,
              months,
              periodType: '1_month'
            };
            console.log('Fallback to study hall base pricing:', amountCalc);
          }
        } else {
          // Use base monthly price
          const start = new Date(startDate);
          const end = new Date(endDate);
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
          const months = Math.ceil(days / 30);
          amountCalc = {
            amount: months * studyHall.monthly_price,
            months,
            periodType: '1_month'
          };
          console.log('Using study hall base pricing:', amountCalc);
        }
        
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
  }, [studyHall, startDate, endDate, selectedSeat, monthlyPricingPlan]);

  useEffect(() => {
    if (open && studyHall) {
      setSelectedSeat("");
      setAvailabilityMap({});
      setAvailabilityError("");
      setCalculatedAmount(null);
      setAppliedCoupon(null);
      setAppliedRewards(null);
      
      // Set default dates
      const today = new Date();
      setStartDate(today.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  }, [open, studyHall]);

  // Lock body scroll when payment modal is open
  useEffect(() => {
    if (showPayment) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
      };
    }
  }, [showPayment]);

  // Update end date when booking period changes
  useEffect(() => {
    if (!startDate) return;
    
    const start = new Date(startDate);
    let end = new Date(start);
    
    const periodMap = {
      "1_month": 1,
      "2_months": 2,
      "3_months": 3,
      "6_months": 6,
      "12_months": 12
    };
    
    const monthsToAdd = periodMap[bookingPeriod] || 1;
    end.setMonth(end.getMonth() + monthsToAdd);
    end.setDate(end.getDate() - 1);
    
    setEndDate(end.toISOString().split('T')[0]);
  }, [bookingPeriod, startDate]);

  // Get the correct price for display based on monthly pricing
  const getPriceForPeriod = (period: string) => {
    if (monthlyPricingPlan) {
      switch (period) {
        case "1_month":
          return monthlyPricingPlan.months_1_enabled && monthlyPricingPlan.months_1_price 
            ? monthlyPricingPlan.months_1_price 
            : null;
        case "2_months":
          return monthlyPricingPlan.months_2_enabled && monthlyPricingPlan.months_2_price 
            ? monthlyPricingPlan.months_2_price 
            : null;
        case "3_months":
          return monthlyPricingPlan.months_3_enabled && monthlyPricingPlan.months_3_price 
            ? monthlyPricingPlan.months_3_price 
            : null;
        case "6_months":
          return monthlyPricingPlan.months_6_enabled && monthlyPricingPlan.months_6_price 
            ? monthlyPricingPlan.months_6_price 
            : null;
        case "12_months":
          return monthlyPricingPlan.months_12_enabled && monthlyPricingPlan.months_12_price 
            ? monthlyPricingPlan.months_12_price 
            : null;
        default:
          return null;
      }
    }
    
    // Fallback to study hall base monthly pricing
    return studyHall?.monthly_price || 0;
  };

  const getCurrentAmount = () => {
    return calculatedAmount?.amount || 0;
  };

  const getTotalDiscount = () => {
    return (appliedCoupon?.discount || 0) + (appliedRewards?.discount || 0);
  };

  const getFinalAmount = () => {
    return Math.max(0, getCurrentAmount() - getTotalDiscount());
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

      // Create booking intent with calculated amount and discounts
      const intent = {
        study_hall_id: studyHall.id,
        seat_id: selectedSeat,
        booking_period: bookingPeriod,
        start_date: startDate,
        end_date: endDate,
        total_amount: getFinalAmount(),
        original_amount: getCurrentAmount(),
        coupon_code: appliedCoupon?.code,
        coupon_discount: appliedCoupon?.discount || 0,
        reward_points_used: appliedRewards?.pointsUsed || 0,
        reward_discount: appliedRewards?.discount || 0,
        total_discount: getTotalDiscount(),
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
    
    if (bookingData) {
      const params = new URLSearchParams({
        booking_id: bookingData.id,
        amount: bookingData.total_amount.toString(),
        study_hall_name: bookingData.study_hall?.name || '',
        seat_info: `${bookingData.seat?.row_name}${bookingData.seat?.seat_number}` || '',
      });
      window.location.href = `/payment-success?${params.toString()}`;
    } else {
      onSuccess?.();
    }
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setBookingIntent(null);
  };

  if (!studyHall) return null;

  return (
    <>
      <Dialog open={open && !showPayment} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Book Study Hall</DialogTitle>
            <DialogDescription>
              Reserve your monthly subscription at {studyHall.name}
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
              <p className="text-sm text-primary font-medium">Base Monthly Rate: ₹{studyHall.monthly_price}</p>
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
                  {Object.entries(
                    availableSeats.reduce((acc, seat) => {
                      if (!acc[seat.row_name]) acc[seat.row_name] = [];
                      acc[seat.row_name].push(seat);
                      return acc;
                    }, {})
                  ).map(([rowName, rowSeats]) => (
                    <div key={rowName} className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Row {rowName}</h4>
                       <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                         {(rowSeats as Seat[]).sort((a, b) => a.seat_number - b.seat_number).map((seat) => (
                          <button
                            key={seat.id}
                            type="button"
                            onClick={() => setSelectedSeat(seat.id)}
                             className={`
                               w-12 h-12 sm:w-10 sm:h-10 rounded text-xs font-medium border-2 transition-all touch-manipulation
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
            <Label htmlFor="period">Monthly Subscription Period</Label>
            <Select value={bookingPeriod} onValueChange={(value: "1_month" | "2_months" | "3_months" | "6_months" | "12_months") => setBookingPeriod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availablePeriods.map((period) => {
                  const price = getPriceForPeriod(period);
                  if (price === null || price <= 0) return null;
                  
                  const periodLabel = {
                    "1_month": "1 Month",
                    "2_months": "2 Months", 
                    "3_months": "3 Months",
                    "6_months": "6 Months",
                    "12_months": "12 Months"
                  }[period] || period;
                  
                  return (
                    <SelectItem key={period} value={period}>
                      {periodLabel} - ₹{price}
                      {monthlyPricingPlan && (
                        <span className="text-xs text-muted-foreground ml-1">(Custom Plan)</span>
                      )}
                    </SelectItem>
                  );
                })}
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
                readOnly
              />
              <p className="text-xs text-muted-foreground">
                End date is automatically calculated based on subscription period
              </p>
            </div>
          </div>

          {calculatedAmount && (
            <CouponInput
              bookingAmount={getCurrentAmount()}
              studyHallId={studyHall.id}
              onCouponApplied={(discount, couponCode) => {
                setAppliedCoupon({ code: couponCode, discount: discount });
              }}
              onCouponRemoved={() => setAppliedCoupon(null)}
              appliedCoupon={appliedCoupon}
            />
          )}

          {calculatedAmount && (
            <RewardsInput
              bookingAmount={getCurrentAmount()}
              onRewardsApplied={(discount, pointsUsed) => {
                setAppliedRewards({ pointsUsed: pointsUsed, discount: discount });
              }}
              onRewardsRemoved={() => setAppliedRewards(null)}
              appliedRewards={appliedRewards}
            />
          )}

          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                {calculatedAmount && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span>Base Price:</span>
                      <span>₹{getCurrentAmount().toLocaleString()}</span>
                    </div>
                    
                    {appliedCoupon && (
                      <div className="flex justify-between items-center text-sm text-green-600">
                        <span>Coupon ({appliedCoupon.code}):</span>
                        <span>-₹{appliedCoupon.discount.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {appliedRewards && (
                      <div className="flex justify-between items-center text-sm text-blue-600">
                        <span>Rewards ({appliedRewards.pointsUsed} points):</span>
                        <span>-₹{appliedRewards.discount.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {getTotalDiscount() > 0 && (
                      <div className="flex justify-between items-center text-sm text-green-600 font-medium">
                        <span>Total Savings:</span>
                        <span>-₹{getTotalDiscount().toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="font-medium">Final Amount:</span>
                      <span className="text-lg font-bold">₹{getFinalAmount().toLocaleString()}</span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {calculatedAmount.months} month{calculatedAmount.months !== 1 ? 's' : ''} • {calculatedAmount.periodType} subscription
                      {monthlyPricingPlan && (
                        <span className="ml-1">(custom pricing plan)</span>
                      )}
                    </div>
                  </>
                )}
                {!calculatedAmount && (
                  <div className="text-center py-4 text-muted-foreground">
                    Select dates to see pricing
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

           <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
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
              {loading ? "Booking..." : checkingAvailability ? "Checking..." : "Subscribe Now"}
            </Button>
          </div>
        </form>
        </DialogContent>
      </Dialog>

      {showPayment && bookingIntent && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onScroll={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div 
            className="bg-background w-full max-w-md rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto pointer-events-auto touch-manipulation"
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            style={{ 
              position: 'relative',
              zIndex: 10000
            }}
          >
            <PaymentProcessor
              bookingIntent={bookingIntent}
              onPaymentSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </div>
        </div>
      )}
    </>
  );
}