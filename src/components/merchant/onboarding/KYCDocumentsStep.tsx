
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Check } from "lucide-react";
import { MerchantProfile, useMerchantProfile } from "@/hooks/useMerchantProfile";
import { toast } from "@/hooks/use-toast";

interface KYCDocumentsStepProps {
  profile: MerchantProfile | null;
  updateProfile: (updates: Partial<MerchantProfile>) => Promise<any>;
  onDataChange: (isValid: boolean) => void;
}

export const KYCDocumentsStep = ({ profile, updateProfile, onDataChange }: KYCDocumentsStepProps) => {
  const { uploadDocument, documents } = useMerchantProfile();
  const [uploading, setUploading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    gstin_pan: profile?.gstin_pan || "",
    trade_license_number: profile?.trade_license_number || "",
  });

  console.log('KYCDocumentsStep: Rendering with profile:', profile, 'documents:', documents);

  useEffect(() => {
    // This step is optional, so always mark as valid
    onDataChange(true);
  }, []);

  const handleChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Auto-save after a short delay
    const timeoutId = setTimeout(() => {
      updateProfile({ [field]: value });
    }, 1000);

    return () => clearTimeout(timeoutId);
  };

  const handleFileUpload = async (file: File, documentType: string) => {
    if (!file) return;

    setUploading(documentType);
    try {
      await uploadDocument(file, documentType);
      toast({
        title: "Upload Successful",
        description: `${documentType} has been uploaded successfully.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const getDocumentStatus = (docType: string) => {
    return documents?.find(doc => doc.document_type === docType);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="gstin_pan">GSTIN/PAN Number</Label>
          <Input
            id="gstin_pan"
            placeholder="Enter GSTIN or PAN number"
            value={formData.gstin_pan}
            onChange={(e) => handleChange('gstin_pan', e.target.value.toUpperCase())}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="trade_license_number">Trade License Number</Label>
          <Input
            id="trade_license_number"
            placeholder="Enter trade license number"
            value={formData.trade_license_number}
            onChange={(e) => handleChange('trade_license_number', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Document Uploads (Optional)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { type: 'trade_license', label: 'Trade License' },
            { type: 'gst_certificate', label: 'GST Certificate' },
            { type: 'pan_card', label: 'PAN Card' },
            { type: 'address_proof', label: 'Address Proof' }
          ].map(({ type, label }) => {
            const docStatus = getDocumentStatus(type);
            const isUploaded = !!docStatus;
            const isUploading = uploading === type;

            return (
              <div key={type} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{label}</Label>
                  {isUploaded && <Check className="h-4 w-4 text-green-500" />}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.pdf,.jpg,.jpeg,.png';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleFileUpload(file, type);
                      };
                      input.click();
                    }}
                  >
                    {isUploading ? (
                      <>Uploading...</>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploaded ? 'Replace' : 'Upload'}
                      </>
                    )}
                  </Button>
                  
                  {isUploaded && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <FileText className="h-4 w-4" />
                      <span>Uploaded</span>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Accepted formats: PDF, JPG, PNG (Max 5MB)
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>Document uploads are optional but recommended for faster verification.</p>
        <p>You can complete this step later from your dashboard if needed.</p>
      </div>
    </div>
  );
};
