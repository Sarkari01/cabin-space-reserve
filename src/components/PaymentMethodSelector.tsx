import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { QrCode, Wallet, Loader2, AlertCircle, RefreshCw } from "lucide-react";
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
      
      console.log('Validating payment gateways...');
      const { data, error } = await supabase.functions.invoke('validate-payment-gateways');
      
      console.log('Payment gateway validation result:', { data, error });
      
      if (error) {
        throw new Error(error.message || 'Failed to validate payment gateways');
      }
      
      setGatewayStatus(data.gateways);
      setAvailableMethods(data.availableMethods || []);
      
      // Auto-select first available method only if no method is currently selected
      if (data.availableMethods?.length > 0 && !selectedMethod) {
        onMethodSelect(data.availableMethods[0]);
      }
      
      // If current method is no longer available, switch to first available
      if (selectedMethod && data.availableMethods && !data.availableMethods.includes(selectedMethod) && data.availableMethods.length > 0) {
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
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={validatePaymentGateways}
            className="ml-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
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
                {gatewayStatus.ekqr && (
                  <p>• EKQR: {gatewayStatus.ekqr.replace('_', ' ')}</p>
                )}
                {gatewayStatus.razorpay && (
                  <p>• Razorpay: {gatewayStatus.razorpay.replace('_', ' ')}</p>
                )}
                {gatewayStatus.offline && (
                  <p>• Offline: {gatewayStatus.offline}</p>
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
      id: "ekqr",
      title: "QR Code Payment",
      description: "Scan QR code with your mobile app",
      icon: QrCode,
      enabled: availableMethods.includes("ekqr"),
    },
    {
      id: "razorpay",
      title: "Card / UPI Payment",
      description: "Pay securely with cards, UPI, wallets",
      icon: () => <span className="text-lg">💳</span>,
      enabled: availableMethods.includes("razorpay"),
    },
    {
      id: "offline",
      title: "Pay at Study Hall",
      description: "Pay directly when you arrive",
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
                <div key={method.id} className="flex items-start space-x-3 p-1">
                  <RadioGroupItem 
                    value={method.id} 
                    id={method.id} 
                    className="mt-2 flex-shrink-0"
                  />
                  <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                    <Card className="hover:bg-accent transition-colors min-h-[60px]">
                      <CardHeader className="pb-2 px-3 py-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="line-clamp-1">{method.title}</span>
                        </CardTitle>
                        <CardDescription className="text-sm line-clamp-2">
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