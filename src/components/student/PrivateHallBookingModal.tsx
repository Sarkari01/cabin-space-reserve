import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Users, DollarSign } from 'lucide-react';
import { format, addMonths, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { PrivateHall, Cabin } from '@/types/PrivateHall';

interface PrivateHallBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  privateHall: PrivateHall | null;
}

export const PrivateHallBookingModal: React.FC<PrivateHallBookingModalProps> = ({
  isOpen,
  onClose,
  privateHall,
}) => {
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCabins = async () => {
    if (!privateHall) return;
    
    try {
      const { data, error } = await supabase
        .from('cabins')
        .select('*')
        .eq('private_hall_id', privateHall.id)
        .eq('status', 'available')
        .order('cabin_number');

      if (error) {
        console.error('Error fetching cabins:', error);
        return;
      }

      setCabins(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (isOpen && privateHall) {
      fetchCabins();
    }
  }, [isOpen, privateHall]);

  const calculateBookingDetails = () => {
    if (!startDate || !endDate || !selectedCabin) return null;

    const days = differenceInDays(endDate, startDate) + 1;
    const months = Math.ceil(days / 30);
    const monthlyPrice = selectedCabin.monthly_price || privateHall?.monthly_price || 0;
    const totalAmount = months * monthlyPrice;

    return { days, months, monthlyPrice, totalAmount };
  };

  const checkCabinAvailability = async (cabinId: string, start: Date, end: Date): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('cabin_bookings')
        .select('*')
        .eq('cabin_id', cabinId)
        .in('status', ['active', 'pending'])
        .or(`start_date.lte.${format(end, 'yyyy-MM-dd')},end_date.gte.${format(start, 'yyyy-MM-dd')}`);

      if (error) {
        console.error('Error checking availability:', error);
        return false;
      }

      return data.length === 0; // Available if no conflicting bookings
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const handleBooking = async () => {
    if (!user || !selectedCabin || !startDate || !endDate || !privateHall) {
      toast.error('Please complete all required fields');
      return;
    }

    const bookingDetails = calculateBookingDetails();
    if (!bookingDetails) return;

    try {
      setLoading(true);

      // Check cabin availability
      const isAvailable = await checkCabinAvailability(selectedCabin.id, startDate, endDate);
      if (!isAvailable) {
        toast.error('Selected cabin is not available for the chosen dates. Please select different dates or cabin.');
        return;
      }

      const bookingData = {
        user_id: user.id,
        cabin_id: selectedCabin.id,
        private_hall_id: privateHall.id,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        months_booked: bookingDetails.months,
        monthly_amount: bookingDetails.monthlyPrice,
        total_amount: bookingDetails.totalAmount,
        payment_status: 'unpaid' as const,
        status: 'pending' as const,
      };

      const { data: booking, error } = await supabase
        .from('cabin_bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) {
        console.error('Error creating booking:', error);
        toast.error('Failed to create booking');
        return;
      }

      // Initiate payment process
      await initiatePayment(booking.id, bookingDetails.totalAmount);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async (bookingId: string, amount: number) => {
    try {
      // Create payment order
      const { data: orderData, error } = await supabase.functions.invoke('cabin-booking-payment', {
        body: {
          action: 'create_order',
          booking_id: bookingId,
          amount: amount,
        }
      });

      if (error) {
        console.error('Error creating payment order:', error);
        toast.error('Failed to initiate payment');
        return;
      }

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: privateHall?.name || 'Private Hall Booking',
        description: `Cabin booking for ${orderData.booking_details?.months} month(s)`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          await verifyPayment(response, bookingId);
        },
        prefill: {
          name: user?.user_metadata?.full_name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function() {
            toast.error('Payment cancelled');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error('Failed to initiate payment');
    }
  };

  const verifyPayment = async (paymentResponse: any, bookingId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('cabin-booking-payment', {
        body: {
          action: 'verify_payment',
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          booking_id: bookingId,
        }
      });

      if (error) {
        console.error('Payment verification failed:', error);
        toast.error('Payment verification failed');
        return;
      }

      toast.success('Payment successful! Your cabin has been booked.');
      onClose();
      // Optionally refresh the page or redirect to bookings page
      
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Payment verification failed');
    }
  };

  const loadRazorpayScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay script'));
      document.head.appendChild(script);
    });
  };

  const bookingDetails = calculateBookingDetails();

  if (!privateHall) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Cabin - {privateHall.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabin Selection */}
          <div>
            <Label className="text-base font-semibold">Select Cabin</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {cabins.map((cabin) => (
                <Card
                  key={cabin.id}
                  className={cn(
                    'p-3 cursor-pointer transition-all hover:shadow-md',
                    selectedCabin?.id === cabin.id ? 'ring-2 ring-primary' : ''
                  )}
                  onClick={() => setSelectedCabin(cabin)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{cabin.cabin_name}</span>
                      <Badge variant="outline">#{cabin.cabin_number}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      ₹{cabin.monthly_price || privateHall.monthly_price}/month
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Max {cabin.max_occupancy} person(s)
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {cabins.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No available cabins at the moment
              </p>
            )}
          </div>

          {/* Date Selection */}
          {selectedCabin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP') : 'Pick start date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
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
                        'w-full justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP') : 'Pick end date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => date < (startDate || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Booking Summary */}
          {bookingDetails && (
            <Card className="p-4 bg-muted/50">
              <h3 className="font-semibold mb-3">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Cabin:</span>
                  <span>{selectedCabin?.cabin_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{bookingDetails.days} days ({bookingDetails.months} month(s))</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Rate:</span>
                  <span>₹{bookingDetails.monthlyPrice}</span>
                </div>
                <div className="flex justify-between font-semibold text-base border-t pt-2">
                  <span>Total Amount:</span>
                  <span>₹{bookingDetails.totalAmount}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleBooking} 
              disabled={!selectedCabin || !startDate || !endDate || loading}
            >
              {loading ? 'Creating Booking...' : 'Book Now'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};