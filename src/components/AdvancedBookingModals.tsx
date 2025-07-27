import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useBookings } from "@/hooks/useBookings";
import { Calendar, Clock, MapPin, Plus } from "lucide-react";
import { useValidatedForm, bookingSchema } from "@/components/FormValidation";
import { LoadingSpinner } from "@/components/ui/loading";

interface BookingModificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  onSuccess?: () => void;
}

export function BookingModificationModal({ 
  open, 
  onOpenChange, 
  booking, 
  onSuccess 
}: BookingModificationModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { updateBooking } = useBookings();

  const form = useValidatedForm(bookingSchema, {
    study_hall_id: booking?.study_hall_id || "",
    seat_id: booking?.seat_id || "",
    start_date: booking?.start_date || "",
    end_date: booking?.end_date || "",
    booking_period: booking?.booking_period || "daily",
  });

  const handleSubmit = async (data: any) => {
    if (!booking) return;
    
    setLoading(true);
    try {
      const success = await updateBooking(booking.id, {
        start_date: data.start_date,
        end_date: data.end_date,
        booking_period: data.booking_period,
      });

      if (success) {
        toast({
          title: "Success",
          description: "Booking updated successfully",
        });
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Modify Booking
          </DialogTitle>
          <DialogDescription>
            Update your booking dates and preferences
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Current Booking Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium">Current Booking</h4>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{booking.study_hall?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Seat {booking.seat?.row_name}{booking.seat?.seat_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{booking.start_date} to {booking.end_date}</span>
              </div>
            </div>
          </div>

          {/* New Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">New Start Date</Label>
              <Input
                id="start_date"
                type="date"
                {...form.register("start_date")}
                className="w-full"
              />
              {form.formState.errors.start_date && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.start_date.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end_date">New End Date</Label>
              <Input
                id="end_date"
                type="date"
                {...form.register("end_date")}
                className="w-full"
              />
              {form.formState.errors.end_date && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.end_date.message}
                </p>
              )}
            </div>
          </div>

          {/* Booking Period */}
          <div className="space-y-2">
            <Label>Booking Period</Label>
            <Select 
              value={form.watch("booking_period")} 
              onValueChange={(value) => form.setValue("booking_period", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Updating...
                </>
              ) : (
                "Update Booking"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studyHall: any;
  onSuccess?: () => void;
}

export function WaitlistModal({ 
  open, 
  onOpenChange, 
  studyHall, 
  onSuccess 
}: WaitlistModalProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !studyHall) return;
    
    setLoading(true);
    try {
      // TODO: Implement waitlist API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Added to Waitlist",
        description: "We'll notify you when a seat becomes available",
      });
      
      onOpenChange(false);
      onSuccess?.();
      setEmail("");
      setNotes("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to waitlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Join Waitlist
          </DialogTitle>
          <DialogDescription>
            Get notified when a seat becomes available at {studyHall?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Preferences (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific seat preferences or timing requirements..."
              rows={3}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={loading || !email}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Adding...
                </>
              ) : (
                "Join Waitlist"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}