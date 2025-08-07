import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Heart, MapPin, CalendarIcon, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays, addMonths } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { CabinLayoutData } from '@/types/PrivateHall';
import { CouponInput } from '@/components/CouponInput';
import { RewardsInput } from '@/components/RewardsInput';

interface CabinAvailability {
  [cabinId: string]: {
    status: 'available' | 'occupied' | 'maintenance';
    bookings?: number;
  };
}

interface StudentCabinLayoutViewerProps {
  layout: CabinLayoutData;
  privateHallId: string;
  privateHallName: string;
  onCabinSelect?: (cabinId: string) => void;
  selectedCabinId?: string;
  onClose?: () => void;
  onBookNow?: () => void;
  startDate?: Date;
  onStartDateChange?: (date: Date | undefined) => void;
  appliedCoupon?: { code: string; discount: number } | null;
  appliedRewards?: { pointsUsed: number; discount: number } | null;
  onCouponApplied?: (discount: number, code: string) => void;
  onCouponRemoved?: () => void;
  onRewardsApplied?: (discount: number, pointsUsed: number) => void;
  onRewardsRemoved?: () => void;
  cabins?: Array<{
    id: string;
    cabin_name: string;
    monthly_price?: number;
    refundable_deposit?: number;
    amenities: string[];
  }>;
}

