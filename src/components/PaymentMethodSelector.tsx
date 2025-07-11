import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, QrCode, Wallet, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentMethodSelectorProps {
  onMethodSelect: (method: string) => void;
  selectedMethod: string;
}

export const PaymentMethodSelector = ({ onMethodSelect, selectedMethod }: PaymentMethodSelectorProps) => {
  const [loading, setLoading] = useState(true);
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validatePaymentGateways();
  }, []);

  const validatePaymentGateways = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke('validate-payment-gateways');
      
      if (error) {
        throw new Error(error.message || 'Failed to validate payment gateways');
      }
      
      console.log("Gateway validation response:", data);
      
      setGatewayStatus(data.gateways);
      setAvailableMethods(data.availableMethods || []);
      
      // Auto-select first available method only if no method is currently selected
      if (data.availableMethods?.length > 0 && !selectedMethod) {
        console.log("Auto-selecting payment method:", data.availableMethods[0]);
        onMethodSelect(data.availableMethods[0]);
      }
      
      // If current method is no longer available, switch to first available
      if (selectedMethod && data.availableMethods && !data.availableMethods.includes(selectedMethod) && data.availableMethods.length > 0) {
        console.log("Switching to available payment method:", data.availableMethods[0]);
        onMethodSelect(data.availableMethods[0]);
      }
    } catch (error) {
      console.error('Error validating payment gateways:', error);
      setError(error instanceof Error ? error.message : 'Failed to load payment methods');
      setAvailableMethods([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (availableMethods.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium">No payment methods available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Payment gateways are not properly configured. Please contact the administrator.
              </p>
            </div>
            {gatewayStatus && (
              <div className="text-xs text-left bg-muted p-3 rounded space-y-1">
                <p className="font-medium">Configuration Status:</p>
                {gatewayStatus.razorpay && (
                  <p>• Razorpay: {gatewayStatus.razorpay.status.replace('_', ' ')}</p>
                )}
                {gatewayStatus.ekqr && (
                  <p>• EKQR: {gatewayStatus.ekqr.status.replace('_', ' ')}</p>
                )}
                {gatewayStatus.offline && (
                  <p>• Offline: {gatewayStatus.offline.status}</p>
                )}
              </div>
            )}
          </div>
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