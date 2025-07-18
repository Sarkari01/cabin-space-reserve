
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MerchantProfile } from "@/hooks/useMerchantProfile";

interface BankDetailsStepProps {
  profile: MerchantProfile | null;
  updateProfile: (updates: Partial<MerchantProfile>) => Promise<any>;
  onDataChange: (isValid: boolean) => void;
}

export const BankDetailsStep = ({ profile, updateProfile, onDataChange }: BankDetailsStepProps) => {
  const [formData, setFormData] = useState({
    account_holder_name: profile?.account_holder_name || "",
    bank_name: profile?.bank_name || "",
    account_number: profile?.account_number || "",
    ifsc_code: profile?.ifsc_code || "",
  });

  console.log('BankDetailsStep: Rendering with profile:', profile);

  const validateForm = () => {
    const isValid = !!(
      formData.account_holder_name?.trim() && 
      formData.bank_name?.trim() && 
      formData.account_number?.trim() && 
      formData.ifsc_code?.trim()
    );
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
          <Label htmlFor="account_holder_name">Account Holder Name *</Label>
          <Input
            id="account_holder_name"
            placeholder="Enter account holder name"
            value={formData.account_holder_name}
            onChange={(e) => handleChange('account_holder_name', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank_name">Bank Name *</Label>
          <Input
            id="bank_name"
            placeholder="Enter bank name"
            value={formData.bank_name}
            onChange={(e) => handleChange('bank_name', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="account_number">Account Number *</Label>
          <Input
            id="account_number"
            placeholder="Enter account number"
            value={formData.account_number}
            onChange={(e) => handleChange('account_number', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ifsc_code">IFSC Code *</Label>
          <Input
            id="ifsc_code"
            placeholder="Enter IFSC code"
            value={formData.ifsc_code}
            onChange={(e) => handleChange('ifsc_code', e.target.value.toUpperCase())}
          />
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>* All fields are required for bank verification</p>
        <p>Please ensure all details are accurate as they will be used for payments.</p>
      </div>
    </div>
  );
};
