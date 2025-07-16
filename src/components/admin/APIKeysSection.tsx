import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  Loader2,
  TestTube
} from "lucide-react";

interface APIKeyData {
  google_maps_api_key_preview?: string;
  razorpay_key_id_preview?: string;
  razorpay_key_secret_preview?: string;
  ekqr_api_key_preview?: string;
  gemini_api_key_preview?: string;
}

interface APIKeyFormData {
  google_maps_api_key: string;
  razorpay_key_id: string;
  razorpay_key_secret: string;
  ekqr_api_key: string;
  gemini_api_key: string;
}

export interface APIKeysSectionRef {
  saveAPIKeys: () => Promise<boolean>;
}

export const APIKeysSection = forwardRef<APIKeysSectionRef>((_, ref) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<APIKeyFormData>({
    google_maps_api_key: '',
    razorpay_key_id: '',
    razorpay_key_secret: '',
    ekqr_api_key: '',
    gemini_api_key: '',
  });
  const [previews, setPreviews] = useState<APIKeyData>({});
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchAPIKeys();
  }, []);

  const fetchAPIKeys = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-api-keys', {
        body: { operation: 'get' }
      });

      if (error) throw error;

      if (data.success) {
        setPreviews(data.data);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        title: "Error",
        description: "Failed to fetch API key previews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (): Promise<boolean> => {
    try {
      // Only send non-empty values
      const updates: Partial<APIKeyFormData> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value.trim()) {
          updates[key as keyof APIKeyFormData] = value.trim();
        }
      });

      if (Object.keys(updates).length === 0) {
        return true; // No changes to save
      }

      const { data, error } = await supabase.functions.invoke('manage-api-keys', {
        body: { 
          operation: 'save',
          data: updates
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: `Updated ${data.updated_keys.length} API key(s)`,
        });
        
        // Clear form and refresh previews
        setFormData({
          google_maps_api_key: '',
          razorpay_key_id: '',
          razorpay_key_secret: '',
          ekqr_api_key: '',
          gemini_api_key: '',
        });
        await fetchAPIKeys();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast({
        title: "Error",
        description: "Failed to save API keys",
        variant: "destructive",
      });
      return false;
    }
  };

  useImperativeHandle(ref, () => ({
    saveAPIKeys: handleSave
  }));

  const testAPIKey = async (keyType: string) => {
    setTesting(prev => ({ ...prev, [keyType]: true }));
    try {
      let keyValue;
      
      switch (keyType) {
        case 'google_maps':
          keyValue = formData.google_maps_api_key;
          break;
        case 'razorpay':
          keyValue = {
            key_id: formData.razorpay_key_id,
            key_secret: formData.razorpay_key_secret
          };
          break;
        case 'ekqr':
          keyValue = formData.ekqr_api_key;
          break;
        case 'gemini':
          keyValue = formData.gemini_api_key;
          break;
        default:
          throw new Error('Invalid key type');
      }

      const { data, error } = await supabase.functions.invoke('manage-api-keys', {
        body: { 
          operation: 'test',
          test_config: { key_type: keyType, key_value: keyValue }
        }
      });

      if (error) throw error;

      if (data.success) {
        setTestResults(prev => ({ ...prev, [keyType]: data.test_result }));
        toast({
          title: data.test_result.status === 'valid' ? "Success" : "Test Failed",
          description: data.test_result.message,
          variant: data.test_result.status === 'valid' ? "default" : "destructive",
        });
      }
    } catch (error) {
      console.error(`Error testing ${keyType}:`, error);
      toast({
        title: "Error",
        description: `Failed to test ${keyType} API key`,
        variant: "destructive",
      });
    } finally {
      setTesting(prev => ({ ...prev, [keyType]: false }));
    }
  };

  const toggleShowKey = (keyName: string) => {
    setShowKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const getStatusBadge = (keyName: string) => {
    const testResult = testResults[keyName];
    if (!testResult) return null;

    const variant = testResult.status === 'valid' ? 'default' : 'destructive';
    const icon = testResult.status === 'valid' ? CheckCircle : XCircle;
    const Icon = icon;

    return (
      <Badge 
        variant={variant} 
        className={`flex items-center gap-1 ${testResult.status === 'valid' ? 'bg-green-100 text-green-800 border-green-200' : ''}`}
      >
        <Icon className="h-3 w-3" />
        {testResult.status}
      </Badge>
    );
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
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Keys Management
        </h3>
        <p className="text-sm text-muted-foreground">
          Securely configure API keys for external services
        </p>
      </div>

      <div className="grid gap-6">
        {/* Google Maps API Key */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">Google Maps API Key</CardTitle>
              <CardDescription>
                Required for location services and maps integration
              </CardDescription>
            </div>
            {getStatusBadge('google_maps')}
          </CardHeader>
          <CardContent className="space-y-4">
            {previews.google_maps_api_key_preview && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Key</Label>
                <div className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                  {previews.google_maps_api_key_preview}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="google-maps-key">New Google Maps API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="google-maps-key"
                    type={showKeys.google_maps ? "text" : "password"}
                    value={formData.google_maps_api_key}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      google_maps_api_key: e.target.value 
                    }))}
                    placeholder="AIza..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => toggleShowKey('google_maps')}
                  >
                    {showKeys.google_maps ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testAPIKey('google_maps')}
                  disabled={!formData.google_maps_api_key || testing.google_maps}
                  className="flex items-center gap-2"
                >
                  {testing.google_maps ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                  Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Razorpay Keys */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">Razorpay API Keys</CardTitle>
              <CardDescription>
                Required for online payment processing
              </CardDescription>
            </div>
            {getStatusBadge('razorpay')}
          </CardHeader>
          <CardContent className="space-y-4">
            {(previews.razorpay_key_id_preview || previews.razorpay_key_secret_preview) && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Keys</Label>
                <div className="space-y-1">
                  {previews.razorpay_key_id_preview && (
                    <div className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                      Key ID: {previews.razorpay_key_id_preview}
                    </div>
                  )}
                  {previews.razorpay_key_secret_preview && (
                    <div className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                      Secret: {previews.razorpay_key_secret_preview}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="razorpay-key-id">Razorpay Key ID</Label>
                <div className="relative">
                  <Input
                    id="razorpay-key-id"
                    type={showKeys.razorpay_id ? "text" : "password"}
                    value={formData.razorpay_key_id}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      razorpay_key_id: e.target.value 
                    }))}
                    placeholder="rzp_..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => toggleShowKey('razorpay_id')}
                  >
                    {showKeys.razorpay_id ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="razorpay-secret">Razorpay Secret</Label>
                <div className="relative">
                  <Input
                    id="razorpay-secret"
                    type={showKeys.razorpay_secret ? "text" : "password"}
                    value={formData.razorpay_key_secret}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      razorpay_key_secret: e.target.value 
                    }))}
                    placeholder="Secret key..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => toggleShowKey('razorpay_secret')}
                  >
                    {showKeys.razorpay_secret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => testAPIKey('razorpay')}
                disabled={!formData.razorpay_key_id || !formData.razorpay_key_secret || testing.razorpay}
                className="flex items-center gap-2"
              >
                {testing.razorpay ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
                Test Keys
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* EKQR API Key */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">EKQR API Key</CardTitle>
              <CardDescription>
                Required for QR code payment processing
              </CardDescription>
            </div>
            {getStatusBadge('ekqr')}
          </CardHeader>
          <CardContent className="space-y-4">
            {previews.ekqr_api_key_preview && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Key</Label>
                <div className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                  {previews.ekqr_api_key_preview}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="ekqr-key">New EKQR API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="ekqr-key"
                    type={showKeys.ekqr ? "text" : "password"}
                    value={formData.ekqr_api_key}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      ekqr_api_key: e.target.value 
                    }))}
                    placeholder="Enter EKQR API key..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => toggleShowKey('ekqr')}
                  >
                    {showKeys.ekqr ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testAPIKey('ekqr')}
                  disabled={!formData.ekqr_api_key || testing.ekqr}
                  className="flex items-center gap-2"
                >
                  {testing.ekqr ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                  Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gemini AI API Key */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">Gemini AI API Key</CardTitle>
              <CardDescription>
                Required for AI assistant features and content generation
              </CardDescription>
            </div>
            {getStatusBadge('gemini')}
          </CardHeader>
          <CardContent className="space-y-4">
            {previews.gemini_api_key_preview && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Key</Label>
                <div className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                  {previews.gemini_api_key_preview}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="gemini-key">New Gemini AI API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="gemini-key"
                    type={showKeys.gemini ? "text" : "password"}
                    value={formData.gemini_api_key}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      gemini_api_key: e.target.value 
                    }))}
                    placeholder="Enter Gemini API key..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => toggleShowKey('gemini')}
                  >
                    {showKeys.gemini ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testAPIKey('gemini')}
                  disabled={!formData.gemini_api_key || testing.gemini}
                  className="flex items-center gap-2"
                >
                  {testing.gemini ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                  Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});