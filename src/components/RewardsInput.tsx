import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Gift, Check, X, Loader2 } from "lucide-react";
import { useRewards } from "@/hooks/useRewards";
import { useToast } from "@/hooks/use-toast";

interface RewardsInputProps {
  bookingAmount: number;
  onRewardsApplied: (discount: number, pointsUsed: number) => void;
  onRewardsRemoved: () => void;
  appliedRewards?: {
    pointsUsed: number;
    discount: number;
  };
}

export const RewardsInput = ({ 
  bookingAmount, 
  onRewardsApplied, 
  onRewardsRemoved, 
  appliedRewards 
}: RewardsInputProps) => {
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [redeeming, setRedeeming] = useState(false);
  const { rewards, loading } = useRewards();
  const { toast } = useToast();

  // Conversion rate: 1 point = ₹0.10 (10 points = ₹1)
  const POINTS_TO_RUPEE_RATE = 0.10;
  
  const maxRedeemablePoints = Math.min(
    rewards?.available_points || 0,
    Math.floor(bookingAmount / POINTS_TO_RUPEE_RATE) // Can't redeem more than booking amount
  );

  const calculateDiscount = (points: number) => {
    return Math.min(points * POINTS_TO_RUPEE_RATE, bookingAmount);
  };

  const handleApplyRewards = async () => {
    if (pointsToRedeem <= 0) {
      toast({
        title: "Invalid Points",
        description: "Please select points to redeem",
        variant: "destructive"
      });
      return;
    }

    if (pointsToRedeem > maxRedeemablePoints) {
      toast({
        title: "Insufficient Points",
        description: `You can redeem maximum ${maxRedeemablePoints} points`,
        variant: "destructive"
      });
      return;
    }

    setRedeeming(true);
    try {
      const discount = calculateDiscount(pointsToRedeem);
      
      // Apply rewards immediately (validation happens during actual booking)
      onRewardsApplied(discount, pointsToRedeem);
      setPointsToRedeem(0);
      
      toast({
        title: "Rewards Applied!",
        description: `You will save ₹${discount} using ${pointsToRedeem} points`,
      });
    } catch (error) {
      toast({
        title: "Application Failed",
        description: "Failed to apply rewards. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRedeeming(false);
    }
  };

  const handleRemoveRewards = () => {
    onRewardsRemoved();
    toast({
      title: "Rewards Removed",
      description: "Rewards have been removed from your booking",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading rewards...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rewards || rewards.available_points <= 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center py-4">
            <Gift className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No reward points available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Complete bookings to earn reward points
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <Label className="flex items-center text-sm font-medium">
            <Gift className="h-4 w-4 mr-2" />
            Redeem Reward Points
          </Label>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Available Points: {rewards.available_points}
                </p>
                <p className="text-xs text-blue-700">
                  Worth ₹{(rewards.available_points * POINTS_TO_RUPEE_RATE).toFixed(2)}
                </p>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                10 points = ₹1
              </Badge>
            </div>
          </div>

          {appliedRewards ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">
                    {appliedRewards.pointsUsed} points redeemed
                  </p>
                  <p className="text-sm text-green-700">
                    Discount applied: ₹{appliedRewards.discount}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="bg-green-600">
                  -₹{appliedRewards.discount}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveRewards}
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="points-slider" className="text-sm">
                    Points to redeem: {pointsToRedeem}
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    Discount: ₹{calculateDiscount(pointsToRedeem).toFixed(2)}
                  </span>
                </div>
                
                <Slider
                  id="points-slider"
                  min={0}
                  max={maxRedeemablePoints}
                  step={10}
                  value={[pointsToRedeem]}
                  onValueChange={(values) => setPointsToRedeem(values[0])}
                  className="w-full"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>{maxRedeemablePoints}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Enter points"
                  value={pointsToRedeem || ""}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setPointsToRedeem(Math.min(value, maxRedeemablePoints));
                  }}
                  min={0}
                  max={maxRedeemablePoints}
                  disabled={redeeming}
                />
                <Button 
                  onClick={handleApplyRewards} 
                  disabled={redeeming || pointsToRedeem <= 0}
                  className="px-6"
                >
                  {redeeming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              </div>

              <div className="flex space-x-2">
                {[25, 50, 100].map((percentage) => {
                  const points = Math.floor((maxRedeemablePoints * percentage) / 100);
                  if (points <= 0) return null;
                  
                  return (
                    <Button
                      key={percentage}
                      variant="outline"
                      size="sm"
                      onClick={() => setPointsToRedeem(points)}
                      disabled={redeeming}
                      className="text-xs"
                    >
                      {percentage}% ({points})
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPointsToRedeem(maxRedeemablePoints)}
                  disabled={redeeming || maxRedeemablePoints <= 0}
                  className="text-xs"
                >
                  Max ({maxRedeemablePoints})
                </Button>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Use reward points to get discounts on your booking. Points are earned after completing bookings.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};