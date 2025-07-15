import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MerchantProfile } from "@/hooks/useMerchantProfile";
import { Shield } from "lucide-react";

interface BankDetailsStepProps {
  profile: MerchantProfile | null;
  updateProfile: (updates: Partial<MerchantProfile>) => Promise<any>;
}

export const BankDetailsStep = ({ profile, updateProfile }: BankDetailsStepProps) => {
  const [formData, setFormData] = useState({
    account_holder_name: profile?.account_holder_name || '',
    bank_name: profile?.bank_name || '',
    account_number: profile?.account_number || '',
    ifsc_code: profile?.ifsc_code || '',
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
      console.error('Error saving bank details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validate IFSC code
  const isValidIFSC = (ifsc: string) => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifsc.toUpperCase());
  };

  // Validate account number
  const isValidAccountNumber = (accountNumber: string) => {
    return /^\d{9,18}$/.test(accountNumber);
  };

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

      <Button 
        onClick={handleSave} 
        disabled={loading}
        className="w-full md:w-auto"
      >
        {loading ? "Saving..." : "Save Bank Details"}
      </Button>
    </div>
  );
};