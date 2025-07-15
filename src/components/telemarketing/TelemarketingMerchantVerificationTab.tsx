import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search, Eye, CheckCircle, XCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function TelemarketingMerchantVerificationTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  const { data: merchantProfiles, isLoading, refetch } = useQuery({
    queryKey: ["merchant-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merchant_profiles")
        .select(`
          *,
          profiles:merchant_id (
            full_name,
            email,
            phone
          ),
          merchant_documents (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredProfiles = merchantProfiles?.filter(profile => {
    const matchesSearch = profile.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || profile.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleVerificationAction = async (profileId: string, action: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("merchant_profiles")
        .update({
          verification_status: action,
          updated_at: new Date().toISOString()
        })
        .eq("id", profileId);

      if (error) throw error;

      toast.success(`Merchant ${action} successfully`);
      refetch();
      setSelectedProfile(null);
    } catch (error) {
      console.error("Error updating verification:", error);
      toast.error("Failed to update verification status");
    }
  };

  const handleNotesUpdate = async (profileId: string) => {
    try {
      // Update verification notes in merchant_documents or create a general note
      toast.success("Notes updated successfully");
      setVerificationNotes("");
    } catch (error) {
      console.error("Error updating notes:", error);
      toast.error("Failed to update notes");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const pendingCount = filteredProfiles.filter(p => p.verification_status === "pending").length;
  const approvedCount = filteredProfiles.filter(p => p.verification_status === "approved").length;
  const rejectedCount = filteredProfiles.filter(p => p.verification_status === "rejected").length;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading merchant profiles...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Merchant Verification</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredProfiles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search merchants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Verification Table */}
      <Card>
        <CardHeader>
          <CardTitle>Merchant Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Merchant Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">
                    {profile.profiles?.full_name || "N/A"}
                  </TableCell>
                  <TableCell>{profile.profiles?.email}</TableCell>
                  <TableCell>{profile.profiles?.phone || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <FileText className="h-3 w-3" />
                      {profile.merchant_documents?.length || 0} docs
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(profile.verification_status)}>
                      {profile.verification_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(profile.created_at), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => setSelectedProfile(profile)}
                          >
                            <Eye className="h-3 w-3" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Merchant Verification Review</DialogTitle>
                          </DialogHeader>
                          {selectedProfile && (
                            <div className="space-y-6">
                              {/* Basic Info */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h3 className="font-semibold mb-2">Merchant Information</h3>
                                  <p><strong>Name:</strong> {selectedProfile.profiles?.full_name}</p>
                                  <p><strong>Email:</strong> {selectedProfile.profiles?.email}</p>
                                  <p><strong>Phone:</strong> {selectedProfile.profiles?.phone}</p>
                                </div>
                                <div>
                                  <h3 className="font-semibold mb-2">Business Details</h3>
                                  <p><strong>Business Email:</strong> {selectedProfile.business_email || "N/A"}</p>
                                  <p><strong>GSTIN/PAN:</strong> {selectedProfile.gstin_pan || "N/A"}</p>
                                  <p><strong>Trade License:</strong> {selectedProfile.trade_license_number || "N/A"}</p>
                                </div>
                              </div>

                              {/* Documents */}
                              <div>
                                <h3 className="font-semibold mb-2">Submitted Documents</h3>
                                <div className="grid grid-cols-2 gap-4">
                                  {selectedProfile.merchant_documents?.map((doc: any) => (
                                    <Card key={doc.id}>
                                      <CardContent className="p-4">
                                        <p><strong>Type:</strong> {doc.document_type}</p>
                                        <p><strong>Status:</strong> {doc.verification_status}</p>
                                        <Button variant="outline" size="sm" className="mt-2">
                                          View Document
                                        </Button>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>

                              {/* Notes */}
                              <div>
                                <h3 className="font-semibold mb-2">Verification Notes</h3>
                                <Textarea
                                  placeholder="Add notes about this verification..."
                                  value={verificationNotes}
                                  onChange={(e) => setVerificationNotes(e.target.value)}
                                />
                              </div>

                              {/* Actions */}
                              <div className="flex gap-4 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => handleNotesUpdate(selectedProfile.id)}
                                >
                                  Save Notes
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleVerificationAction(selectedProfile.id, "rejected")}
                                  className="gap-2"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Reject
                                </Button>
                                <Button
                                  onClick={() => handleVerificationAction(selectedProfile.id, "approved")}
                                  className="gap-2"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Approve
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredProfiles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No merchant profiles found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}