import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BrandAssetUpload } from "@/components/BrandAssetUpload";
import { Loader2, RefreshCw, ChevronDown, Building2, CreditCard } from "lucide-react";

export const BusinessSettingsTab = () => {
  const { settings, loading, updateSettings } = useBusinessSettings();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    ekqr_enabled: false,
    offline_enabled: true,
    razorpay_enabled: false,
    // Brand Identity
    logo_url: '',
    favicon_url: '',
    brand_name: 'StudySpace Platform',
    support_email: '',
    support_phone: '',
    website_url: '',
    tagline: '',
  });
  const [saving, setSaving] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<Record<string, string>>({});
  const [validating, setValidating] = useState(false);
  const [brandSectionOpen, setBrandSectionOpen] = useState(true);
  const [paymentSectionOpen, setPaymentSectionOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        ekqr_enabled: settings.ekqr_enabled,
        offline_enabled: settings.offline_enabled,
        razorpay_enabled: settings.razorpay_enabled,
        // Brand Identity
        logo_url: settings.logo_url || '',
        favicon_url: settings.favicon_url || '',
        brand_name: settings.brand_name || 'StudySpace Platform',
        support_email: settings.support_email || '',
        support_phone: settings.support_phone || '',
        website_url: settings.website_url || '',
        tagline: settings.tagline || '',
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

  // Validation functions
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone: string) => {
    return /^[\+]?[\d\s\-\(\)]{10,}$/.test(phone);
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
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
      <div>
        <h3 className="text-lg font-medium">Business Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure your platform's brand identity and payment settings
        </p>
      </div>

      {/* Brand Identity Section */}
      <Collapsible open={brandSectionOpen} onOpenChange={setBrandSectionOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <span className="text-lg font-medium">Brand Identity</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${brandSectionOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 pt-4">
          <div className="grid gap-6">
            {/* Logo Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Platform Logo</CardTitle>
                <CardDescription>
                  Upload your platform logo. This will be displayed in the header and various locations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BrandAssetUpload
                  assetType="logo"
                  currentAssetUrl={formData.logo_url}
                  onAssetUploaded={(url) => setFormData(prev => ({ ...prev, logo_url: url }))}
                  onAssetRemoved={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                />
              </CardContent>
            </Card>

            {/* Favicon Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Favicon</CardTitle>
                <CardDescription>
                  Upload your platform favicon. This will be displayed in browser tabs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BrandAssetUpload
                  assetType="favicon"
                  currentAssetUrl={formData.favicon_url}
                  onAssetUploaded={(url) => setFormData(prev => ({ ...prev, favicon_url: url }))}
                  onAssetRemoved={() => setFormData(prev => ({ ...prev, favicon_url: '' }))}
                />
              </CardContent>
            </Card>

            {/* Brand Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Brand Information</CardTitle>
                <CardDescription>
                  Configure your platform's basic brand information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brand-name">Platform Name</Label>
                  <Input
                    id="brand-name"
                    value={formData.brand_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
                    placeholder={settings?.brand_name || "StudySpace Platform"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={formData.support_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, support_email: e.target.value }))}
                    placeholder={settings?.support_email || "support@studyspace.com"}
                    className={formData.support_email && !isValidEmail(formData.support_email) ? 'border-destructive' : ''}
                  />
                  {formData.support_email && !isValidEmail(formData.support_email) && (
                    <p className="text-sm text-destructive">Please enter a valid email address</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support-phone">Support Phone</Label>
                  <Input
                    id="support-phone"
                    value={formData.support_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, support_phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                    className={formData.support_phone && !isValidPhone(formData.support_phone) ? 'border-destructive' : ''}
                  />
                  {formData.support_phone && !isValidPhone(formData.support_phone) && (
                    <p className="text-sm text-destructive">Please enter a valid phone number</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website-url">Website URL (Optional)</Label>
                  <Input
                    id="website-url"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                    placeholder={settings?.website_url || "https://studyspace.com"}
                    className={formData.website_url && !isValidUrl(formData.website_url) ? 'border-destructive' : ''}
                  />
                  {formData.website_url && !isValidUrl(formData.website_url) && (
                    <p className="text-sm text-destructive">Please enter a valid URL</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline (Optional)</Label>
                  <Textarea
                    id="tagline"
                    value={formData.tagline}
                    onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="Your study space awaits..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Payment Gateway Section */}
      <Collapsible open={paymentSectionOpen} onOpenChange={setPaymentSectionOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <span className="text-lg font-medium">Payment Gateways</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  validateGateways();
                }} 
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
              <ChevronDown className={`h-4 w-4 transition-transform ${paymentSectionOpen ? 'rotate-180' : ''}`} />
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 pt-4">

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

        {/* Razorpay Payment Gateway */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">Razorpay Payment Gateway</CardTitle>
              <CardDescription>
                Accept card and UPI payments through Razorpay
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(gatewayStatus.razorpay || 'unknown')}
              <Switch
                checked={formData.razorpay_enabled}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, razorpay_enabled: checked }))
                }
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Razorpay API keys are managed securely through Supabase secrets.</p>
              <p>Contact your administrator to configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.</p>
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
        </CollapsibleContent>
      </Collapsible>

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