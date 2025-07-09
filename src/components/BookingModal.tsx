import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";

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
  const { createBooking } = useBookings();
  const [selectedSeat, setSelectedSeat] = useState<string>("");
  const [bookingPeriod, setBookingPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const availableSeats = seats.filter(seat => seat.is_available);

  useEffect(() => {
    if (open && studyHall) {
      setSelectedSeat("");
      setBookingPeriod("daily");
      
      // Set default dates
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setStartDate(today.toISOString().split('T')[0]);
      
      if (bookingPeriod === "daily") {
        setEndDate(today.toISOString().split('T')[0]);
      } else if (bookingPeriod === "weekly") {
        const weekLater = new Date(today);
        weekLater.setDate(weekLater.getDate() + 7);
        setEndDate(weekLater.toISOString().split('T')[0]);
      } else if (bookingPeriod === "monthly") {
        const monthLater = new Date(today);
        monthLater.setMonth(monthLater.getMonth() + 1);
        setEndDate(monthLater.toISOString().split('T')[0]);
      }
    }
  }, [open, studyHall, bookingPeriod]);

  const calculateAmount = () => {
    if (!studyHall) return 0;
    
    switch (bookingPeriod) {
      case "daily":
        return studyHall.daily_price;
      case "weekly":
        return studyHall.weekly_price;
      case "monthly":
        return studyHall.monthly_price;
      default:
        return 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studyHall || !selectedSeat || !startDate || !endDate) {
      return;
    }

    setLoading(true);
    
    const success = await createBooking({
      study_hall_id: studyHall.id,
      seat_id: selectedSeat,
      booking_period: bookingPeriod,
      start_date: startDate,
      end_date: endDate,
      total_amount: calculateAmount(),
    });

    if (success) {
      onOpenChange(false);
      onSuccess?.();
    }
    
    setLoading(false);
  };

  if (!studyHall) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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

          <div className="space-y-2">
            <Label>Select Seat</Label>
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
                      <div className="grid grid-cols-6 gap-2">
                        {(rowSeats as Seat[]).sort((a, b) => a.seat_number - b.seat_number).map((seat) => (
                          <button
                            key={seat.id}
                            type="button"
                            onClick={() => setSelectedSeat(seat.id)}
                            className={`
                              w-8 h-8 rounded text-xs font-medium border-2 transition-all
                              ${selectedSeat === seat.id
                                ? 'border-primary bg-primary text-primary-foreground'
                                : seat.is_available
                                ? 'border-green-300 bg-green-50 text-green-700 hover:border-green-400 hover:bg-green-100'
                                : 'border-red-300 bg-red-50 text-red-700 cursor-not-allowed'
                              }
                            `}
                            disabled={!seat.is_available}
                            title={`Seat ${seat.seat_id} - ${seat.is_available ? 'Available' : 'Occupied'}`}
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
                  No seats available
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
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
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount:</span>
                <span className="text-lg font-bold">₹{calculateAmount().toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedSeat} className="flex-1">
              {loading ? "Booking..." : "Book Now"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}