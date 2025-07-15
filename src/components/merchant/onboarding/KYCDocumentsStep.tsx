import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MerchantProfile, useMerchantProfile } from "@/hooks/useMerchantProfile";
import { DocumentUpload } from "./DocumentUpload";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface KYCDocumentsStepProps {
  profile: MerchantProfile | null;
  updateProfile: (updates: Partial<MerchantProfile>) => Promise<any>;
  onDataChange?: (isValid: boolean) => void;
}

export const KYCDocumentsStep = ({ profile, updateProfile, onDataChange }: KYCDocumentsStepProps) => {
  const { uploadDocument } = useMerchantProfile();
  const [formData, setFormData] = useState({
    gstin_pan: profile?.gstin_pan || '',
    business_email: profile?.business_email || '',
  });

  // Debounced auto-save
  const debouncedSave = useCallback(
    debounce(async (data: typeof formData) => {
      try {
        await updateProfile(data);
      } catch (error) {
        console.error('Error auto-saving KYC details:', error);
      }
    }, 1000),
    [updateProfile]
  );

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Auto-save with debouncing
    debouncedSave(newData);
    
    // Notify parent that this step is always valid (optional)
    if (onDataChange) {
      onDataChange(true);
    }
  };

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        gstin_pan: profile.gstin_pan || '',
        business_email: profile.business_email || '',
      });
    }
  }, [profile]);

  const handleDocumentUpload = async (file: File) => {
    try {
      await uploadDocument(file, 'kyc_document');
      toast({
        title: "Document uploaded successfully",
        description: "Your KYC document has been uploaded and saved.",
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload KYC document.",
        variant: "destructive",
      });
    }
  };

  // Validate GSTIN
  const isValidGSTIN = (gstin: string) => {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin.toUpperCase());
  };

  // Validate PAN
  const isValidPAN = (pan: string) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
  };

  // Validate email
  const isValidEmail = (email: string) => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
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
      <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Optional Step
          </Badge>
        </div>
        <p className="text-sm text-green-800 dark:text-green-200">
          This step is optional but recommended for faster verification and enhanced trust with customers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="gstin_pan" className="text-sm font-medium">
            GSTIN or PAN Number
          </Label>
          <Input
            id="gstin_pan"
            placeholder="Enter GSTIN (22AAAAA0000A1Z5) or PAN (AAAAA0000A)"
            value={formData.gstin_pan}
            onChange={(e) => handleInputChange('gstin_pan', e.target.value.toUpperCase())}
            className={
              formData.gstin_pan && 
              !isValidGSTIN(formData.gstin_pan) && 
              !isValidPAN(formData.gstin_pan) ? 'border-destructive' : ''
            }
          />
          {formData.gstin_pan && !isValidGSTIN(formData.gstin_pan) && !isValidPAN(formData.gstin_pan) && (
            <p className="text-sm text-destructive">
              Please enter a valid GSTIN (15 digits) or PAN (10 characters)
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="business_email" className="text-sm font-medium">
            Business Email
          </Label>
          <Input
            id="business_email"
            type="email"
            placeholder="Enter business email address"
            value={formData.business_email}
            onChange={(e) => handleInputChange('business_email', e.target.value)}
            className={!isValidEmail(formData.business_email) && formData.business_email ? 'border-destructive' : ''}
          />
          {!isValidEmail(formData.business_email) && formData.business_email && (
            <p className="text-sm text-destructive">Please enter a valid email address</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Additional KYC Documents
        </Label>
        <DocumentUpload
          onUpload={handleDocumentUpload}
          acceptedTypes={['image/*', 'application/pdf']}
          maxSize={2 * 1024 * 1024} // 2MB
          multiple={true}
        />
        <p className="text-xs text-muted-foreground">
          Upload additional identity or business documents (PDF, JPG, PNG - max 2MB each)
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Recommended Documents:</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Aadhaar Card or Passport</li>
          <li>• Voter ID or Driving License</li>
          <li>• Business Registration Certificate</li>
          <li>• Shop & Establishment License</li>
        </ul>
      </div>

    </div>
  );
};