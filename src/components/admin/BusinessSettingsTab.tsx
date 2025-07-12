import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";

export const BusinessSettingsTab = () => {
  const { settings, loading, updateSettings } = useBusinessSettings();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    ekqr_enabled: false,
    offline_enabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<Record<string, string>>({});
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        ekqr_enabled: settings.ekqr_enabled,
        offline_enabled: settings.offline_enabled,
      });
    }
  }, [settings]);

  useEffect(() => {
    if (settings) {
      validateGateways();
    }
  }, [settings]);

  const validateGateways = async () => {
    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-payment-gateways');
      if (error) throw error;
      setGatewayStatus(data.gateways || {});
    } catch (error) {
      console.error('Error validating gateways:', error);
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
      console.error('Error saving business settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'configured':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Configured</Badge>;
      case 'missing_config':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Missing Config</Badge>;
      case 'disabled':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Disabled</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-800 border-red-200">Error</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Payment Gateway Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure your payment methods for study hall bookings
          </p>
        </div>
        <Button 
          onClick={validateGateways} 
          variant="outline" 
          size="sm"
          disabled={validating}
        >
          {validating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Status
        </Button>
      </div>

      <div className="grid gap-6">
        {/* EKQR Payment Gateway */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">EKQR Payment Gateway</CardTitle>
              <CardDescription>
                Accept QR code payments through EKQR
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(gatewayStatus.ekqr || 'unknown')}
              <Switch
                checked={formData.ekqr_enabled}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, ekqr_enabled: checked }))
                }
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>EKQR API key is managed securely through Supabase secrets.</p>
              <p>Contact your administrator to configure the EKQR_API_KEY secret.</p>
            </div>
          </CardContent>
        </Card>

        {/* Offline Payment */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">Pay at Study Hall</CardTitle>
              <CardDescription>
                Allow customers to pay directly at the study hall
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(gatewayStatus.offline || 'configured')}
              <Switch
                checked={formData.offline_enabled}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, offline_enabled: checked }))
                }
              />
            </div>
          </CardHeader>
        </Card>
      </div>

      <Separator />

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="min-w-[120px]"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  );
};