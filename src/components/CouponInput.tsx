import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, Check, X, Loader2 } from "lucide-react";
import { useCoupons } from "@/hooks/useCoupons";
import { useToast } from "@/hooks/use-toast";

interface CouponInputProps {
  bookingAmount: number;
  onCouponApplied: (discount: number, couponCode: string) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: {
    code: string;
    discount: number;
    title?: string;
  };
}

export const CouponInput = ({ 
  bookingAmount, 
  onCouponApplied, 
  onCouponRemoved, 
  appliedCoupon 
}: CouponInputProps) => {
  const [couponCode, setCouponCode] = useState("");
  const [validating, setValidating] = useState(false);
  const { validateCoupon } = useCoupons();
  const { toast } = useToast();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Invalid Code",
        description: "Please enter a coupon code",
        variant: "destructive"
      });
      return;
    }

    setValidating(true);
    try {
      const result = await validateCoupon(couponCode.trim().toUpperCase(), bookingAmount);
      
      if (result.valid) {
        onCouponApplied(result.discount_amount, couponCode.trim().toUpperCase());
        setCouponCode("");
        toast({
          title: "Coupon Applied!",
          description: `You saved ₹${result.discount_amount} with code ${couponCode.toUpperCase()}`,
        });
      } else {
        toast({
          title: "Invalid Coupon",
          description: "This coupon code is not valid",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Validation Failed",
        description: "Failed to validate coupon. Please try again.",
        variant: "destructive"
      });
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    toast({
      title: "Coupon Removed",
      description: "Coupon has been removed from your booking",
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <Label className="flex items-center text-sm font-medium">
            <Ticket className="h-4 w-4 mr-2" />
            Apply Coupon Code
          </Label>

          {appliedCoupon ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">{appliedCoupon.code}</p>
                  {appliedCoupon.title && (
                    <p className="text-sm text-green-700">{appliedCoupon.title}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="bg-green-600">
                  -₹{appliedCoupon.discount}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCoupon}
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex space-x-2">
              <Input
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                className="font-mono"
                disabled={validating}
              />
              <Button 
                onClick={handleApplyCoupon} 
                disabled={validating || !couponCode.trim()}
                className="px-6"
              >
                {validating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Apply"
                )}
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Enter a valid coupon code to get discounts on your booking
          </div>
        </div>
      </CardContent>
    </Card>
  );
};