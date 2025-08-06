import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, MapPin, Users, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { PrivateHall, Cabin } from '@/types/PrivateHall';
import { StudentCabinLayoutViewer } from './StudentCabinLayoutViewer';
import { 
  CabinBookingErrorHandler, 
  useCabinBookingErrorHandler,
  CabinBookingError,
  CabinUnavailableError,
  PaymentError,
  ValidationError
} from '@/components/CabinBookingErrorHandler';
import { useCabinBooking } from '@/hooks/useCabinBooking';

interface PrivateHallBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  privateHall: PrivateHall | null;
  onSuccess?: () => void;
}

export const PrivateHallBookingModal: React.FC<PrivateHallBookingModalProps> = ({
  isOpen,
  onClose,
  privateHall,
  onSuccess,
}) => {
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(null);
  const [selectedCabinFromLayout, setSelectedCabinFromLayout] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const { user, session } = useAuth();
  const { error, handleError, clearError, retry } = useCabinBookingErrorHandler();
  const { toast } = useToast();
  // Import from hook to avoid conflicts with existing function
  const bookingHook = useCabinBooking();

  const handleCabinSelectFromLayout = async (cabinId: string) => {
    setSelectedCabinFromLayout(cabinId);
    
    if (!privateHall) return;
    
    try {
      // Get the actual database cabin ID for this layout cabin
      const { data: dbCabinId, error } = await supabase.rpc('get_cabin_id_mapping', {
        p_private_hall_id: privateHall.id,
        p_layout_cabin_id: cabinId
      });

      if (error) {
        console.error('Error getting cabin ID mapping:', error);
        toast({
          title: "Error",
          description: "Failed to select cabin. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!dbCabinId) {
        // If no database cabin found, try to sync the layout first
        console.warn('No database cabin found for layout cabin:', cabinId);
        
        // Attempt to sync cabins if layout exists
        if (privateHall.cabin_layout_json) {
          const { error: syncError } = await supabase.rpc('sync_private_hall_cabins', {
            p_private_hall_id: privateHall.id,
            p_layout_json: privateHall.cabin_layout_json
          });
          
          if (syncError) {
            console.error('Error syncing cabins:', syncError);
            toast({
              title: "Error",
              description: "Failed to sync cabin data. Please contact support.",
              variant: "destructive",
            });
            return;
          }
          
          // Try to get the cabin ID again after sync
          const { data: retryDbCabinId, error: retryError } = await supabase.rpc('get_cabin_id_mapping', {
            p_private_hall_id: privateHall.id,
            p_layout_cabin_id: cabinId
          });
          
          if (retryError || !retryDbCabinId) {
            console.error('Failed to find cabin after sync:', retryError);
            toast({
              title: "Error",
              description: "Cabin not available. Please try a different cabin.",
              variant: "destructive",
            });
            return;
          }
          
          // Use the cabin ID from retry
          await selectCabinById(retryDbCabinId, cabinId);
        } else {
          toast({
            title: "Error",
            description: "Cabin not available. Please try a different cabin.",
            variant: "destructive",
          });
        }
        return;
      }

      // Fetch the actual cabin data from database
      await selectCabinById(dbCabinId, cabinId);
      
    } catch (error) {
      console.error('Error in handleCabinSelectFromLayout:', error);
      toast({
        title: "Error",
        description: "Failed to select cabin. Please try again.",
        variant: "destructive",
      });
    }
  };

  const selectCabinById = async (dbCabinId: string, layoutCabinId: string) => {
    try {
      const { data: cabin, error } = await supabase
        .from('cabins')
        .select('*')
        .eq('id', dbCabinId)
        .single();

      if (error) {
        console.error('Error fetching cabin:', error);
        toast({
          title: "Error",
          description: "Failed to load cabin details.",
          variant: "destructive",
        });
        return;
      }

      setSelectedCabin(cabin);
    } catch (error) {
      console.error('Error in selectCabinById:', error);
      toast({
        title: "Error",
        description: "Failed to load cabin details.",
        variant: "destructive",
      });
    }
  };


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
      // Reset state when modal opens
      setSelectedCabin(null);
      setSelectedCabinFromLayout('');
      setStartDate(undefined);
      setEndDate(undefined);
      clearError();
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
      setAvailabilityLoading(true);
      
      // Use the new database function for availability checking
      const { data, error } = await supabase.rpc('check_cabin_availability_for_dates', {
        p_cabin_id: cabinId,
        p_start_date: format(start, 'yyyy-MM-dd'),
        p_end_date: format(end, 'yyyy-MM-dd')
      });

      if (error) {
        console.error('Error checking cabin availability:', error);
        throw new ValidationError('cabin availability check');
      }

      return data === true;
    } catch (error) {
      console.error('Cabin availability check failed:', error);
      throw new ValidationError('cabin availability verification');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user || !selectedCabin || !startDate || !endDate || !privateHall) {
      handleError(new ValidationError('all required fields'));
      return;
    }

    const bookingDetails = calculateBookingDetails();
    if (!bookingDetails) {
      handleError(new ValidationError('booking details'));
      return;
    }

    try {
      setLoading(true);
      clearError(); // Clear any previous errors

      // Ensure we have a valid session before proceeding
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Authentication error:', sessionError);
        throw new ValidationError('authentication session');
      }

      console.log('User authenticated, session valid:', session.user.id);

      // Check cabin availability
      const isAvailable = await checkCabinAvailability(selectedCabin.id, startDate, endDate);
      if (!isAvailable) {
        throw new CabinUnavailableError(selectedCabin.cabin_name);
      }

      // Use the enhanced booking hook
      const bookingData = {
        cabin_id: selectedCabin.id,
        private_hall_id: privateHall.id,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        months_booked: bookingDetails.months,
        monthly_amount: bookingDetails.monthlyPrice,
        total_amount: bookingDetails.totalAmount,
      };

      console.log('Creating booking with data:', bookingData);

      const bookingId = await bookingHook.createBooking(bookingData);

      console.log('Booking created successfully with ID:', bookingId);
      
      // Show success message
      toast({
        title: "Booking Created!",
        description: "Your cabin booking has been created. Please complete the payment.",
      });

      // Initiate payment process
      await initiatePayment(bookingId, bookingDetails.totalAmount);

    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async (bookingId: string, amount: number) => {
    try {
      console.log('Initiating payment for booking:', bookingId, 'Amount:', amount);
      
      // Create payment order
      const { data: orderData, error } = await supabase.functions.invoke('cabin-booking-payment', {
        body: {
          action: 'create',
          bookingId: bookingId,
          amount: amount,
        }
      });

      if (error) {
        console.error('Error creating payment order:', error);
        throw new PaymentError(`Payment initiation failed: ${error.message}`);
      }

      if (!orderData?.orderId) {
        console.error('Invalid order data received:', orderData);
        throw new PaymentError('Invalid payment response from server');
      }

      console.log('Payment order created:', orderData.orderId);

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: privateHall?.name || 'Private Hall Booking',
        description: `Cabin booking for ${orderData.bookingDetails?.cabin_name}`,
        order_id: orderData.orderId,
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
            console.log('Payment modal dismissed');
            // Don't show error on manual dismissal
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Error initiating payment:', error);
      throw error instanceof PaymentError ? error : new PaymentError('Failed to initiate payment process');
    }
  };

  const verifyPayment = async (paymentResponse: any, bookingId: string) => {
    try {
      console.log('Verifying payment:', paymentResponse);
      
      const { data, error } = await supabase.functions.invoke('cabin-booking-payment', {
        body: {
          action: 'verify',
          bookingId: bookingId,
          paymentResponse: paymentResponse,
        }
      });

      if (error) {
        console.error('Payment verification failed:', error);
        throw new PaymentError(`Payment verification failed: ${error.message}`);
      }

      if (!data?.success) {
        console.error('Payment verification unsuccessful:', data);
        throw new PaymentError('Payment verification was unsuccessful');
      }

      console.log('Payment verified successfully:', data);
      
      toast({
        title: "Payment Successful!",
        description: "Your cabin has been booked successfully.",
      });
      
      onSuccess?.();
      onClose();
      
    } catch (error) {
      console.error('Error verifying payment:', error);
      handleError(error instanceof PaymentError ? error : new PaymentError('Payment verification failed'));
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
          <DialogDescription>
            Select a cabin, choose your dates, and complete your booking with secure payment.
          </DialogDescription>
        </DialogHeader>

        <CabinBookingErrorHandler
          error={error}
          loading={loading}
          onRetry={() => retry(async () => {
            clearError();
            if (privateHall?.cabin_layout_json) {
              // Retry cabin sync if needed
              await supabase.rpc('sync_private_hall_cabins', {
                p_private_hall_id: privateHall.id,
                p_layout_json: privateHall.cabin_layout_json
              });
            }
            await fetchCabins();
          })}
          fallbackMessage="Unable to load cabin booking interface"
        >
          <div className="space-y-6">
            {/* Clean Student Cabin Layout */}
            {privateHall.cabin_layout_json ? (
              <StudentCabinLayoutViewer
                layout={privateHall.cabin_layout_json}
                privateHallId={privateHall.id}
                privateHallName={privateHall.name}
                onCabinSelect={handleCabinSelectFromLayout}
                selectedCabinId={selectedCabinFromLayout || undefined}
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onClose={onClose}
                onBookNow={() => {
                  if (selectedCabinFromLayout && startDate && endDate) {
                    handleBooking();
                  } else {
                    handleError(new ValidationError('cabin and dates'));
                  }
                }}
              />
            ) : (
              <>
                {/* Fallback Cabin Selection */}
                <div>
                  <Label className="text-base font-semibold">Available Cabins</Label>
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
              </>
            )}

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


            {/* Actions - Only show if layout is not available */}
            {!privateHall.cabin_layout_json && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleBooking} 
                  disabled={!selectedCabin || !startDate || !endDate || loading || availabilityLoading}
                >
                  {loading ? 'Creating Booking...' : availabilityLoading ? 'Checking Availability...' : 'Book Now'}
                </Button>
              </div>
            )}
          </div>
        </CabinBookingErrorHandler>
      </DialogContent>
    </Dialog>
  );
};