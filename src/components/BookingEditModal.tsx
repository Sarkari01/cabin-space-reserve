import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Booking } from "@/hooks/useBookings";
import { CabinBooking } from "@/types/PrivateHall";
import { Calendar } from "lucide-react";
import { CabinVacateButton } from "@/components/CabinVacateButton";

interface BookingEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: (Booking | CabinBooking) | null;
  onSave: (bookingId: string, updates: Partial<Booking> | Partial<CabinBooking>) => Promise<boolean>;
  loading?: boolean;
}

export function BookingEditModal({ 
  open, 
  onOpenChange, 
  booking, 
  onSave, 
  loading = false 
}: BookingEditModalProps) {
  const [formData, setFormData] = useState<{ 
    start_date: string;
    end_date: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded' | 'active';
    booking_period: '1_month' | '2_months' | '3_months' | '6_months' | '12_months'
  }>({
    start_date: '',
    end_date: '',
    status: 'pending',
    booking_period: '1_month'
  });

  const isCabinBooking = (b: any): b is CabinBooking => !!b && ('cabin_id' in b || (b as any).booking_type === 'cabin' || (b as any).type === 'cabin');

  useEffect(() => {
    if (booking) {
      if (isCabinBooking(booking)) {
        setFormData(prev => ({
          ...prev,
          start_date: booking.start_date,
          end_date: booking.end_date,
          status: booking.status as any,
        }));
      } else {
        setFormData({
          start_date: booking.start_date,
          end_date: booking.end_date,
          status: booking.status as any,
          booking_period: booking.booking_period,
        });
      }
    }
  }, [booking]);

  const isCabin = booking ? isCabinBooking(booking) : false;

  const displayName = booking
    ? (isCabin
        ? (booking.guest_name || booking.guest_email || 'Guest')
        : ((booking as Booking).user?.full_name || (booking as Booking).user?.email || (booking as any).guest_name || (booking as any).guest_email || 'Guest')
      )
    : '';

  const displayPhone = booking
    ? (isCabin
        ? booking.guest_phone
        : ((booking as Booking).user?.phone || (booking as any).guest_phone)
      )
    : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    console.log("Submitting booking update:", {
      bookingId: booking.id,
      currentData: booking,
      formData: formData,
      changes: Object.keys(formData).reduce((acc, key) => {
        if (formData[key] !== booking[key]) {
          acc[key] = { from: booking[key], to: formData[key] };
        }
        return acc;
      }, {})
    });

    try {
      const updates: any = {
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: (isCabin && formData.status === 'confirmed') ? 'active' : formData.status,
      };
      if (!isCabin) {
        updates.booking_period = formData.booking_period;
      }

      const success = await onSave(booking.id, updates);
      if (success) {
        console.log("Booking update successful, closing modal");
        onOpenChange(false);
      } else {
        console.error("Booking update failed");
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Edit Booking</span>
          </DialogTitle>
          <DialogDescription>
            Update booking details for {displayName} {displayPhone ? `(${displayPhone})` : null}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isCabin && (
            <div className="space-y-2">
              <Label htmlFor="booking_period">Booking Period</Label>
              <Select 
                value={formData.booking_period} 
                onValueChange={(value: any) => 
                  setFormData(prev => ({ ...prev, booking_period: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_month">1 Month</SelectItem>
                  <SelectItem value="2_months">2 Months</SelectItem>
                  <SelectItem value="3_months">3 Months</SelectItem>
                  <SelectItem value="6_months">6 Months</SelectItem>
                  <SelectItem value="12_months">12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formatDateForInput(formData.start_date)}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formatDateForInput(formData.end_date)}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: any) => 
                setFormData(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {isCabin ? (
                  <>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            {isCabin && (booking as any).payment_status === 'paid' && (booking as any).is_vacated !== true && (booking.status === 'pending' || booking.status === 'active') && (
              <CabinVacateButton
                bookingId={booking.id}
                onVacated={() => onOpenChange(false)}
                variant="destructive"
              />
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}