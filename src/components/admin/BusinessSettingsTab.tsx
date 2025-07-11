import React, { useState } from "react";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, CreditCard, QrCode, Wallet } from "lucide-react";

export const BusinessSettingsTab = () => {
  const { settings, loading, updateSettings } = useBusinessSettings();
  const [formData, setFormData] = useState({
    razorpay_enabled: false,
    razorpay_key_id: "",
    ekqr_enabled: false,
    ekqr_merchant_id: "",
    offline_enabled: true,
  });
  const [saving, setSaving] = useState(false);

  // Update form data when settings are loaded
  React.useEffect(() => {
    if (settings) {
      setFormData({
        razorpay_enabled: settings.razorpay_enabled,
        razorpay_key_id: settings.razorpay_key_id || "",
        ekqr_enabled: settings.ekqr_enabled,
        ekqr_merchant_id: settings.ekqr_merchant_id || "",
        offline_enabled: settings.offline_enabled,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateSettings(formData);
      if (success) {
        console.log("Business settings updated successfully");
      }
    } catch (error) {
      console.error("Error saving business settings:", error);
    } finally {
      setSaving(false);
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
          Configure payment gateways and business preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Razorpay Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Razorpay Gateway
            </CardTitle>
            <CardDescription>
              Enable online payments via UPI, Cards, and Net Banking
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
              <p className="text-xs text-muted-foreground">
                Get your Key ID from Razorpay Dashboard. Note: Secret key is managed separately in project settings.
              </p>
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
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              EKQR Payment Gateway
            </CardTitle>
            <CardDescription>
              Enable UPI QR code payments using EKQR API
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
              <Label htmlFor="ekqr-merchant">EKQR Merchant ID</Label>
              <Input
                id="ekqr-merchant"
                value={formData.ekqr_merchant_id}
                onChange={(e) =>
                  setFormData({ ...formData, ekqr_merchant_id: e.target.value })
                }
                placeholder="Your EKQR Merchant ID"
                disabled={!formData.ekqr_enabled}
              />
              <p className="text-xs text-muted-foreground">
                Contact EKQR support for your Merchant ID. Note: API key is managed separately in project settings.
              </p>
              {formData.ekqr_enabled && !formData.ekqr_merchant_id.trim() && (
                <p className="text-xs text-destructive">
                  Merchant ID is required when EKQR is enabled
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Offline Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Pay at Study Hall
            </CardTitle>
            <CardDescription>
              Allow users to book seats and pay in person
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

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
};