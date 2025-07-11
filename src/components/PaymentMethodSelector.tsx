import { useState, useEffect } from "react";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, QrCode, Wallet, Loader2 } from "lucide-react";

interface PaymentMethodSelectorProps {
  onMethodSelect: (method: string) => void;
  selectedMethod: string;
}

export const PaymentMethodSelector = ({ onMethodSelect, selectedMethod }: PaymentMethodSelectorProps) => {
  const { settings, loading } = useBusinessSettings();
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);

  useEffect(() => {
    if (settings) {
      const methods: string[] = [];
      
      // Check Razorpay - needs to be enabled AND have key_id
      if (settings.razorpay_enabled && settings.razorpay_key_id?.trim()) {
        methods.push("razorpay");
      }
      
      // Check EKQR - needs to be enabled AND have merchant_id
      if (settings.ekqr_enabled && settings.ekqr_merchant_id?.trim()) {
        methods.push("ekqr");
      }
      
      // Check offline - just needs to be enabled
      if (settings.offline_enabled) {
        methods.push("offline");
      }
      
      setAvailableMethods(methods);
      
      // Auto-select first available method only if no method is currently selected
      if (methods.length > 0 && !selectedMethod) {
        onMethodSelect(methods[0]);
      }
      
      // If current method is no longer available, switch to first available
      if (selectedMethod && !methods.includes(selectedMethod) && methods.length > 0) {
        onMethodSelect(methods[0]);
      }
    }
  }, [settings, selectedMethod, onMethodSelect]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (availableMethods.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No payment methods are currently available. Please contact the administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  const paymentMethods = [
    {
      id: "razorpay",
      title: "Online Payment",
      description: "Pay instantly using UPI, Cards, or Net Banking",
      icon: CreditCard,
      enabled: availableMethods.includes("razorpay"),
    },
    {
      id: "ekqr",
      title: "UPI QR Payment",
      description: "Scan QR code to pay using any UPI app",
      icon: QrCode,
      enabled: availableMethods.includes("ekqr"),
    },
    {
      id: "offline",
      title: "Pay at Study Hall",
      description: "Reserve seat now, pay when you arrive",
      icon: Wallet,
      enabled: availableMethods.includes("offline"),
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Select Payment Method</h3>
      <RadioGroup value={selectedMethod} onValueChange={onMethodSelect}>
        <div className="grid gap-3">
          {paymentMethods
            .filter((method) => method.enabled)
            .map((method) => {
              const Icon = method.icon;
              return (
                <div key={method.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={method.id} id={method.id} />
                  <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                    <Card className="hover:bg-accent transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Icon className="h-4 w-4" />
                          {method.title}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {method.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Label>
                </div>
              );
            })}
        </div>
      </RadioGroup>
    </div>
  );
};