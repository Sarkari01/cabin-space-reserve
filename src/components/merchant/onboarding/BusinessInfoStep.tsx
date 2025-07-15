import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MerchantProfile, useMerchantProfile } from "@/hooks/useMerchantProfile";
import { DocumentUpload } from "./DocumentUpload";
import { toast } from "@/hooks/use-toast";

interface BusinessInfoStepProps {
  profile: MerchantProfile | null;
  updateProfile: (updates: Partial<MerchantProfile>) => Promise<any>;
}

export const BusinessInfoStep = ({ profile, updateProfile }: BusinessInfoStepProps) => {
  const { uploadDocument } = useMerchantProfile();
  const [formData, setFormData] = useState({
    phone: profile?.phone || '',
    business_address: profile?.business_address || '',
    trade_license_number: profile?.trade_license_number || '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(formData);
    } catch (error) {
      console.error('Error saving business info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (file: File) => {
    try {
      const document = await uploadDocument(file, 'trade_license');
      await updateProfile({
        trade_license_document_url: document.file_url,
      });
      toast({
        title: "Document uploaded successfully",
        description: "Your trade license has been uploaded and saved.",
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload trade license document.",
        variant: "destructive",
      });
    }
  };

  // Validate Indian phone number
  const isValidPhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">
            Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Enter 10-digit mobile number"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={!isValidPhone(formData.phone) && formData.phone ? 'border-destructive' : ''}
          />
          {!isValidPhone(formData.phone) && formData.phone && (
            <p className="text-sm text-destructive">Please enter a valid 10-digit Indian mobile number</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="trade_license_number" className="text-sm font-medium">
            Trade License Number <span className="text-muted-foreground">(Optional)</span>
          </Label>
          <Input
            id="trade_license_number"
            placeholder="Enter trade license number"
            value={formData.trade_license_number}
            onChange={(e) => handleInputChange('trade_license_number', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="business_address" className="text-sm font-medium">
          Business Address <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="business_address"
          placeholder="Enter complete business address"
          value={formData.business_address}
          onChange={(e) => handleInputChange('business_address', e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Trade License Document <span className="text-muted-foreground">(Optional)</span>
        </Label>
        <DocumentUpload
          onUpload={handleDocumentUpload}
          existingUrl={profile?.trade_license_document_url}
          acceptedTypes={['image/*', 'application/pdf']}
          maxSize={2 * 1024 * 1024} // 2MB
        />
        <p className="text-xs text-muted-foreground">
          Upload your trade license document if available (PDF, JPG, PNG - max 2MB)
        </p>
      </div>

      <Button 
        onClick={handleSave} 
        disabled={loading}
        className="w-full md:w-auto"
      >
        {loading ? "Saving..." : "Save Business Information"}
      </Button>
    </div>
  );
};