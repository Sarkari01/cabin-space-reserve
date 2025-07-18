
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MerchantProfile } from "@/hooks/useMerchantProfile";

interface BusinessInfoStepProps {
  profile: MerchantProfile | null;
  updateProfile: (updates: Partial<MerchantProfile>) => Promise<any>;
  onDataChange: (isValid: boolean) => void;
}

export const BusinessInfoStep = ({ profile, updateProfile, onDataChange }: BusinessInfoStepProps) => {
  const [formData, setFormData] = useState({
    phone: profile?.phone || "",
    business_address: profile?.business_address || "",
    business_email: profile?.business_email || "",
  });

  console.log('BusinessInfoStep: Rendering with profile:', profile);

  const validateForm = () => {
    const isValid = !!(formData.phone?.trim() && formData.business_address?.trim());
    onDataChange(isValid);
    return isValid;
  };

  useEffect(() => {
    validateForm();
  }, [formData]);

  const handleChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Auto-save after a short delay
    const timeoutId = setTimeout(() => {
      updateProfile({ [field]: value });
    }, 1000);

    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="business_email">Business Email</Label>
          <Input
            id="business_email"
            type="email"
            placeholder="Enter your business email"
            value={formData.business_email}
            onChange={(e) => handleChange('business_email', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="business_address">Business Address *</Label>
        <Textarea
          id="business_address"
          placeholder="Enter your complete business address"
          value={formData.business_address}
          onChange={(e) => handleChange('business_address', e.target.value)}
          rows={3}
        />
      </div>

      <div className="text-sm text-muted-foreground">
        <p>* Required fields</p>
      </div>
    </div>
  );
};
