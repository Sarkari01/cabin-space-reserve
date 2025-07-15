import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { 
  Eye, 
  Check, 
  X, 
  Search, 
  Building, 
  CreditCard, 
  FileText,
  Download,
  Phone,
  MapPin,
  Mail,
  Hash
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MerchantProfile {
  id: string;
  merchant_id: string;
  phone?: string;
  business_address?: string;
  trade_license_number?: string;
  trade_license_document_url?: string;
  account_holder_name?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  gstin_pan?: string;
  business_email?: string;
  is_onboarding_complete: boolean;
  onboarding_step: number;
  verification_status: string;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string;
    email: string;
    merchant_number: number;
  };
}

interface MerchantDocument {
  id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  verification_status: string;
  verification_notes?: string;
  uploaded_at: string;
}

export const MerchantVerificationTab = () => {
  const [merchants, setMerchants] = useState<MerchantProfile[]>([]);
  const [documents, setDocuments] = useState<{ [key: string]: MerchantDocument[] }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantProfile | null>(null);

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const { data, error } = await supabase
        .from('merchant_profiles')
        .select(`
          *,
          profiles!inner(full_name, email, merchant_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMerchants(data || []);

      // Fetch documents for all merchants
      if (data?.length) {
        const { data: docsData, error: docsError } = await supabase
          .from('merchant_documents')
          .select('*')
          .in('merchant_profile_id', data.map(m => m.id));

        if (!docsError && docsData) {
          const groupedDocs = docsData.reduce((acc, doc) => {
            if (!acc[doc.merchant_profile_id]) {
              acc[doc.merchant_profile_id] = [];
            }
            acc[doc.merchant_profile_id].push(doc);
            return acc;
          }, {} as { [key: string]: MerchantDocument[] });
          
          setDocuments(groupedDocs);
        }
      }
    } catch (error) {
      console.error('Error fetching merchants:', error);
      toast({
        title: "Error",
        description: "Failed to load merchant profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateVerificationStatus = async (merchantId: string, status: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('merchant_profiles')
        .update({ 
          verification_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', merchantId);

      if (error) throw error;

      await fetchMerchants();
      toast({
        title: "Success",
        description: `Merchant verification status updated to ${status}`,
      });
    } catch (error) {
      console.error('Error updating verification status:', error);
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      });
    }
  };

  const updateDocumentStatus = async (documentId: string, status: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('merchant_documents')
        .update({ 
          verification_status: status,
          verification_notes: notes,
        })
        .eq('id', documentId);

      if (error) throw error;

      await fetchMerchants();
      toast({
        title: "Success",
        description: `Document status updated to ${status}`,
      });
    } catch (error) {
      console.error('Error updating document status:', error);
      toast({
        title: "Error",
        description: "Failed to update document status",
        variant: "destructive",
      });
    }
  };

  const filteredMerchants = merchants.filter(merchant => {
    const matchesSearch = 
      merchant.profiles.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.profiles.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.trade_license_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || merchant.verification_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Rejected</Badge>;
      case 'under_review':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Under Review</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search merchants by name, email, or license..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6">
        {filteredMerchants.map((merchant) => (
          <Card key={merchant.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {merchant.profiles.full_name || 'Unnamed Merchant'}
                    <span className="text-sm font-normal text-muted-foreground">
                      #{merchant.profiles.merchant_number}
                    </span>
                  </CardTitle>
                  <CardDescription>{merchant.profiles.email}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(merchant.verification_status)}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedMerchant(merchant)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Merchant Profile Review</DialogTitle>
                        <DialogDescription>
                          Review and verify merchant information and documents
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedMerchant && (
                        <MerchantDetailView 
                          merchant={selectedMerchant}
                          documents={documents[selectedMerchant.id] || []}
                          onUpdateStatus={updateVerificationStatus}
                          onUpdateDocumentStatus={updateDocumentStatus}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {merchant.phone || 'Not provided'}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {merchant.business_address ? 
                      (merchant.business_address.length > 50 ? 
                        merchant.business_address.substring(0, 50) + '...' : 
                        merchant.business_address
                      ) : 'Not provided'
                    }
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    License: {merchant.trade_license_number || 'Not provided'}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    Bank: {merchant.bank_name || 'Not provided'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-muted-foreground">
                    Onboarding: {merchant.is_onboarding_complete ? 'Complete' : `Step ${merchant.onboarding_step}/3`}
                  </div>
                  <div className="text-muted-foreground">
                    Documents: {documents[merchant.id]?.length || 0} uploaded
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredMerchants.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No merchants found</p>
              <p className="text-muted-foreground">Try adjusting your search criteria</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const MerchantDetailView = ({ 
  merchant, 
  documents, 
  onUpdateStatus, 
  onUpdateDocumentStatus 
}: {
  merchant: MerchantProfile;
  documents: MerchantDocument[];
  onUpdateStatus: (id: string, status: string, notes?: string) => void;
  onUpdateDocumentStatus: (id: string, status: string, notes?: string) => void;
}) => {
  const [verificationNotes, setVerificationNotes] = useState("");

  return (
    <div className="space-y-6">
      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Phone</label>
            <p>{merchant.phone || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Trade License</label>
            <p>{merchant.trade_license_number || 'Not provided'}</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Business Address</label>
            <p>{merchant.business_address || 'Not provided'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Bank Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Account Holder</label>
            <p>{merchant.account_holder_name || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
            <p>{merchant.bank_name || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Account Number</label>
            <p>{merchant.account_number || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">IFSC Code</label>
            <p>{merchant.ifsc_code || 'Not provided'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Uploaded Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium capitalize">{doc.document_type.replace('_', ' ')}</p>
                    <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(doc.verification_status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateDocumentStatus(doc.id, 'approved')}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateDocumentStatus(doc.id, 'rejected')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No documents uploaded</p>
          )}
        </CardContent>
      </Card>

      {/* Verification Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Decision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Add verification notes (optional)"
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => onUpdateStatus(merchant.id, 'approved', verificationNotes)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              onClick={() => onUpdateStatus(merchant.id, 'rejected', verificationNotes)}
              variant="destructive"
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => onUpdateStatus(merchant.id, 'under_review', verificationNotes)}
              variant="outline"
            >
              Under Review
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Approved</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Rejected</Badge>;
    case 'under_review':
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Under Review</Badge>;
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
};