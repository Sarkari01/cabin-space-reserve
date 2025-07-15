import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MerchantProfile } from "@/hooks/useMerchantProfile";
import { Shield } from "lucide-react";

interface BankDetailsStepProps {
  profile: MerchantProfile | null;
  updateProfile: (updates: Partial<MerchantProfile>) => Promise<any>;
  onDataChange?: (isValid: boolean) => void;
}

export const BankDetailsStep = ({ profile, updateProfile, onDataChange }: BankDetailsStepProps) => {
  const [formData, setFormData] = useState({
    account_holder_name: profile?.account_holder_name || '',
    bank_name: profile?.bank_name || '',
    account_number: profile?.account_number || '',
    ifsc_code: profile?.ifsc_code || '',
  });

  // Debounced auto-save
  const debouncedSave = useCallback(
    debounce(async (data: typeof formData) => {
      try {
        await updateProfile(data);
      } catch (error) {
        console.error('Error auto-saving bank details:', error);
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
      const isValid = !!(
        newData.account_holder_name?.trim() && 
        newData.bank_name?.trim() && 
        newData.account_number?.trim() && 
        newData.ifsc_code?.trim() &&
        isValidAccountNumber(newData.account_number.trim()) &&
        isValidIFSC(newData.ifsc_code.trim())
      );
      onDataChange(isValid);
    }
  };

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        account_holder_name: profile.account_holder_name || '',
        bank_name: profile.bank_name || '',
        account_number: profile.account_number || '',
        ifsc_code: profile.ifsc_code || '',
      });
    }
  }, [profile]);

  // Validate IFSC code
  const isValidIFSC = (ifsc: string) => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifsc.toUpperCase());
  };

  // Validate account number
  const isValidAccountNumber = (accountNumber: string) => {
    if (!accountNumber) return false;
    const cleanAccount = accountNumber.trim().replace(/\D/g, '');
    return /^\d{9,18}$/.test(cleanAccount);
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
      <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Your banking information is encrypted and secure. We use this for payment processing only.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="account_holder_name" className="text-sm font-medium">
            Account Holder Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="account_holder_name"
            placeholder="Enter account holder name"
            value={formData.account_holder_name}
            onChange={(e) => handleInputChange('account_holder_name', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank_name" className="text-sm font-medium">
            Bank Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="bank_name"
            placeholder="Enter bank name"
            value={formData.bank_name}
            onChange={(e) => handleInputChange('bank_name', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account_number" className="text-sm font-medium">
            Account Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="account_number"
            type="number"
            placeholder="Enter account number"
            value={formData.account_number}
            onChange={(e) => handleInputChange('account_number', e.target.value)}
            className={!isValidAccountNumber(formData.account_number) && formData.account_number ? 'border-destructive' : ''}
          />
          {!isValidAccountNumber(formData.account_number) && formData.account_number && (
            <p className="text-sm text-destructive">Account number should be 9-18 digits</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ifsc_code" className="text-sm font-medium">
            IFSC Code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="ifsc_code"
            placeholder="Enter IFSC code"
            value={formData.ifsc_code}
            onChange={(e) => handleInputChange('ifsc_code', e.target.value.toUpperCase())}
            className={!isValidIFSC(formData.ifsc_code) && formData.ifsc_code ? 'border-destructive' : ''}
          />
          {!isValidIFSC(formData.ifsc_code) && formData.ifsc_code && (
            <p className="text-sm text-destructive">Please enter a valid IFSC code (e.g., SBIN0123456)</p>
          )}
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How to find your IFSC Code:</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Check your bank passbook or checkbook</li>
          <li>• Use your bank's website or mobile app</li>
          <li>• Search online with your bank name and branch</li>
        </ul>
      </div>

    </div>
  );
};