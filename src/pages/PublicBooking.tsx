import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar, Users, Wifi, Snowflake, Car, Coffee, Printer, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GuestBookingModal } from "@/components/GuestBookingModal";
import { PublicSeatLayout } from "@/components/PublicSeatLayout";
import { useToast } from "@/hooks/use-toast";

interface StudyHallDetails {
  id: string;
  name: string;
  description: string;
  location: string;
  formatted_address?: string;
  monthly_price: number;
  amenities: string[];
  image_url?: string;
  total_seats: number;
  rows: number;
  seats_per_row: number;
  custom_row_names: string[];
  layout_mode?: string;
  row_seat_config?: any;
  daily_price?: number; // For backward compatibility
  weekly_price?: number; // For backward compatibility
}

interface Seat {
  id: string;
  seat_id: string;
  row_name: string;
  seat_number: number;
  is_available: boolean;
}

const amenityIcons = {
  'Wi-Fi': Wifi,
  'AC': Snowflake,
  'Parking': Car,
  'Cafeteria': Coffee,
  'Printer': Printer,
  'Computer': Monitor,
};

export default function PublicBooking() {
  const { studyHallId } = useParams<{ studyHallId: string }>();
  const { toast } = useToast();
  
  console.log('PublicBooking - studyHallId from params:', studyHallId);
  
  const [studyHall, setStudyHall] = useState<StudyHallDetails | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [availableSeats, setAvailableSeats] = useState(0);

  useEffect(() => {
    if (studyHallId) {
      fetchStudyHallData();
    }
  }, [studyHallId]);

  const fetchStudyHallData = async () => {
    if (!studyHallId) {
      toast({
        title: "Error",
        description: "Study hall ID is required",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(studyHallId)) {
      toast({
        title: "Error",
        description: "Invalid study hall ID format",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      console.log('Fetching data for study hall:', studyHallId);
      
      // Try edge function first, fallback to direct query if needed
      let response;
      try {
        response = await supabase.functions.invoke('public-booking', {
          body: { studyHallId }
        });
        
        console.log('Function response:', response);
        
        if (response.error) {
          console.error('Function error:', response.error);
          throw response.error;
        }

        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Failed to load study hall data');
        }
      } catch (edgeFunctionError) {
        console.warn('Edge function failed, trying direct database query:', edgeFunctionError);
        
        // Fallback to direct database queries
        const { data: hallData, error: hallError } = await supabase
          .from('study_halls')
          .select(`
            id, name, description, location, formatted_address,
            monthly_price, amenities,
            image_url, total_seats, rows, seats_per_row,
            custom_row_names, layout_mode, row_seat_config,
            qr_booking_enabled, status
          `)
          .eq('id', studyHallId)
          .eq('status', 'active')
          .single();

        if (hallError || !hallData) {
          throw new Error('Study hall not found or not available for booking');
        }

        if (!hallData.qr_booking_enabled) {
          throw new Error('QR booking is disabled for this study hall');
        }

        const { data: seatsData, error: seatsError } = await supabase
          .from('seats')
          .select('*')
          .eq('study_hall_id', studyHallId)
          .order('row_name')
          .order('seat_number');

        if (seatsError) {
          throw new Error('Failed to fetch seat information');
        }

        const availableSeatsCount = seatsData?.filter(seat => seat.is_available).length || 0;
        
        response = {
          data: {
            success: true,
            studyHall: hallData,
            seats: seatsData || [],
            availableSeats: availableSeatsCount
          }
        };
      }

      const { studyHall: hallData, seats: seatsData, availableSeats: available } = response.data;
      
      setStudyHall(hallData);
      setSeats(seatsData);
      setAvailableSeats(available);
    } catch (error: any) {
      console.error('Error fetching study hall data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load study hall information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeatSelect = (seat: Seat) => {
    if (!seat.is_available) {
      toast({
        title: "Seat Unavailable",
        description: "This seat is already booked. Please select another seat.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedSeat(seat);
    setBookingModalOpen(true);
  };

  const handleBookingSuccess = () => {
    setBookingModalOpen(false);
    setSelectedSeat(null);
    fetchStudyHallData(); // Refresh data
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!studyHall) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-destructive">Study Hall Not Found</h2>
              <p className="text-muted-foreground">
                The study hall you're looking for doesn't exist or QR booking is disabled.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-primary">{studyHall.name}</h1>
            <div className="flex items-center justify-center text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">{studyHall.formatted_address || studyHall.location}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Study Hall Info */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Image */}
          {studyHall.image_url && (
            <div className="md:col-span-1">
              <img
                src={studyHall.image_url}
                alt={studyHall.name}
                className="w-full h-64 object-cover rounded-lg shadow-lg"
              />
            </div>
          )}
          
          {/* Details */}
          <Card className={studyHall.image_url ? "md:col-span-2" : "md:col-span-3"}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Study Hall Details</span>
                <Badge variant="secondary" className="text-sm">
                  {availableSeats}/{studyHall.total_seats} Available
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {studyHall.description && (
                <p className="text-muted-foreground">{studyHall.description}</p>
              )}
              
              {/* Pricing */}
              <div className="grid grid-cols-1 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Monthly Rate</p>
                  <p className="text-lg font-bold">₹{studyHall.monthly_price}</p>
                </div>
              </div>

              {/* Amenities */}
              {studyHall.amenities && studyHall.amenities.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {studyHall.amenities.map((amenity) => {
                      const IconComponent = amenityIcons[amenity as keyof typeof amenityIcons];
                      return (
                        <Badge key={amenity} variant="outline" className="gap-1">
                          {IconComponent && <IconComponent className="h-3 w-3" />}
                          {amenity}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Seat Layout */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Your Seat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PublicSeatLayout
              studyHall={studyHall}
              seats={seats}
              onSeatSelect={handleSeatSelect}
            />
            
            {/* Legend */}
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-emerald-100 border-2 border-emerald-500"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-red-100 border-2 border-red-500"></div>
                <span>Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-blue-100 border-2 border-blue-500"></div>
                <span>Selected</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guest Booking Modal */}
      <GuestBookingModal
        isOpen={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setSelectedSeat(null);
        }}
        onSuccess={handleBookingSuccess}
        studyHall={studyHall}
        selectedSeat={selectedSeat}
      />
    </div>
  );
}