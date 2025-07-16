import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X } from "lucide-react";

interface InstitutionModalProps {
  institution?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  onSuccess: () => void;
}

export function InstitutionModal({ 
  institution, 
  open, 
  onOpenChange, 
  mode, 
  onSuccess 
}: InstitutionModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    logo_url: "",
    status: "active"
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendInvitation, setSendInvitation] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (institution && mode === "edit") {
      setFormData({
        name: institution.name || "",
        email: institution.email || "",
        mobile: institution.mobile || "",
        logo_url: institution.logo_url || "",
        status: institution.status || "active"
      });
    } else {
      setFormData({
        name: "",
        email: "",
        mobile: "",
        logo_url: "",
        status: "active"
      });
    }
  }, [institution, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "edit" && institution) {
        // Update existing institution
        const { error } = await supabase
          .from("institutions")
          .update({
            name: formData.name,
            email: formData.email,
            mobile: formData.mobile,
            logo_url: formData.logo_url,
            status: formData.status
          })
          .eq("id", institution.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Institution updated successfully",
        });
      } else {
        // Create new institution with authentication
        const temporaryPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        
        // Create the auth user
        const { data: authData, error: authError } = await supabase.functions.invoke('admin-create-user', {
          body: {
            email: formData.email,
            password: temporaryPassword,
            user_metadata: {
              full_name: formData.name,
              phone: formData.mobile,
              role: 'institution'
            }
          }
        });

        if (authError) throw authError;

        // Create institution record
        const { error: institutionError } = await supabase
          .from("institutions")
          .insert({
            name: formData.name,
            email: formData.email,
            mobile: formData.mobile,
            logo_url: formData.logo_url,
            status: formData.status,
            auth_user_id: authData.user.id
          });

        if (institutionError) throw institutionError;

        // Create profile for the institution user
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.name,
            phone: formData.mobile,
            role: 'institution'
          });

        if (profileError) {
          console.warn("Profile creation warning:", profileError);
        }

        if (sendInvitation) {
          // Send invitation email (you can implement this with your email service)
          toast({
            title: "Institution Created",
            description: `Institution created successfully. Login credentials - Email: ${formData.email}, Password: ${temporaryPassword}`,
          });
        } else {
          toast({
            title: "Success",
            description: "Institution created successfully",
          });
        }
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save institution",
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Institution" : "Create New Institution"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Institution Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              placeholder="Enter institution name"
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              placeholder="Enter email address"
              disabled={mode === "edit"}
            />
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

          <div>
            <Label>Institution Logo</Label>
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
                  className="flex items-center gap-2 px-3 py-2 border border-input rounded-md cursor-pointer hover:bg-accent transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload Logo"}
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

              {formData.logo_url && (
                <div className="flex items-center space-x-2">
                  <img 
                    src={formData.logo_url} 
                    alt="Logo preview" 
                    className="w-12 h-12 rounded object-cover"
                  />
                  <span className="text-sm text-muted-foreground">Logo uploaded</span>
                </div>
              )}

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
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "create" && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="send-invitation"
                checked={sendInvitation}
                onChange={(e) => setSendInvitation(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="send-invitation" className="text-sm">
                Show login credentials in success message
              </Label>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || uploading} 
              className="flex-1"
            >
              {loading ? "Saving..." : (mode === "edit" ? "Update" : "Create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}