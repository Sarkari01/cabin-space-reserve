import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MerchantProfile, useMerchantProfile } from "@/hooks/useMerchantProfile";
import { DocumentUpload } from "./DocumentUpload";
import { toast } from "@/hooks/use-toast";

interface BusinessInfoStepProps {
  profile: MerchantProfile | null;
  updateProfile: (updates: Partial<MerchantProfile>, showSuccessToast?: boolean) => Promise<any>;
  onDataChange?: (isValid: boolean) => void;
}

export const BusinessInfoStep = ({ profile, updateProfile, onDataChange }: BusinessInfoStepProps) => {
  const { uploadDocument } = useMerchantProfile();
  const [formData, setFormData] = useState({
    phone: profile?.phone || '',
    business_address: profile?.business_address || '',
    trade_license_number: profile?.trade_license_number || '',
  });

  // Debounced auto-save
  const debouncedSave = useCallback(
    debounce(async (data: typeof formData) => {
      try {
        await updateProfile(data, false); // Silent auto-save
      } catch (error) {
        console.error('Error auto-saving business info:', error);
      }
    }, 1000),
    [updateProfile]
  );

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Auto-save with debouncing
    debouncedSave(newData);
    
    // Notify parent of validation status
    if (onDataChange) {
      const isValid = !!(newData.phone?.trim() && newData.business_address?.trim() && isValidPhone(newData.phone.trim()));
      onDataChange(isValid);
    }
  };

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        phone: profile.phone || '',
        business_address: profile.business_address || '',
        trade_license_number: profile.trade_license_number || '',
      });
    }
  }, [profile]);

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
    if (!phone) return false;
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(cleanPhone);
  };

  // Debounce utility function
  function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
  }

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
            className={!isValidPhone(formData.phone.trim()) && formData.phone ? 'border-destructive' : ''}
          />
          {!isValidPhone(formData.phone.trim()) && formData.phone && (
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

    </div>
  );
};