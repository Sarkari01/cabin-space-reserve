import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, Download, TrendingUp, CreditCard } from "lucide-react";
import type { MerchantBalance } from "@/hooks/useWithdrawals";

interface MerchantBalanceCardProps {
  balance: MerchantBalance | null;
  loading: boolean;
  onRequestWithdrawal: () => void;
}

export function MerchantBalanceCard({ balance, loading, onRequestWithdrawal }: MerchantBalanceCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!balance) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No balance information available
        </CardContent>
      </Card>
    );
  }

  const canWithdraw = balance.available_balance > 0;

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Available Balance
            </CardTitle>
            <CardDescription>Ready for withdrawal</CardDescription>
          </div>
          <Badge variant={canWithdraw ? "default" : "secondary"}>
            {canWithdraw ? "Available" : "No Balance"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground">
            ₹{balance.available_balance.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Available for withdrawal
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Total Earnings
            </div>
            <div className="font-semibold">₹{balance.total_earnings.toLocaleString()}</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              Platform Fees
            </div>
            <div className="font-semibold text-red-600">
              -₹{balance.platform_fees.toLocaleString()}
            </div>
          </div>
        </div>

        {balance.pending_withdrawals > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-yellow-800">Pending Withdrawals:</span>
              <span className="font-semibold text-yellow-900">
                ₹{balance.pending_withdrawals.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <Button 
          onClick={onRequestWithdrawal}
          disabled={!canWithdraw}
          className="w-full"
          size="lg"
        >
          <Download className="h-4 w-4 mr-2" />
          Request Withdrawal
        </Button>
      </CardContent>
    </Card>
  );
}