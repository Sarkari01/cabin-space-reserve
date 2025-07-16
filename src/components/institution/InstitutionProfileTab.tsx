import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, School, Mail, Phone, Save } from "lucide-react";

interface InstitutionProfileTabProps {
  institution?: any;
}

export function InstitutionProfileTab({ institution }: InstitutionProfileTabProps) {
  const [formData, setFormData] = useState({
    name: institution?.name || "",
    email: institution?.email || "",
    mobile: institution?.mobile || "",
    logo_url: institution?.logo_url || ""
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution?.id) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("institutions")
        .update({
          name: formData.name,
          mobile: formData.mobile,
          logo_url: formData.logo_url
        })
        .eq("id", institution.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return null;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `institution-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    const uploadedUrl = await handleFileUpload(file);
    if (uploadedUrl) {
      handleChange("logo_url", uploadedUrl);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Institution Profile</h2>
        <p className="text-muted-foreground">
          Manage your institution's profile information and settings.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <School className="h-5 w-5" />
              <span>Profile Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Institution Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div>
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => handleChange("mobile", e.target.value)}
                  placeholder="Enter mobile number"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Logo Management */}
        <Card>
          <CardHeader>
            <CardTitle>Institution Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Logo */}
            <div className="flex items-center justify-center">
              <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
                {formData.logo_url ? (
                  <img 
                    src={formData.logo_url} 
                    alt="Institution logo" 
                    className="w-full h-full rounded-lg object-cover"
                  />
                ) : (
                  <School className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Upload Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="flex items-center gap-2 px-3 py-2 border border-input rounded-md cursor-pointer hover:bg-accent transition-colors flex-1 justify-center"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload New Logo"}
                </label>
                {formData.logo_url && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleChange("logo_url", "")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div>
                <Label htmlFor="logo_url">Or enter logo URL</Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => handleChange("logo_url", e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{institution?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Mobile</p>
                <p className="text-sm text-muted-foreground">
                  {institution?.mobile || "Not provided"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <School className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {institution?.status}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}