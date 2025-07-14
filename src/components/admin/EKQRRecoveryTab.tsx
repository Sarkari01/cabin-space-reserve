import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, AlertCircle, CheckCircle, FileX } from "lucide-react";

const EKQRRecoveryTab = () => {
  const [loading, setLoading] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [recoveryResults, setRecoveryResults] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchPendingTransactions = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id, 
          amount, 
          created_at, 
          qr_id, 
          status,
          payment_data,
          user:profiles!transactions_user_id_fkey(full_name, email)
        `)
        .eq('payment_method', 'ekqr')
        .eq('status', 'pending')
        .is('booking_id', null)
        .not('payment_data', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPendingTransactions(data || []);
      console.log('Found pending EKQR transactions:', data?.length || 0);
    } catch (error) {
      console.error('Error fetching pending transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const recoverSingleTransaction = async (transactionId: string) => {
    try {
      console.log('🔧 Recovering transaction:', transactionId);
      
      const { data, error } = await supabase.functions.invoke('manual-ekqr-recovery', {
        body: {
          action: 'createBookingForTransaction',
          transactionId: transactionId
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Recovery Successful",
          description: `Booking ${data.bookingId} created for transaction`,
        });
        
        // Refresh the pending transactions list
        await fetchPendingTransactions();
        
        return { success: true, bookingId: data.bookingId };
      } else {
        throw new Error(data?.message || 'Recovery failed');
      }
    } catch (error) {
      console.error('❌ Recovery failed:', error);
      toast({
        title: "Recovery Failed",
        description: error.message || "Failed to recover transaction",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const recoverAllPending = async () => {
    try {
      setLoading(true);
      
      console.log('🔧 Starting bulk recovery for all pending EKQR transactions...');
      
      const { data, error } = await supabase.functions.invoke('manual-ekqr-recovery', {
        body: {
          action: 'recoverAllPendingEKQR'
        }
      });

      if (error) throw error;

      console.log('✅ Bulk recovery completed:', data);
      
      setRecoveryResults(data.results || []);
      
      toast({
        title: "Bulk Recovery Completed",
        description: `${data.message}`,
      });
      
      // Refresh the pending transactions list
      await fetchPendingTransactions();
      
    } catch (error) {
      console.error('❌ Bulk recovery failed:', error);
      toast({
        title: "Bulk Recovery Failed",
        description: error.message || "Failed to recover transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            <span>EKQR Payment Recovery</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Recover bookings for EKQR payments that were successful but didn't create bookings automatically.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-3">
            <Button 
              onClick={fetchPendingTransactions} 
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Check Pending Transactions
            </Button>
            
            {pendingTransactions.length > 0 && (
              <Button 
                onClick={recoverAllPending} 
                disabled={loading}
                className="bg-primary"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Recover All ({pendingTransactions.length})
              </Button>
            )}
          </div>
          
          {pendingTransactions.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <FileX className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No pending EKQR transactions found</p>
              <p className="text-sm">All EKQR payments have been properly processed.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Transactions List */}
      {pendingTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending EKQR Transactions ({pendingTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline">EKQR</Badge>
                      <Badge variant="secondary">Pending</Badge>
                      <span className="text-sm font-mono text-muted-foreground">
                        {transaction.id.substring(0, 8)}...
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>User: {transaction.user?.full_name || transaction.user?.email || 'Unknown'}</p>
                      <p>Amount: ₹{transaction.amount}</p>
                      <p>Created: {new Date(transaction.created_at).toLocaleDateString()}</p>
                      {transaction.payment_data?.bookingIntent && (
                        <p>
                          Booking Intent: {transaction.payment_data.bookingIntent.booking_period} period
                          {transaction.payment_data.bookingIntent.study_hall_id && 
                            ` for study hall ${transaction.payment_data.bookingIntent.study_hall_id.substring(0, 8)}...`
                          }
                        </p>
                      )}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => recoverSingleTransaction(transaction.id)}
                    disabled={loading}
                  >
                    Recover
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recovery Results */}
      {recoveryResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recovery Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recoveryResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm font-mono">
                    {result.transactionId.substring(0, 8)}...
                  </span>
                  <div className="flex items-center space-x-2">
                    {result.success ? (
                      <>
                        <Badge variant="default">Success</Badge>
                        {result.bookingId && (
                          <span className="text-sm text-muted-foreground">
                            Booking: {result.bookingId.substring(0, 8)}...
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <Badge variant="destructive">Failed</Badge>
                        <span className="text-sm text-destructive">
                          {result.error}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EKQRRecoveryTab;