import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Heart, MapPin, CalendarIcon, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { CabinLayoutData } from '@/types/PrivateHall';

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
  endDate?: Date;
  onStartDateChange?: (date: Date | undefined) => void;
  onEndDateChange?: (date: Date | undefined) => void;
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
  endDate,
  onStartDateChange,
  onEndDateChange
}) => {
  const [availability, setAvailability] = useState<CabinAvailability>({});
  const [loading, setLoading] = useState(false);
  const [cabinIdMapping, setCabinIdMapping] = useState<{[layoutId: string]: string}>({});

  // Create a mapping between layout cabin IDs and database cabin UUIDs
  const createCabinIdMapping = async () => {
    try {
      const mapping: {[layoutId: string]: string} = {};
      
      for (const layoutCabin of layout.cabins) {
        const { data: dbCabinId, error } = await supabase.rpc('get_cabin_id_mapping', {
          p_private_hall_id: privateHallId,
          p_layout_cabin_id: layoutCabin.id
        });
        
        if (!error && dbCabinId) {
          mapping[layoutCabin.id] = dbCabinId;
        }
      }
      
      setCabinIdMapping(mapping);
    } catch (error) {
      console.error('Error creating cabin ID mapping:', error);
    }
  };

  // Fetch real-time availability data using database cabin IDs
  const fetchAvailability = async () => {
    try {
      setLoading(true);

      // Create cabin ID mapping first
      await createCabinIdMapping();

      // Fetch cabins and bookings separately to avoid JOIN issues
      const { data: cabins, error: cabinsError } = await supabase
        .from('cabins')
        .select('*')
        .eq('private_hall_id', privateHallId);

      if (cabinsError) {
        console.error('Error fetching cabins:', cabinsError);
        return;
      }

      // Fetch bookings separately
      const cabinIds = cabins?.map(cabin => cabin.id) || [];
      let bookings: any[] = [];
      
      if (cabinIds.length > 0) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('cabin_bookings')
          .select('*')
          .in('cabin_id', cabinIds)
          .in('status', ['active', 'pending'])
          .eq('payment_status', 'paid');

        if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError);
        } else {
          bookings = bookingsData || [];
        }
      }

      const availabilityMap: CabinAvailability = {};
      
      // Map database cabin availability back to layout cabin IDs
      cabins?.forEach(dbCabin => {
        const activeBookings = bookings.filter(booking => 
          booking.cabin_id === dbCabin.id && 
          booking.status === 'active' && 
          booking.payment_status === 'paid'
        );
        
        // Find the layout cabin ID that corresponds to this database cabin
        const layoutCabinId = Object.keys(cabinIdMapping).find(
          layoutId => cabinIdMapping[layoutId] === dbCabin.id
        );
        
        if (layoutCabinId) {
          availabilityMap[layoutCabinId] = {
            status: activeBookings.length > 0 ? 'occupied' : 'available',
            bookings: activeBookings.length
          };
        }
      });

      setAvailability(availabilityMap);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();

    // Set up real-time subscription
    const channel = supabase
      .channel('cabin-bookings-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cabin_bookings',
        filter: `private_hall_id=eq.${privateHallId}`
      }, () => {
        fetchAvailability();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [privateHallId]);

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

  // Calculate booking details
  const calculateBookingDetails = () => {
    if (!startDate || !endDate || !selectedCabinId) return null;

    const selectedCabin = layout.cabins.find(c => c.id === selectedCabinId);
    if (!selectedCabin) return null;

    const days = differenceInDays(endDate, startDate) + 1;
    const months = Math.ceil(days / 30);
    const monthlyPrice = selectedCabin.monthly_price || 0;
    const totalAmount = months * monthlyPrice;

    return { 
      days, 
      months, 
      monthlyPrice, 
      totalAmount, 
      cabinName: selectedCabin.name 
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

      {/* Date Selection */}
      <Card className="p-4">
        <Label className="text-base font-semibold mb-3 block">Select Booking Dates</Label>
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
                  onSelect={onStartDateChange}
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
                  onSelect={onEndDateChange}
                  disabled={(date) => date < (startDate || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </Card>

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
              <span className="font-medium">{bookingDetails.days} days ({bookingDetails.months} month(s))</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Rate:</span>
              <span className="font-medium">₹{bookingDetails.monthlyPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t border-blue-200 pt-2 text-blue-800">
              <span>Total Amount:</span>
              <span>₹{bookingDetails.totalAmount.toLocaleString()}</span>
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
            disabled={!selectedCabinId || !startDate || !endDate}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
};