import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, DollarSign, CreditCard, User, Building, Hash } from "lucide-react";
import { safeFormatDate } from "@/lib/dateUtils";
import { Transaction } from "@/hooks/useTransactions";

interface AdminTransactionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

export function AdminTransactionDetailsModal({ 
  open, 
  onOpenChange, 
  transaction 
}: AdminTransactionDetailsModalProps) {
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Transaction ID</p>
                      <p className="font-medium font-mono">{transaction.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Breakdown</p>
                      <div className="space-y-1">
                        <p className="font-medium">Total: ₹{Number(transaction.amount).toLocaleString()}</p>
                        {transaction.booking_amount && transaction.deposit_amount && Number(transaction.deposit_amount) > 0 && (
                          <div className="text-sm space-y-0.5">
                            <p className="text-muted-foreground">
                              Booking: ₹{Number(transaction.booking_amount).toLocaleString()}
                            </p>
                            <p className="text-muted-foreground">
                              Refundable Deposit: ₹{Number(transaction.deposit_amount).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMethodColor(transaction.payment_method)}`}>
                        {transaction.payment_method.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusVariant(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </div>

                  {transaction.payment_id && (
                    <div>
                      <p className="text-sm text-muted-foreground">Payment ID</p>
                      <p className="font-medium font-mono text-sm">{transaction.payment_id}</p>
                    </div>
                  )}

                  {transaction.qr_id && (
                    <div>
                      <p className="text-sm text-muted-foreground">QR ID</p>
                      <p className="font-medium font-mono text-sm">{transaction.qr_id}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          {transaction.user && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Customer Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{transaction.user.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{transaction.user.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Booking Information */}
          {(transaction.booking || transaction.private_hall) && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Booking Information
                </h4>
                <div className="space-y-2">
                  {transaction.booking_type === 'study_hall' && transaction.booking?.study_hall && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Study Hall</p>
                        <p className="font-medium">{transaction.booking.study_hall.name}</p>
                      </div>
                      {transaction.booking.seat && (
                        <div>
                          <p className="text-sm text-muted-foreground">Seat</p>
                          <p className="font-medium">{transaction.booking.seat.seat_id}</p>
                        </div>
                      )}
                      {transaction.booking.booking_number && (
                        <div>
                          <p className="text-sm text-muted-foreground">Booking Number</p>
                          <p className="font-medium">B{transaction.booking.booking_number}</p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {transaction.booking_type === 'cabin' && transaction.private_hall && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Private Hall</p>
                        <p className="font-medium">{transaction.private_hall.name}</p>
                      </div>
                      {transaction.cabin && (
                        <div>
                          <p className="text-sm text-muted-foreground">Cabin</p>
                          <p className="font-medium">{transaction.cabin.cabin_name}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Data */}
          {transaction.payment_data && Object.keys(transaction.payment_data).length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Payment Data</h4>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                  {JSON.stringify(transaction.payment_data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Timeline
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p>{formatTime(transaction.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p>{formatTime(transaction.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}