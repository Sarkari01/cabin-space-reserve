import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useBookingAvailability } from '@/hooks/useBookingAvailability';
import { useMonthlyPricing } from '@/hooks/useMonthlyPricing';
import { PaymentProcessor } from './PaymentProcessor';
import { CouponInput } from './CouponInput';
import { RewardsInput } from './RewardsInput';
import { StudyHallData } from '@/types/StudyHall';

interface Seat {
  id: string;
  seat_id: string;
  row_name: string;
  seat_number: number;
  is_available: boolean;
}

interface MonthlyBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studyHall: StudyHallData;
  onSuccess?: () => void;
}

export const MonthlyBookingModal: React.FC<MonthlyBookingModalProps> = ({
  open,
  onOpenChange,
  studyHall,
  onSuccess
}) => {
  const { toast } = useToast();
  const { checkAvailability } = useBookingAvailability();
  const { getPricingPlan, calculateMonthlyBookingAmount } = useMonthlyPricing();

  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [bookingPeriod, setBookingPeriod] = useState<string>('1_month');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [availability, setAvailability] = useState<any[]>([]);
  const [pricingPlan, setPricingPlan] = useState<any>(null);
  const [couponData, setCouponData] = useState<{ code: string; discount: number; type: 'percentage' | 'fixed' } | null>(null);
  const [rewardPoints, setRewardPoints] = useState({ used: 0, discount: 0 });

  // Load pricing plan
  useEffect(() => {
    const loadPricingPlan = async () => {
      const plan = await getPricingPlan(studyHall.id);
      setPricingPlan(plan);
    };
    
    if (studyHall.id) {
      loadPricingPlan();
    }
  }, [studyHall.id, getPricingPlan]);

  // Update end date when period changes
  useEffect(() => {
    if (startDate && bookingPeriod) {
      const start = new Date(startDate);
      const monthsToAdd = parseInt(bookingPeriod.split('_')[0]);
      const end = new Date(start);
      end.setMonth(end.getMonth() + monthsToAdd);
      end.setDate(end.getDate() - 1); // End day is inclusive
      setEndDate(end);
    }
  }, [startDate, bookingPeriod]);

  // Check availability when dates change
  useEffect(() => {
    const checkSeatAvailability = async () => {
      if (startDate && endDate) {
        setLoading(true);
        try {
          const availabilityData = await checkAvailability(
            studyHall.id,
            format(startDate, 'yyyy-MM-dd'),
            format(endDate, 'yyyy-MM-dd')
          );
          setAvailability(availabilityData);
          
          // Get available seats
          const availableSeats = availabilityData.filter(seat => seat.is_available);
          setSeats(availableSeats);
          
          // Reset selected seat if no longer available
          if (selectedSeat && !availableSeats.find(seat => seat.id === selectedSeat.id)) {
            setSelectedSeat(null);
          }
        } catch (error) {
          console.error('Error checking availability:', error);
          toast({
            title: "Error",
            description: "Failed to check seat availability",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      }
    };

    checkSeatAvailability();
  }, [startDate, endDate, studyHall.id, checkAvailability, selectedSeat, toast]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedSeat(null);
      setBookingPeriod('1_month');
      setStartDate(new Date());
      setShowPayment(false);
      setCouponData(null);
      setRewardPoints({ used: 0, discount: 0 });
    }
  }, [open]);

  const getAvailableSeats = () => {
    return seats.filter(seat => seat.is_available);
  };

  const getPriceForPeriod = (): number => {
    if (!pricingPlan) return 0;
    
    switch (bookingPeriod) {
      case '1_month':
        return pricingPlan.months_1_price || 0;
      case '2_months':
        return pricingPlan.months_2_price || 0;
      case '3_months':
        return pricingPlan.months_3_price || 0;
      case '6_months':
        return pricingPlan.months_6_price || 0;
      case '12_months':
        return pricingPlan.months_12_price || 0;
      default:
        return 0;
    }
  };

  const getCurrentAmount = (): number => {
    const periodPrice = getPriceForPeriod();
    const monthsCount = parseInt(bookingPeriod.split('_')[0]);
    return periodPrice * (monthsCount === 1 ? 1 : Math.ceil(monthsCount / parseInt(bookingPeriod.split('_')[0])));
  };

  const getTotalDiscount = (): number => {
    return (couponData?.discount || 0) + rewardPoints.discount;
  };

  const getFinalAmount = (): number => {
    return Math.max(0, getCurrentAmount() - getTotalDiscount());
  };

  const getAvailablePeriods = () => {
    if (!pricingPlan) return [];
    
    const periods = [];
    if (pricingPlan.months_1_enabled && pricingPlan.months_1_price) periods.push({ value: '1_month', label: '1 Month' });
    if (pricingPlan.months_2_enabled && pricingPlan.months_2_price) periods.push({ value: '2_months', label: '2 Months' });
    if (pricingPlan.months_3_enabled && pricingPlan.months_3_price) periods.push({ value: '3_months', label: '3 Months' });
    if (pricingPlan.months_6_enabled && pricingPlan.months_6_price) periods.push({ value: '6_months', label: '6 Months' });
    if (pricingPlan.months_12_enabled && pricingPlan.months_12_price) periods.push({ value: '12_months', label: '12 Months' });
    
    return periods;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSeat || !startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select a seat and dates",
        variant: "destructive"
      });
      return;
    }

    // Final availability check
    setLoading(true);
    try {
      const finalAvailability = await checkAvailability(
        studyHall.id,
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );
      
      const seatStillAvailable = finalAvailability.find(
        seat => seat.id === selectedSeat.id && seat.is_available
      );
      
      if (!seatStillAvailable) {
        toast({
          title: "Seat No Longer Available",
          description: "This seat has been booked by someone else. Please select another seat.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      setShowPayment(true);
    } catch (error) {
      console.error('Error in final availability check:', error);
      toast({
        title: "Error",
        description: "Failed to verify seat availability",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (bookingData?: any) => {
    onOpenChange(false);
    onSuccess?.();
    
    if (bookingData) {
      window.location.href = `/payment-success?booking_id=${bookingData.id}`;
    }
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
  };

  const availablePeriods = getAvailablePeriods();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Your Study Hall - {studyHall.name}</DialogTitle>
        </DialogHeader>

        {!showPayment ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Study Hall Info */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{studyHall.name}</h3>
              <p className="text-muted-foreground">{studyHall.location}</p>
            </div>

            {/* Booking Period Selection */}
            <div className="space-y-2">
              <Label htmlFor="period">Select Booking Period</Label>
              <Select value={bookingPeriod} onValueChange={setBookingPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select booking period" />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods.map(period => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label} - ₹{getPriceForPeriod()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'dd/MM/yyyy') : 'Select start date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'dd/MM/yyyy') : 'Auto-calculated'}
                </Button>
              </div>
            </div>

            {/* Seat Selection */}
            <div className="space-y-4">
              <Label>Available Seats ({getAvailableSeats().length} available)</Label>
              
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Checking availability...</span>
                </div>
              ) : (
                <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto border rounded-lg p-4">
                  {getAvailableSeats().map((seat) => (
                    <Button
                      key={seat.id}
                      type="button"
                      variant={selectedSeat?.id === seat.id ? "default" : "outline"}
                      className="h-10 text-xs"
                      onClick={() => setSelectedSeat(seat)}
                    >
                      {seat.seat_id}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Coupon Input */}
            <CouponInput
              studyHallId={studyHall.id}
              bookingAmount={getCurrentAmount()}
              onCouponApplied={setCouponData}
            />

            {/* Rewards Input */}
            <RewardsInput
              bookingAmount={getCurrentAmount() - (couponData?.discount || 0)}
              onRewardsApplied={setRewardPoints}
            />

            {/* Pricing Summary */}
            {selectedSeat && (
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">Booking Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Seat:</span>
                    <span>{selectedSeat.seat_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Period:</span>
                    <span>{availablePeriods.find(p => p.value === bookingPeriod)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Amount:</span>
                    <span>₹{getCurrentAmount()}</span>
                  </div>
                  {getTotalDiscount() > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Total Discount:</span>
                      <span>-₹{getTotalDiscount()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Final Amount:</span>
                    <span>₹{getFinalAmount()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!selectedSeat || loading || getAvailableSeats().length === 0}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Book Now
              </Button>
            </div>
          </form>
        ) : (
          <PaymentProcessor
            bookingData={{
              study_hall_id: studyHall.id,
              seat_id: selectedSeat!.id,
              booking_period: bookingPeriod as any,
              start_date: format(startDate!, 'yyyy-MM-dd'),
              end_date: format(endDate!, 'yyyy-MM-dd'),
              total_amount: getFinalAmount(),
              original_amount: getCurrentAmount(),
              coupon_code: couponData?.code,
              coupon_discount: couponData?.discount,
              reward_points_used: rewardPoints.used,
              reward_discount: rewardPoints.discount,
              total_discount: getTotalDiscount()
            }}
            studyHallName={studyHall.name}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};