import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CabinVacateButton } from "@/components/CabinVacateButton";
import { Calendar, MapPin, DollarSign, User, Home, Clock, Building, Edit } from "lucide-react";
import { CabinBookingQRCode } from "./CabinBookingQRCode";
import { safeFormatDate } from "@/lib/dateUtils";

interface CabinBooking {
  id: string;
  booking_number: number;
  start_date: string;
  end_date: string;
  months_booked: number;
  monthly_amount: number;
  booking_amount?: number;
  deposit_amount?: number;
  total_amount: number;
  deposit_refunded?: boolean;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  is_vacated?: boolean;
  vacated_at?: string;
  vacated_by?: string;
  vacate_reason?: string;
  cabin?: {
    cabin_name: string;
    amenities?: string[];
  };
  private_hall?: {
    name: string;
    location: string;
  };
  user?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
}

interface CabinBookingDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: CabinBooking | null;
  userRole: "student" | "merchant" | "admin" | "incharge";
  onConfirm?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => void;
  onEdit?: (booking: CabinBooking) => void;
  loading?: boolean;
}

export function CabinBookingDetailModal({ 
  open, 
  onOpenChange, 
  booking, 
  userRole, 
  onConfirm, 
  onCancel, 
  onEdit,
  loading = false 
}: CabinBookingDetailModalProps) {
  if (!booking) return null;

  const formatDate = (dateString: string, format = 'MMM d, yyyy') => {
    return safeFormatDate(dateString, format, 'Invalid Date');
  };

  const formatTime = (dateString: string) => {
    return safeFormatDate(dateString, 'MMM d, yyyy \'at\' h:mm a', 'Invalid Date');
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPaymentStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'default';
      case 'unpaid':
        return 'destructive';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const customerName = booking.user?.full_name || booking.guest_name || 'N/A';
  const customerEmail = booking.user?.email || booking.guest_email || 'N/A';
  const customerPhone = booking.user?.phone || booking.guest_phone || 'N/A';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Cabin Booking Details
          </DialogTitle>
          <DialogDescription>
            Booking #{booking.booking_number ? `CB${booking.booking_number}` : 'Processing'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading booking details...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main Booking Info */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Private Hall</p>
                        <p className="font-medium">{booking.private_hall?.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Cabin</p>
                        <p className="font-medium">{booking.cabin?.cabin_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{booking.private_hall?.location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Booking Period</p>
                        <p className="font-medium">
                          {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          1 Month Duration
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Breakdown</p>
                        <div className="space-y-1">
                          <p className="font-medium">Total: ₹{Number(booking.total_amount).toLocaleString()}</p>
                          
                          {/* Always show deposit breakdown when available */}
                          {(booking.booking_amount || booking.deposit_amount) && (
                            <div className="bg-muted/30 p-2 rounded text-sm space-y-1">
                              {booking.booking_amount && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Booking Amount:</span>
                                  <span className="font-medium">₹{Number(booking.booking_amount).toLocaleString()}</span>
                                </div>
                              )}
                              
                              {booking.deposit_amount && Number(booking.deposit_amount) > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Refundable Deposit:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-blue-600">₹{Number(booking.deposit_amount).toLocaleString()}</span>
                                    {booking.deposit_refunded ? (
                                      <Badge variant="default" className="text-xs">Refunded</Badge>
                                    ) : (
                                      <Badge variant="secondary" className="text-xs">Held</Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {!booking.booking_amount && !booking.deposit_amount && (
                                <div className="text-xs text-muted-foreground">
                                  Monthly Rate: ₹{Number(booking.monthly_amount).toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    <div className="flex items-center space-x-2 gap-2">
                      <Badge variant={getStatusVariant(booking.status)}>
                        {booking.status}
                      </Badge>
                      <Badge variant={getPaymentStatusVariant(booking.payment_status)}>
                        {booking.payment_status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information (only for merchants/admins/incharges) */}
            {(userRole === 'merchant' || userRole === 'admin' || userRole === 'incharge') && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Customer Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{customerEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{customerPhone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Booking Type</p>
                      <p className="font-medium">
                        {booking.user_id ? 'Registered User' : 'Guest Booking'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Amenities */}
            {booking.cabin?.amenities && booking.cabin.amenities.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Cabin Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {booking.cabin.amenities.map((amenity, index) => (
                      <Badge key={index} variant="secondary">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* QR Code Ticket - Show for active/completed bookings */}
            {(booking.status === 'active' || booking.status === 'completed') && booking.payment_status === 'paid' && (
              <CabinBookingQRCode booking={booking} userRole={userRole} />
            )}

            {/* Timestamps */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Booking Timeline
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p>{formatTime(booking.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p>{formatTime(booking.updated_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vacation Status */}
            {booking.is_vacated && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3 flex items-center text-orange-600">
                    <Clock className="h-4 w-4 mr-2" />
                    Vacation Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Vacated On</p>
                      <p>{booking.vacated_at ? new Date(booking.vacated_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                        Vacated Early
                      </Badge>
                    </div>
                    {booking.vacate_reason && (
                      <div className="md:col-span-2">
                        <p className="text-muted-foreground">Reason</p>
                        <p className="whitespace-pre-wrap">{booking.vacate_reason}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {/* Vacate Button for Active/Pending Bookings */}
              {(booking.status === 'active' || booking.status === 'pending') && 
               booking.payment_status === 'paid' && 
               !booking.is_vacated && (
                <CabinVacateButton 
                  bookingId={booking.id}
                  onVacated={() => {
                    // Refresh or close modal
                    onOpenChange(false);
                  }}
                  variant="destructive"
                  size="sm"
                />
              )}
              
              {booking.status === 'pending' && userRole === 'merchant' && onConfirm && (
                <Button onClick={() => onConfirm(booking.id)} size="sm">
                  Confirm Booking
                </Button>
              )}
              
              {booking.status !== 'cancelled' && booking.status !== 'completed' && 
               (userRole === 'merchant' || userRole === 'admin') && onCancel && (
                <Button 
                  onClick={() => onCancel(booking.id)} 
                  variant="destructive" 
                  size="sm"
                >
                  Cancel Booking
                </Button>
              )}
              
              {(userRole === 'merchant' || userRole === 'admin') && onEdit && (
                <Button 
                  onClick={() => onEdit(booking)} 
                  variant="outline" 
                  size="sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}