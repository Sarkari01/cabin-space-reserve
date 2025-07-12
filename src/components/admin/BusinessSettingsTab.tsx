import React, { useState, useEffect } from "react";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, QrCode, Wallet, CheckCircle, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const BusinessSettingsTab = () => {
  const { settings, loading, updateSettings } = useBusinessSettings();
  const [formData, setFormData] = useState({
    razorpay_enabled: false,
    razorpay_key_id: "",
    ekqr_enabled: false,
    ekqr_merchant_code: "",
    offline_enabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);
  const [validating, setValidating] = useState(false);

  // Update form data when settings are loaded
  React.useEffect(() => {
    if (settings) {
      setFormData({
        razorpay_enabled: settings.razorpay_enabled,
        razorpay_key_id: settings.razorpay_key_id || "",
        ekqr_enabled: settings.ekqr_enabled,
        ekqr_merchant_code: settings.ekqr_merchant_code || "",
        offline_enabled: settings.offline_enabled,
      });
    }
  }, [settings]);

  // Validate gateways when component loads
  useEffect(() => {
    validateGateways();
  }, []);

  const validateGateways = async () => {
    try {
      setValidating(true);
      const { data } = await supabase.functions.invoke('validate-payment-gateways');
      setGatewayStatus(data?.gateways || null);
    } catch (error) {
      console.error('Gateway validation error:', error);
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateSettings(formData);
      if (success) {
        // Re-validate gateways after save
        setTimeout(validateGateways, 1000);
      }
    } catch (error) {
      console.error("Error saving business settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'configured':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Configured</Badge>;
      case 'disabled':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Disabled</Badge>;
      case 'missing_public_key':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Missing Key ID</Badge>;
      case 'missing_secret_key':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Missing Secret</Badge>;
      case 'missing_merchant_code':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Missing Merchant Code</Badge>;
      case 'missing_api_key':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Missing API Key</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Not Configured</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Business Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure payment gateways and business preferences. Note: Some settings require additional secrets to be configured in project settings.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Each payment gateway requires both business settings (configured here) and secure API keys (configured in project secrets). 
          Check the status indicators below to see if your gateways are fully configured.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {/* Razorpay Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Razorpay Gateway
              </div>
              {gatewayStatus?.razorpay && getStatusBadge(gatewayStatus.razorpay.status)}
            </CardTitle>
            <CardDescription>
              Enable online payments via UPI, Cards, and Net Banking. Requires both Key ID (below) and Secret Key (in project secrets).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="razorpay-enabled">Enable Razorpay</Label>
              <Switch
                id="razorpay-enabled"
                checked={formData.razorpay_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, razorpay_enabled: checked })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="razorpay-key">Razorpay Key ID</Label>
              <Input
                id="razorpay-key"
                value={formData.razorpay_key_id}
                onChange={(e) =>
                  setFormData({ ...formData, razorpay_key_id: e.target.value })
                }
                placeholder="rzp_test_xxxxxxxxxx"
                disabled={!formData.razorpay_enabled}
              />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Get your Key ID from Razorpay Dashboard. <ExternalLink className="h-3 w-3" />
                </p>
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  ⚠️ <strong>Also Required:</strong> Add your Razorpay Secret Key to project secrets (Edge Function Secrets in Supabase dashboard).
                </p>
              </div>
              {formData.razorpay_enabled && !formData.razorpay_key_id.trim() && (
                <p className="text-xs text-destructive">
                  Key ID is required when Razorpay is enabled
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* EKQR Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                EKQR Payment Gateway
              </div>
              {gatewayStatus?.ekqr && getStatusBadge(gatewayStatus.ekqr.status)}
            </CardTitle>
            <CardDescription>
              Enable UPI QR code payments using EKQR API. Requires both Merchant Code (below) and API Key (in project secrets).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="ekqr-enabled">Enable EKQR</Label>
              <Switch
                id="ekqr-enabled"
                checked={formData.ekqr_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ekqr_enabled: checked })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ekqr-merchant">EKQR Merchant Code</Label>
              <Input
                id="ekqr-merchant"
                value={formData.ekqr_merchant_code}
                onChange={(e) =>
                  setFormData({ ...formData, ekqr_merchant_code: e.target.value })
                }
                placeholder="Your EKQR Merchant Code (e.g., MERCHANT123456)"
                disabled={!formData.ekqr_enabled}
              />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Contact EKQR support for your Merchant Code.
                </p>
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  ⚠️ <strong>Also Required:</strong> Add your EKQR API Key to project secrets (Edge Function Secrets in Supabase dashboard).
                </p>
              </div>
              {formData.ekqr_enabled && !formData.ekqr_merchant_code.trim() && (
                <p className="text-xs text-destructive">
                  Merchant Code is required when EKQR is enabled
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Offline Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Pay at Study Hall
              </div>
              {gatewayStatus?.offline && getStatusBadge(gatewayStatus.offline.status)}
            </CardTitle>
            <CardDescription>
              Allow users to book seats and pay in person. No additional configuration required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="offline-enabled">Enable Offline Payment</Label>
              <Switch
                id="offline-enabled"
                checked={formData.offline_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, offline_enabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={validateGateways} 
          disabled={validating}
        >
          {validating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Refresh Status
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
};