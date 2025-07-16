import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BrandAssetUpload } from "@/components/BrandAssetUpload";
import { APIKeysSection, APIKeysSectionRef } from "./APIKeysSection";
import { Loader2, RefreshCw, ChevronDown, Building2, CreditCard, Gift, Key, AlertTriangle } from "lucide-react";

export const BusinessSettingsTab = () => {
  const { settings, loading, updateSettings } = useBusinessSettings();
  const { toast } = useToast();
  const apiKeysSectionRef = React.useRef<APIKeysSectionRef>(null);
  const [formData, setFormData] = useState({
    ekqr_enabled: false,
    offline_enabled: true,
    razorpay_enabled: false,
    gemini_enabled: false,
    // Brand Identity
    logo_url: '',
    favicon_url: '',
    brand_name: 'StudySpace Platform',
    support_email: '',
    support_phone: '',
    website_url: '',
    tagline: '',
    business_address: '',
    copyright_text: '',
    // Trial Plan Settings
    trial_plan_enabled: false,
    trial_duration_days: 14,
    trial_plan_name: 'Free Trial',
    trial_max_study_halls: 1,
  });
  const [saving, setSaving] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<Record<string, string>>({});
  const [validating, setValidating] = useState(false);
  const [brandSectionOpen, setBrandSectionOpen] = useState(true);
  const [paymentSectionOpen, setPaymentSectionOpen] = useState(false);
  const [trialSectionOpen, setTrialSectionOpen] = useState(false);
  const [apiKeysSectionOpen, setApiKeysSectionOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        ekqr_enabled: settings.ekqr_enabled,
        offline_enabled: settings.offline_enabled,
        razorpay_enabled: settings.razorpay_enabled,
        gemini_enabled: settings.gemini_enabled || false,
        // Brand Identity
        logo_url: settings.logo_url || '',
        favicon_url: settings.favicon_url || '',
        brand_name: settings.brand_name || 'StudySpace Platform',
        support_email: settings.support_email || '',
        support_phone: settings.support_phone || '',
        website_url: settings.website_url || '',
        tagline: settings.tagline || '',
        business_address: settings.business_address || '',
        copyright_text: settings.copyright_text || '',
        // Trial Plan Settings
        trial_plan_enabled: settings.trial_plan_enabled || false,
        trial_duration_days: settings.trial_duration_days || 14,
        trial_plan_name: settings.trial_plan_name || 'Free Trial',
        trial_max_study_halls: settings.trial_max_study_halls || 1,
      });
    }
  }, [settings]);

  useEffect(() => {
    if (settings) {
      validateGateways();
      // Auto-expand API Keys section if enabled services are missing API keys
      const shouldExpandApiKeys = (
        (settings.gemini_enabled && !settings.gemini_api_key_preview) ||
        (settings.razorpay_enabled && (!settings.razorpay_key_id_preview || !settings.razorpay_key_secret_preview)) ||
        (settings.ekqr_enabled && !settings.ekqr_api_key_preview)
      );
      if (shouldExpandApiKeys) {
        setApiKeysSectionOpen(true);
      }
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
      // Validate enabled services have their API keys configured
      const validationErrors = [];
      
      if (formData.gemini_enabled && !settings?.gemini_api_key_preview) {
        validationErrors.push("Gemini AI is enabled but no API key is configured. Please add the Gemini API key in the API Keys section.");
      }
      
      if (formData.razorpay_enabled && (!settings?.razorpay_key_id_preview || !settings?.razorpay_key_secret_preview)) {
        validationErrors.push("Razorpay is enabled but API keys are not configured. Please add Razorpay keys in the API Keys section.");
      }
      
      if (formData.ekqr_enabled && !settings?.ekqr_api_key_preview) {
        validationErrors.push("EKQR is enabled but no API key is configured. Please add the EKQR API key in the API Keys section.");
      }

      if (validationErrors.length > 0) {
        setApiKeysSectionOpen(true); // Auto-expand API Keys section
        toast({
          title: "Configuration Required",
          description: validationErrors[0],
          variant: "destructive",
        });
        return;
      }

      // Step 1: Save API keys first (critical for proper configuration)
      console.log('Saving API keys first...');
      const apiKeysSuccess = await apiKeysSectionRef.current?.saveAPIKeys() ?? true;
      
      if (!apiKeysSuccess) {
        toast({
          title: "API Keys Save Failed",
          description: "Failed to save API keys. Business settings not updated.",
          variant: "destructive",
        });
        return;
      }

      // Step 2: Save business settings after API keys are secured
      console.log('Saving business settings...');
      const businessSettingsSuccess = await updateSettings(formData);
      
      if (businessSettingsSuccess) {
        toast({
          title: "Success",
          description: "All settings saved successfully",
        });
        
        // Step 3: Refresh and validate configuration
        setTimeout(async () => {
          await validateGateways();
          // Force refresh of business settings to get updated API key previews
          window.location.reload();
        }, 1000);
      } else {
        toast({
          title: "Business Settings Failed",
          description: "API keys saved, but business settings failed to save",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: `Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
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
                    placeholder={`support@${formData.brand_name?.toLowerCase().replace(/\s+/g, '') || 'studyspace'}.com`}
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
                    placeholder="+91 XXXXX XXXXX"
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
                    placeholder={`https://${formData.brand_name?.toLowerCase().replace(/\s+/g, '') || 'studyspace'}.com`}
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

                <div className="space-y-2">
                  <Label htmlFor="business-address">Business Address (Optional)</Label>
                  <Textarea
                    id="business-address"
                    value={formData.business_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_address: e.target.value }))}
                    placeholder="Enter your business address..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="copyright-text">Copyright Text</Label>
                  <Input
                    id="copyright-text"
                    value={formData.copyright_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, copyright_text: e.target.value }))}
                    placeholder={`© ${new Date().getFullYear()} ${formData.brand_name}. All rights reserved.`}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be displayed in the website footer and other appropriate locations.
                  </p>
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

        {/* Gemini AI */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">Gemini AI Assistant</CardTitle>
              <CardDescription>
                Enable AI-powered features like content generation and customer support
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {formData.gemini_enabled && !settings?.gemini_api_key_preview && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  API Key Required
                </Badge>
              )}
              {formData.gemini_enabled && settings?.gemini_api_key_preview && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Configured
                </Badge>
              )}
              <Switch
                checked={formData.gemini_enabled}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, gemini_enabled: checked }))
                }
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.gemini_enabled && !settings?.gemini_api_key_preview ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Configuration Required</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Gemini AI is enabled but no API key is configured. Please add your Gemini API key in the API Keys Management section below to use AI features.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                      onClick={() => setApiKeysSectionOpen(true)}
                    >
                      Configure API Key
                    </Button>
                  </div>
                </div>
              </div>
            ) : formData.gemini_enabled && settings?.gemini_api_key_preview ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm text-green-700">
                      Gemini AI is properly configured and ready to use.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p>Enable Gemini AI to access advanced content generation features.</p>
                <p>You'll need to configure a Gemini API key to use these features.</p>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Trial Plan Section */}
      <Collapsible open={trialSectionOpen} onOpenChange={setTrialSectionOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              <span className="text-lg font-medium">Free Trial Plans</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${trialSectionOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base">Trial Plan Configuration</CardTitle>
                <CardDescription>
                  Configure free trial plans for new merchants. Merchants can use trial plans once before upgrading to paid plans.
                </CardDescription>
              </div>
              <Switch
                checked={formData.trial_plan_enabled}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, trial_plan_enabled: checked }))
                }
              />
            </CardHeader>
            {formData.trial_plan_enabled && (
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trial-plan-name">Trial Plan Name</Label>
                    <Input
                      id="trial-plan-name"
                      value={formData.trial_plan_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, trial_plan_name: e.target.value }))}
                      placeholder="Free Trial"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trial-duration">Trial Duration</Label>
                    <Select
                      value={formData.trial_duration_days.toString()}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, trial_duration_days: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="14">14 Days</SelectItem>
                        <SelectItem value="30">30 Days (1 Month)</SelectItem>
                        <SelectItem value="60">60 Days (2 Months)</SelectItem>
                        <SelectItem value="90">90 Days (3 Months)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trial-max-study-halls">Maximum Study Halls During Trial</Label>
                  <Input
                    id="trial-max-study-halls"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.trial_max_study_halls}
                    onChange={(e) => setFormData(prev => ({ ...prev, trial_max_study_halls: parseInt(e.target.value) || 1 }))}
                    placeholder="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of study halls merchants can create during their trial period
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Trial Plan Features</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Free for {formData.trial_duration_days} days</li>
                    <li>• Maximum {formData.trial_max_study_halls} study hall{formData.trial_max_study_halls > 1 ? 's' : ''}</li>
                    <li>• One-time use per merchant</li>
                    <li>• Basic booking management</li>
                    <li>• Email support</li>
                    <li>• Automatic conversion prompts before expiry</li>
                  </ul>
                </div>
              </CardContent>
            )}
          </Card>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* API Keys Management Section */}
      <Collapsible open={apiKeysSectionOpen} onOpenChange={setApiKeysSectionOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <span className="text-lg font-medium">API Keys Management</span>
              {settings && (
                (settings.gemini_enabled && !settings.gemini_api_key_preview) ||
                (settings.razorpay_enabled && (!settings.razorpay_key_id_preview || !settings.razorpay_key_secret_preview)) ||
                (settings.ekqr_enabled && !settings.ekqr_api_key_preview)
              ) && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Action Required
                </Badge>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${apiKeysSectionOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 pt-4">
          <APIKeysSection ref={apiKeysSectionRef} />
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="min-w-[140px]"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save All Settings'
          )}
        </Button>
      </div>
    </div>
  );
};