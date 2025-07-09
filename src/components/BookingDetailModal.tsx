import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Users, Clock, DollarSign, User, Building } from "lucide-react";
import { Booking } from "@/hooks/useBookings";

interface BookingDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  userRole: "student" | "merchant" | "admin";
  onConfirm?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => void;
  loading?: boolean;
}

export function BookingDetailModal({ 
  open, 
  onOpenChange, 
  booking, 
  userRole, 
  onConfirm, 
  onCancel, 
  loading = false 
}: BookingDetailModalProps) {
  if (!booking) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'completed':
        return 'outline';
      case 'refunded':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Booking Details</span>
            <Badge variant={getStatusColor(booking.status)}>
              {booking.status.toUpperCase()}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Booking ID: {booking.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Study Hall Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                {booking.study_hall?.image_url && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={booking.study_hall.image_url} 
                      alt={booking.study_hall?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{booking.study_hall?.name || 'Study Hall'}</h3>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {booking.study_hall?.location}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Seat Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seat ID:</span>
                    <span className="font-medium">{booking.seat?.seat_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Row:</span>
                    <span className="font-medium">{booking.seat?.row_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seat Number:</span>
                    <span className="font-medium">{booking.seat?.seat_number}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Booking Period
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium capitalize">{booking.booking_period}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Date:</span>
                    <span className="font-medium">{formatDate(booking.start_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End Date:</span>
                    <span className="font-medium">{formatDate(booking.end_date)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Information (for merchants and admins) */}
            {(userRole === 'merchant' || userRole === 'admin') && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Customer Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{booking.user?.full_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{booking.user?.email}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Payment Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-medium text-lg">₹{Number(booking.total_amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={getStatusColor(booking.status)} className="h-5">
                      {booking.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timestamps */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Booking Timeline
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">{formatDate(booking.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-medium">{formatDate(booking.updated_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            
            {userRole === 'merchant' && booking.status === 'pending' && onConfirm && (
              <Button 
                onClick={() => {
                  onConfirm(booking.id);
                  onOpenChange(false);
                }}
                disabled={loading}
              >
                {loading ? "Confirming..." : "Confirm Booking"}
              </Button>
            )}
            
            {userRole === 'student' && booking.status === 'pending' && onCancel && (
              <Button 
                variant="destructive"
                onClick={() => {
                  onCancel(booking.id);
                  onOpenChange(false);
                }}
                disabled={loading}
              >
                {loading ? "Cancelling..." : "Cancel Booking"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}