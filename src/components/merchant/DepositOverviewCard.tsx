import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  AlertCircle,
  Eye
} from 'lucide-react';

interface DepositOverview {
  totalDepositsCollected: number;
  depositsHeld: number;
  depositsRefunded: number;
  pendingRefunds: number;
  averageDepositAmount: number;
  refundRate: number;
}

interface Props {
  onViewDetails?: () => void;
}

export const DepositOverviewCard: React.FC<Props> = ({ onViewDetails }) => {
  const [overview, setOverview] = useState<DepositOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchDepositOverview();
    }
  }, [user]);

  const fetchDepositOverview = async () => {
    try {
      setLoading(true);

      // Fetch cabin bookings for merchant's private halls with deposits
      const { data: cabinBookings, error } = await supabase
        .from('cabin_bookings')
        .select(`
          id,
          deposit_amount,
          booking_amount,
          total_amount,
          deposit_refunded,
          status,
          private_halls!private_hall_id (
            merchant_id
          )
        `)
        .gt('deposit_amount', 0)
        .eq('private_halls.merchant_id', user?.id);

      if (error) {
        console.error('Error fetching deposit overview:', error);
        return;
      }

      // Calculate metrics
      const bookings = cabinBookings || [];
      const totalDepositsCollected = bookings.reduce((sum, b) => sum + (b.deposit_amount || 0), 0);
      const depositsRefunded = bookings
        .filter(b => b.deposit_refunded)
        .reduce((sum, b) => sum + (b.deposit_amount || 0), 0);
      const depositsHeld = totalDepositsCollected - depositsRefunded;
      const pendingRefunds = bookings
        .filter(b => !b.deposit_refunded && (b.status === 'completed' || b.status === 'cancelled'))
        .reduce((sum, b) => sum + (b.deposit_amount || 0), 0);
      const averageDepositAmount = bookings.length > 0 
        ? totalDepositsCollected / bookings.length 
        : 0;
      const refundRate = bookings.length > 0 
        ? (bookings.filter(b => b.deposit_refunded).length / bookings.length) * 100 
        : 0;

      setOverview({
        totalDepositsCollected,
        depositsHeld,
        depositsRefunded,
        pendingRefunds,
        averageDepositAmount,
        refundRate
      });

    } catch (error) {
      console.error('Error in fetchDepositOverview:', error);
      toast({
        title: "Error",
        description: "Failed to load deposit overview.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-16 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!overview) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            No deposit data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Deposit Overview</CardTitle>
        {onViewDetails && (
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Total Collected</span>
            </div>
            <p className="text-xl font-bold">₹{overview.totalDepositsCollected.toLocaleString()}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Currently Held</span>
            </div>
            <p className="text-xl font-bold text-blue-600">₹{overview.depositsHeld.toLocaleString()}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              <span>Refunded</span>
            </div>
            <p className="text-xl font-bold text-green-600">₹{overview.depositsRefunded.toLocaleString()}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Average Amount</span>
            </div>
            <p className="text-xl font-bold">₹{overview.averageDepositAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Refund Rate</span>
            <Badge variant="outline">{overview.refundRate.toFixed(1)}%</Badge>
          </div>
          
          {overview.pendingRefunds > 0 && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Pending Refunds
                </p>
                <p className="text-xs text-yellow-600">
                  ₹{overview.pendingRefunds.toLocaleString()} awaiting refund
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Deposits are automatically collected with cabin bookings and should be refunded when bookings are completed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};