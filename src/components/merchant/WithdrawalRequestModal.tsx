import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { IndianRupee, CreditCard, Building2 } from "lucide-react";
import type { MerchantBalance } from "@/hooks/useWithdrawals";

interface WithdrawalRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: MerchantBalance | null;
  onSubmit: (amount: number, method: string) => Promise<boolean>;
}

export function WithdrawalRequestModal({
  open,
  onOpenChange,
  balance,
  onSubmit
}: WithdrawalRequestModalProps) {
  const [amount, setAmount] = useState("");
  const [withdrawalMethod, setWithdrawalMethod] = useState("bank_transfer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setIsSubmitting(true);
    const success = await onSubmit(parseFloat(amount), withdrawalMethod);
    if (success) {
      setAmount("");
      setWithdrawalMethod("bank_transfer");
      onOpenChange(false);
    }
    setIsSubmitting(false);
  };

  const handleQuickAmount = (percentage: number) => {
    if (!balance?.available_balance) return;
    const quickAmount = Math.floor(balance.available_balance * percentage);
    setAmount(quickAmount.toString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Request Withdrawal
          </DialogTitle>
        </DialogHeader>

        {balance && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <CardDescription className="text-2xl font-bold text-green-600">
                ₹{balance.available_balance.toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Total Earnings:</span>
                  <span>₹{balance.total_earnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fees:</span>
                  <span>-₹{balance.platform_fees.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Withdrawals:</span>
                  <span>-₹{balance.pending_withdrawals.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max={balance?.available_balance || 0}
              step="0.01"
              required
            />
            
            {balance && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(0.25)}
                  className="text-xs"
                >
                  25%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(0.5)}
                  className="text-xs"
                >
                  50%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(1)}
                  className="text-xs"
                >
                  100%
                </Button>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Withdrawal Method</Label>
            <RadioGroup
              value={withdrawalMethod}
              onValueChange={setWithdrawalMethod}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                <Label htmlFor="bank_transfer" className="flex items-center gap-2 cursor-pointer">
                  <Building2 className="h-4 w-4" />
                  Bank Transfer
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" />
                  UPI Transfer
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}