export const StudentCabinLayoutViewer: React.FC<StudentCabinLayoutViewerProps> = ({
  layout,
  privateHallId,
  privateHallName,
  onCabinSelect,
  selectedCabinId,
  onClose,
  onBookNow,
  startDate,
  onStartDateChange,
  appliedCoupon,
  appliedRewards,
  onCouponApplied,
  onCouponRemoved,
  onRewardsApplied,
  onRewardsRemoved,
  cabins = []
}) => {
  const [availability, setAvailability] = useState<CabinAvailability>({});
  const [loading, setLoading] = useState(false);
  const [cabinIdMapping, setCabinIdMapping] = useState<{[layoutId: string]: string}>({});

  // Create a mapping between layout cabin IDs and database cabin UUIDs
  const createCabinIdMapping = async () => {
    try {
      console.log('Creating cabin ID mapping for private hall:', privateHallId);
      console.log('Layout cabins:', layout.cabins.map(c => ({ id: c.id, name: c.name })));
      
      // Fetch all cabins for this private hall first
      const { data: allCabins, error: cabinsError } = await supabase
        .from('cabins')
        .select('id, cabin_name, cabin_number')
        .eq('private_hall_id', privateHallId)
        .order('cabin_number');

      if (cabinsError) {
        console.error('Error fetching cabins for mapping:', cabinsError);
        return {};
      }

      console.log('Database cabins:', allCabins);

      const mapping: {[layoutId: string]: string} = {};
      
      // Create mapping using multiple strategies
      for (const layoutCabin of layout.cabins) {
        let dbCabinId: string | null = null;
        
        // Strategy 1: Direct name match (cabin name = layout cabin name)
        let matchedCabin = allCabins?.find(dbCabin => dbCabin.cabin_name === layoutCabin.name);
        if (matchedCabin) {
          dbCabinId = matchedCabin.id;
          console.log(`✅ Direct name match: ${layoutCabin.id} (${layoutCabin.name}) -> ${dbCabinId}`);
        }
        
        // Strategy 2: Use RPC function for complex matching
        if (!dbCabinId) {
          const { data: rpcResult, error } = await supabase.rpc('get_cabin_id_mapping', {
            p_private_hall_id: privateHallId,
            p_layout_cabin_id: layoutCabin.id
          });
          
          if (!error && rpcResult) {
            dbCabinId = rpcResult;
            console.log(`✅ RPC mapping: ${layoutCabin.id} -> ${dbCabinId}`);
          }
        }
        
        // Strategy 3: Extract number from layout cabin ID and match by position
        if (!dbCabinId) {
          const cabinMatch = layoutCabin.id.match(/cabin-(\d+)$/);
          if (cabinMatch) {
            const cabinPosition = parseInt(cabinMatch[1]);
            if (allCabins && cabinPosition <= allCabins.length) {
              dbCabinId = allCabins[cabinPosition - 1]?.id;
              console.log(`✅ Position match: ${layoutCabin.id} (position ${cabinPosition}) -> ${dbCabinId}`);
            }
          }
        }
        
        if (dbCabinId) {
          mapping[layoutCabin.id] = dbCabinId;
        } else {
          console.warn(`❌ No mapping found for layout cabin: ${layoutCabin.id} (${layoutCabin.name})`);
        }
      }
      
      console.log('Final cabin mapping:', mapping);
      setCabinIdMapping(mapping);
      return mapping;
    } catch (error) {
      console.error('Error creating cabin ID mapping:', error);
      return {};
    }
  };

  // Fetch real-time availability data using database cabin IDs
  const fetchAvailability = async (forceRefresh = false) => {
    try {
      setLoading(true);

      // Create cabin ID mapping first and use the returned mapping directly
      const currentMapping = forceRefresh ? await createCabinIdMapping() : cabinIdMapping;
      
      // If no mapping exists yet, create it
      const mappingToUse = Object.keys(currentMapping).length > 0 ? currentMapping : await createCabinIdMapping();

      // Fetch cabins and bookings separately to avoid JOIN issues
      const { data: cabins, error: cabinsError } = await supabase
        .from('cabins')
        .select('*')
        .eq('private_hall_id', privateHallId);

      if (cabinsError) {
        console.error('Error fetching cabins:', cabinsError);
        return;
      }

      // Fetch bookings separately - include more statuses that indicate occupation
      const cabinIds = cabins?.map(cabin => cabin.id) || [];
      let bookings: any[] = [];
      
      if (cabinIds.length > 0) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('cabin_bookings')
          .select('*')
          .in('cabin_id', cabinIds)
          .in('status', ['active', 'pending'])
          .neq('payment_status', 'failed');

        if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError);
        } else {
          bookings = bookingsData || [];
        }
      }

      const availabilityMap: CabinAvailability = {};
      
      // Map database cabin availability back to layout cabin IDs
      cabins?.forEach(dbCabin => {
        // Check for any bookings that would make the cabin occupied
        const activeBookings = bookings.filter(booking => {
          const isForThisCabin = booking.cabin_id === dbCabin.id;
          const isOccupying = ['active', 'pending'].includes(booking.status);
          const isPaid = booking.payment_status === 'paid' || booking.status === 'pending';
          
          // Include current date bookings and future bookings
          const today = new Date().toISOString().split('T')[0];
          const isCurrentOrFuture = booking.start_date >= today || 
            (booking.end_date >= today && booking.start_date <= today);
          
          return isForThisCabin && isOccupying && isPaid && isCurrentOrFuture;
        });
        
        // Find the layout cabin ID that corresponds to this database cabin
        const layoutCabinId = Object.keys(mappingToUse).find(
          layoutId => mappingToUse[layoutId] === dbCabin.id
        );
        
        if (layoutCabinId) {
          const status = dbCabin.status === 'maintenance' ? 'maintenance' : 
                        (activeBookings.length > 0 ? 'occupied' : 'available');
          
          availabilityMap[layoutCabinId] = {
            status,
            bookings: activeBookings.length
          };
          
          console.log(`📊 Cabin ${layoutCabinId} (${dbCabin.cabin_name}): ${status} (${activeBookings.length} bookings)`);
        } else {
          console.warn(`❌ No layout cabin found for database cabin ${dbCabin.id} (${dbCabin.cabin_name})`);
        }
      });

      console.log('Availability update:', { mappingToUse, availabilityMap, bookings });
      setAvailability(availabilityMap);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability(true); // Force refresh on mount

    // Set up real-time subscription with retry logic
    const channel = supabase
      .channel(`cabin-bookings-${privateHallId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cabin_bookings',
        filter: `private_hall_id=eq.${privateHallId}`
      }, (payload) => {
        console.log('Real-time booking change:', payload);
        // Add small delay to ensure transaction is committed
        setTimeout(() => fetchAvailability(true), 500);
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [privateHallId]);

  // Add refresh method to be called from parent component
  const refreshAvailability = () => {
    fetchAvailability(true);
  };

  const getCabinStatusInfo = (cabin: any) => {
    const cabinAvailability = availability[cabin.id];
    if (!cabinAvailability) {
      return {
        status: 'Available',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-300',
        textColor: 'text-green-800',
        isAvailable: true
      };
    }

    switch (cabinAvailability.status) {
      case 'occupied':
        return {
          status: 'Occupied',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-300',
          textColor: 'text-red-800',
          isAvailable: false
        };
      case 'maintenance':
        return {
          status: 'Maintenance',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-300',
          textColor: 'text-yellow-800',
          isAvailable: false
        };
      default:
        return {
          status: 'Available',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300',
          textColor: 'text-green-800',
          isAvailable: true
        };
    }
  };

  const totalCabins = layout.cabins.length;
  const occupiedCabins = Object.values(availability).filter(a => a.status === 'occupied').length;
  const availableCabins = totalCabins - occupiedCabins;

  // Calculate booking details with auto end date (1 month from start)
  const calculateBookingDetails = () => {
    if (!startDate || !selectedCabinId) return null;

    const selectedCabin = layout.cabins.find(c => c.id === selectedCabinId);
    if (!selectedCabin) return null;

    // Get the actual database cabin data for deposit info
    const dbCabinId = cabinIdMapping[selectedCabinId];
    const dbCabin = cabins.find(c => c.id === dbCabinId);

    const endDate = addMonths(startDate, 1);
    const days = differenceInDays(endDate, startDate) + 1;
    const months = 1; // Always 1 month
    const monthlyPrice = selectedCabin.monthly_price || 0;
    const depositAmount = dbCabin?.refundable_deposit || 0;
    const bookingAmount = monthlyPrice; // 1 month * monthly price
    const subtotal = bookingAmount + depositAmount;

    // Calculate discounts (apply only to booking amount, not deposit)
    const couponDiscount = appliedCoupon?.discount || 0;
    const rewardsDiscount = appliedRewards?.discount || 0;
    const totalDiscount = couponDiscount + rewardsDiscount;
    const discountedBookingAmount = Math.max(0, bookingAmount - totalDiscount);
    const finalAmount = discountedBookingAmount + depositAmount;

    return { 
      days, 
      months, 
      monthlyPrice,
      depositAmount,
      bookingAmount, 
      subtotal,
      couponDiscount,
      rewardsDiscount,
      totalDiscount,
      discountedBookingAmount,
      finalAmount, 
      cabinName: selectedCabin.name,
      endDate
    };
  };

  const bookingDetails = calculateBookingDetails();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            {privateHallName}
          </h3>
          <p className="text-sm text-muted-foreground">
            Select your preferred cabin from the layout below
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600">
            {availableCabins} Available
          </Badge>
          <Badge variant="outline" className="text-red-600">
            {occupiedCabins} Occupied
          </Badge>
        </div>
      </div>

      {/* Clean Cabin Layout */}
      <Card className="p-6 bg-white">
        <div className="relative overflow-auto" style={{ height: '400px' }}>
          <div 
            className="relative bg-gray-50 rounded-lg border-2 border-dashed border-gray-200" 
            style={{
              width: Math.max(600, layout.layout.width),
              height: Math.max(300, layout.layout.height),
              minWidth: '100%'
            }}
          >
            {layout.cabins.map(cabin => {
              const statusInfo = getCabinStatusInfo(cabin);
              const isSelected = selectedCabinId === cabin.id;
              
              return (
                <div 
                  key={cabin.id} 
                  className={`absolute border-2 rounded-lg text-xs flex flex-col justify-center items-center transition-all duration-200 ${
                    statusInfo.isAvailable 
                      ? 'cursor-pointer hover:shadow-lg hover:scale-105 hover:ring-2 hover:ring-blue-400' 
                      : 'cursor-not-allowed opacity-60'
                  } ${
                    isSelected 
                      ? 'ring-2 ring-blue-500 shadow-lg scale-105' 
                      : ''
                  } ${statusInfo.bgColor} ${statusInfo.borderColor}`} 
                  style={{
                    left: cabin.x,
                    top: cabin.y,
                    width: Math.max(cabin.width, 80),
                    height: Math.max(cabin.height, 60)
                  }} 
                  onClick={() => {
                    if (statusInfo.isAvailable && onCabinSelect) {
                      onCabinSelect(cabin.id);
                    }
                  }}
                >
                  <div className="font-bold text-sm">{cabin.name}</div>
                  <div className={`text-[10px] font-medium ${statusInfo.textColor}`}>
                    {statusInfo.status}
                  </div>
                  <div className="text-[10px] text-gray-700 font-medium">
                    ₹{cabin.monthly_price}/mo
                  </div>
                </div>
              );
            })}
            
            {/* Legend */}
            <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md border">
              <h4 className="text-xs font-semibold mb-2">Status</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                  <span>Occupied</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Date Selection - Start Date Only */}
      <Card className="p-4">
        <Label className="text-base font-semibold mb-3 block">Select Booking Start Date</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Booking duration is automatically set to 1 month from your start date
        </p>
        <div className="max-w-sm">
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
                onSelect={onStartDateChange}
                disabled={(date) => date < new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {startDate && (
            <p className="text-sm text-muted-foreground mt-2">
              End date: {format(addMonths(startDate, 1), 'PPP')} (1 month later)
            </p>
          )}
        </div>
      </Card>

      {/* Coupon and Rewards Section */}
      {bookingDetails && (
        <div className="space-y-4">
          {onCouponApplied && onCouponRemoved && (
            <CouponInput
              bookingAmount={bookingDetails.bookingAmount}
              studyHallId={privateHallId}
              onCouponApplied={onCouponApplied}
              onCouponRemoved={onCouponRemoved}
              appliedCoupon={appliedCoupon}
            />
          )}
          
          {onRewardsApplied && onRewardsRemoved && (
            <RewardsInput
              bookingAmount={bookingDetails.bookingAmount}
              onRewardsApplied={onRewardsApplied}
              onRewardsRemoved={onRewardsRemoved}
              appliedRewards={appliedRewards}
            />
          )}
        </div>
      )}

      {/* Booking Summary */}
      {bookingDetails && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <Label className="text-base font-semibold text-blue-800">Booking Summary</Label>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cabin:</span>
              <span className="font-medium">{bookingDetails.cabinName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">1 Month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Period:</span>
              <span className="font-medium">{format(startDate!, 'MMM dd')} - {format(bookingDetails.endDate, 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Price:</span>
              <span className="font-medium">₹{bookingDetails.monthlyPrice.toLocaleString()}</span>
            </div>
            {bookingDetails.depositAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Refundable Deposit:</span>
                <span className="font-medium">₹{bookingDetails.depositAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">₹{bookingDetails.subtotal.toLocaleString()}</span>
            </div>
            {bookingDetails.couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Coupon Discount:</span>
                <span>-₹{bookingDetails.couponDiscount.toLocaleString()}</span>
              </div>
            )}
            {bookingDetails.rewardsDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Rewards Discount:</span>
                <span>-₹{bookingDetails.rewardsDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base border-t border-blue-200 pt-2 text-blue-800">
              <span>Final Amount:</span>
              <span>₹{bookingDetails.finalAmount.toLocaleString()}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">
            <Heart className="h-4 w-4 mr-2" />
            Add to Favorites
          </Button>
          <Button variant="ghost" size="sm" onClick={() => fetchAvailability(true)} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          {selectedCabinId && (
            <Badge variant="default" className="bg-blue-100 text-blue-800">
              Selected: {layout.cabins.find(c => c.id === selectedCabinId)?.name}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            onClick={onBookNow}
            disabled={!selectedCabinId || !startDate}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
};