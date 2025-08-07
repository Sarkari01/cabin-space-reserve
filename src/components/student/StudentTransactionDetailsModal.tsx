import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, DollarSign, CreditCard, Building, Hash, MapPin, Home } from "lucide-react";
import { safeFormatDate } from "@/lib/dateUtils";
import { Transaction } from "@/hooks/useTransactions";

interface StudentTransactionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

export function StudentTransactionDetailsModal({ 
  open, 
  onOpenChange, 
  transaction 
}: StudentTransactionDetailsModalProps) {
  if (!transaction) return null;

  const formatDate = (dateString: string, format = 'MMM d, yyyy') => {
    return safeFormatDate(dateString, format, 'Invalid Date');
  };

  const formatTime = (dateString: string) => {
    return safeFormatDate(dateString, 'MMM d, yyyy \'at\' h:mm a', 'Invalid Date');
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'razorpay':
        return 'bg-blue-100 text-blue-800';
      case 'ekqr':
        return 'bg-purple-100 text-purple-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const hasDepositBreakdown = transaction.booking_amount && transaction.deposit_amount && Number(transaction.deposit_amount) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transaction Details
          </DialogTitle>
          <DialogDescription>
            Transaction #{transaction.transaction_number ? `T${transaction.transaction_number}` : 'Processing'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Transaction Info */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Payment Details</p>
                    <div className="space-y-2">
                      <p className="font-medium text-lg">Total Paid: ₹{Number(transaction.amount).toLocaleString()}</p>
                      
                      {/* Deposit Breakdown */}
                      {hasDepositBreakdown && (
                        <div className="bg-muted/30 p-3 rounded-lg space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Booking Amount:</span>
                            <span className="font-medium">₹{Number(transaction.booking_amount).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Refundable Deposit:</span>
                            <span className="font-medium text-blue-600">₹{Number(transaction.deposit_amount).toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            💡 Your deposit will be refunded when your booking period ends
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMethodColor(transaction.payment_method)}`}>
                        {transaction.payment_method.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <Badge variant={getStatusVariant(transaction.status)} className="h-6">
                    {transaction.status.toUpperCase()}
                  </Badge>
                </div>

                {transaction.payment_id && (
                  <div className="text-xs text-muted-foreground">
                    Payment ID: {transaction.payment_id}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Booking Information */}
          {(transaction.booking || transaction.private_hall) && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Booking Details
                </h4>
                <div className="space-y-3">
                  {transaction.booking_type === 'study_hall' && transaction.booking?.study_hall && (
                    <>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{transaction.booking.study_hall.name}</p>
                          {(transaction.booking.study_hall as any).location && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {(transaction.booking.study_hall as any).location}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {transaction.booking.seat && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Seat: </span>
                          <span className="font-medium">{transaction.booking.seat.seat_id}</span>
                        </div>
                      )}
                      
                      {transaction.booking.booking_number && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Booking #</span>
                          <span className="font-medium">B{transaction.booking.booking_number}</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {transaction.booking_type === 'cabin' && transaction.private_hall && (
                    <>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{transaction.private_hall.name}</p>
                          {(transaction.private_hall as any).location && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {(transaction.private_hall as any).location}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {transaction.cabin && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Cabin: </span>
                          <span className="font-medium">{transaction.cabin.cabin_name}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Transaction Timeline
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Paid on</p>
                  <p className="font-medium">{formatTime(transaction.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatTime(transaction.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}