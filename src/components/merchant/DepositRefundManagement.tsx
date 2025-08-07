import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle, Clock, XCircle, DollarSign, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { depositStatusColors } from '@/utils/cabinBookingUtils';

interface DepositRefund {
  id: string;
  cabin_booking_id: string;
  user_id: string;
  merchant_id: string;
  refund_amount: number;
  refund_status: string;
  refund_reason?: string;
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  payment_reference?: string;
  notes?: string;
  booking_details?: {
    cabin_name: string;
    start_date: string;
    end_date: string;
    user_name: string;
    user_email: string;
  };
}

export const DepositRefundManagement: React.FC = () => {
  const [refunds, setRefunds] = useState<DepositRefund[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState<DepositRefund | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [notes, setNotes] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchDepositRefunds();
  }, []);

  const fetchDepositRefunds = async () => {
    try {
      setLoading(true);

      // First get the deposit refunds
      const { data: refundsData, error: refundsError } = await supabase
        .from('deposit_refunds')
        .select('*')
        .order('requested_at', { ascending: false });

      if (refundsError) {
        console.error('Error fetching deposit refunds:', refundsError);
        toast({
          title: "Error",
          description: "Failed to load deposit refunds.",
          variant: "destructive",
        });
        return;
      }

      if (!refundsData || refundsData.length === 0) {
        setRefunds([]);
        return;
      }

      // Get cabin booking IDs
      const bookingIds = refundsData.map(r => r.cabin_booking_id);
      
      // Fetch cabin booking details separately to avoid complex joins
      const bookingDetailsPromises = refundsData.map(async (refund) => {
        try {
          // Get cabin booking
          const { data: booking } = await supabase
            .from('cabin_bookings')
            .select('id, start_date, end_date, user_id, cabin_id')
            .eq('id', refund.cabin_booking_id)
            .single();

          if (!booking) return { ...refund, booking_details: null };

          // Get cabin details
          const { data: cabin } = await supabase
            .from('cabins')
            .select('cabin_name')
            .eq('id', booking.cabin_id)
            .single();

          // Get user details if user_id exists
          let userEmail = 'Guest User';
          if (booking.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', booking.user_id)
              .single();
            userEmail = profile?.email || 'Unknown User';
          }

          return {
            ...refund,
            booking_details: {
              cabin_name: cabin?.cabin_name || 'Unknown Cabin',
              start_date: booking.start_date || '',
              end_date: booking.end_date || '',
              user_name: 'User',
              user_email: userEmail
            }
          };
        } catch (error) {
          console.error('Error fetching booking details for refund:', refund.id, error);
          return {
            ...refund,
            booking_details: {
              cabin_name: 'Unknown Cabin',
              start_date: '',
              end_date: '',
              user_name: 'User',
              user_email: 'Unknown Email'
            }
          };
        }
      });

      const transformedRefunds = await Promise.all(bookingDetailsPromises);

      setRefunds(transformedRefunds);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load deposit refunds.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRefundStatus = async (refundId: string, status: string, paymentReference?: string, merchantNotes?: string) => {
    try {
      setProcessing(true);

      const updateData: any = {
        refund_status: status,
        processed_at: new Date().toISOString(),
        processed_by: user?.id,
        notes: merchantNotes || notes
      };

      if (paymentReference) {
        updateData.payment_reference = paymentReference;
      }

      const { error } = await supabase
        .from('deposit_refunds')
        .update(updateData)
        .eq('id', refundId);

      if (error) {
        console.error('Error updating refund status:', error);
        toast({
          title: "Error",
          description: "Failed to update refund status.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Refund ${status === 'completed' ? 'processed' : status} successfully.`,
      });

      // Refresh data
      await fetchDepositRefunds();
      setSelectedRefund(null);
      setPaymentRef('');
      setNotes('');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to update refund status.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <AlertTriangle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Deposit Refund Management</h2>
          <p className="text-muted-foreground">
            Manage refund requests for cabin booking deposits
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => fetchDepositRefunds()}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xl font-bold">
                {refunds.filter(r => r.refund_status === 'pending').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Processing</p>
              <p className="text-xl font-bold">
                {refunds.filter(r => r.refund_status === 'processing').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-xl font-bold">
                {refunds.filter(r => r.refund_status === 'completed').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-xl font-bold">
                ₹{refunds.filter(r => r.refund_status !== 'rejected')
                  .reduce((sum, r) => sum + r.refund_amount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Refunds Table */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Refund Requests</h3>
          
          {refunds.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No deposit refund requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cabin & User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refunds.map(refund => (
                    <TableRow key={refund.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{refund.booking_details?.cabin_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {refund.booking_details?.user_email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {refund.booking_details?.start_date && refund.booking_details?.end_date && 
                              `${format(new Date(refund.booking_details.start_date), 'MMM dd')} - ${format(new Date(refund.booking_details.end_date), 'MMM dd, yyyy')}`
                            }
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">₹{refund.refund_amount.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={depositStatusColors[refund.refund_status as keyof typeof depositStatusColors] || depositStatusColors.pending}
                        >
                          <div className="flex items-center gap-1">
                            {getStatusIcon(refund.refund_status)}
                            {refund.refund_status.charAt(0).toUpperCase() + refund.refund_status.slice(1)}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(refund.requested_at), 'MMM dd, yyyy')}
                          <br />
                          <span className="text-muted-foreground">
                            {format(new Date(refund.requested_at), 'HH:mm')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {refund.refund_reason || 'No reason provided'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedRefund(refund)}
                            >
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Manage Refund Request</DialogTitle>
                              <DialogDescription>
                                Process refund for {selectedRefund?.booking_details?.cabin_name}
                              </DialogDescription>
                            </DialogHeader>

                            {selectedRefund && (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Refund Amount</Label>
                                  <p className="text-2xl font-bold text-green-600">
                                    ₹{selectedRefund.refund_amount.toLocaleString()}
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <Label>Current Status</Label>
                                  <Badge className={depositStatusColors[selectedRefund.refund_status as keyof typeof depositStatusColors] || depositStatusColors.pending}>
                                    {selectedRefund.refund_status.charAt(0).toUpperCase() + selectedRefund.refund_status.slice(1)}
                                  </Badge>
                                </div>

                                {selectedRefund.refund_reason && (
                                  <div className="space-y-2">
                                    <Label>Reason</Label>
                                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded">
                                      {selectedRefund.refund_reason}
                                    </p>
                                  </div>
                                )}

                                {selectedRefund.refund_status === 'pending' && (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="notes">Notes (Optional)</Label>
                                      <Textarea 
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Add any notes about this refund..."
                                      />
                                    </div>

                                    <div className="flex gap-2">
                                      <Button 
                                        onClick={() => updateRefundStatus(selectedRefund.id, 'processing')}
                                        disabled={processing}
                                        variant="outline"
                                        className="flex-1"
                                      >
                                        Mark as Processing
                                      </Button>
                                      <Button 
                                        onClick={() => updateRefundStatus(selectedRefund.id, 'rejected')}
                                        disabled={processing}
                                        variant="destructive"
                                        className="flex-1"
                                      >
                                        Reject
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {selectedRefund.refund_status === 'processing' && (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="payment-ref">Payment Reference</Label>
                                      <Input 
                                        id="payment-ref"
                                        value={paymentRef}
                                        onChange={(e) => setPaymentRef(e.target.value)}
                                        placeholder="Enter payment reference number"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="completion-notes">Completion Notes</Label>
                                      <Textarea 
                                        id="completion-notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Add notes about the completed refund..."
                                      />
                                    </div>

                                    <Button 
                                      onClick={() => updateRefundStatus(selectedRefund.id, 'completed', paymentRef)}
                                      disabled={processing || !paymentRef.trim()}
                                      className="w-full"
                                    >
                                      {processing ? 'Processing...' : 'Mark as Completed'}
                                    </Button>
                                  </div>
                                )}

                                {selectedRefund.refund_status === 'completed' && (
                                  <div className="space-y-2">
                                    <p className="text-sm text-green-600">
                                      ✓ Refund processed successfully
                                    </p>
                                    {selectedRefund.payment_reference && (
                                      <p className="text-sm text-muted-foreground">
                                        Payment Ref: {selectedRefund.payment_reference}
                                      </p>
                                    )}
                                    {selectedRefund.processed_at && (
                                      <p className="text-sm text-muted-foreground">
                                        Processed: {format(new Date(selectedRefund.processed_at), 'MMM dd, yyyy HH:mm')}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};