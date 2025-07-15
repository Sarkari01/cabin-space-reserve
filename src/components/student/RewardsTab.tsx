import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Coins, Gift, History, ArrowUpDown, ShoppingCart, Ticket } from "lucide-react";
import { useRewards } from "@/hooks/useRewards";
import { useCoupons } from "@/hooks/useCoupons";
import { useReferrals } from "@/hooks/useReferrals";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading";

export const RewardsTab = () => {
  const { rewards, transactions, loading: rewardsLoading, redeemRewards } = useRewards();
  const { userCoupons, loading: couponsLoading } = useCoupons();
  const { referralCode, referralStats, loading: referralsLoading, shareReferralCode } = useReferrals();
  const { toast } = useToast();
  
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const handleRedeem = async () => {
    const amount = parseInt(redeemAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to redeem",
        variant: "destructive"
      });
      return;
    }

    if (amount > (rewards?.available_points || 0)) {
      toast({
        title: "Insufficient Points",
        description: "You don't have enough points to redeem this amount",
        variant: "destructive"
      });
      return;
    }

    setRedeeming(true);
    try {
      await redeemRewards(amount);
      setRedeemAmount("");
      toast({
        title: "Rewards Redeemed!",
        description: `Successfully redeemed ${amount} points`,
      });
    } catch (error) {
      toast({
        title: "Redemption Failed",
        description: "Failed to redeem rewards. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRedeeming(false);
    }
  };

  const handleShareReferral = async () => {
    try {
      await shareReferralCode("copy");
      toast({
        title: "Referral Code Shared!",
        description: "Your referral code has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Failed to share referral code",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (rewardsLoading || couponsLoading || referralsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">Rewards & Benefits</h3>
        <Badge variant="outline" className="text-lg px-3 py-1">
          <Coins className="h-4 w-4 mr-2" />
          {rewards?.available_points || 0} Points
        </Badge>
      </div>

      {/* Rewards Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Available Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rewards?.available_points || 0}</div>
            <p className="text-xs text-muted-foreground">Ready to redeem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Lifetime Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rewards?.lifetime_earned || 0}</div>
            <p className="text-xs text-muted-foreground">Total points earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Redeemed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rewards?.lifetime_redeemed || 0}</div>
            <p className="text-xs text-muted-foreground">Points used</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Redeem Points */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="h-5 w-5 mr-2" />
              Redeem Points
            </CardTitle>
            <CardDescription>
              Convert your points to booking discounts (1 point = ₹1)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="Enter points to redeem"
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(e.target.value)}
                min="1"
                max={rewards?.available_points || 0}
              />
              <Button 
                onClick={handleRedeem} 
                disabled={redeeming || !redeemAmount}
              >
                {redeeming ? <LoadingSpinner className="h-4 w-4" /> : "Redeem"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum: 100 points • Maximum: {rewards?.available_points || 0} points
            </p>
          </CardContent>
        </Card>

        {/* Referral Program */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowUpDown className="h-5 w-5 mr-2" />
              Refer Friends
            </CardTitle>
            <CardDescription>
              Earn 1000 points for each successful referral
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={referralCode?.code || "Loading..."}
                readOnly
                className="font-mono"
              />
              <Button variant="outline" onClick={handleShareReferral}>
                Share
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Referrals</p>
                <p className="font-semibold">{referralStats?.total_referrals || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Successful</p>
                <p className="font-semibold">{referralStats?.successful_referrals || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Coupons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Ticket className="h-5 w-5 mr-2" />
            My Coupons
          </CardTitle>
          <CardDescription>
            Available discount coupons and vouchers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userCoupons.length > 0 ? (
            <div className="space-y-3">
              {userCoupons.map((coupon) => (
                <div key={coupon.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{coupon.title}</h4>
                    <p className="text-sm text-muted-foreground">{coupon.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Code: <span className="font-mono font-medium">{coupon.code}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={coupon.status === 'active' ? 'default' : 'secondary'}>
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`} OFF
                    </Badge>
                    {coupon.end_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires: {formatDate(coupon.end_date)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No coupons available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Your rewards and redemption history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{transaction.reason}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                  <div className={`font-semibold ${
                    transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'earned' ? '+' : '-'}{transaction.points} points
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No activity yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};