import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { ResponsiveTable } from "@/components/ResponsiveTable";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  School, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  ToggleLeft, 
  ToggleRight,
  Newspaper,
  UserPlus
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { InstitutionModal } from "./InstitutionModal";
import { InstitutionDetailModal } from "./InstitutionDetailModal";
import { useQuery } from "@tanstack/react-query";

export const InstitutionsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null);
  const [institutionModalOpen, setInstitutionModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const { toast } = useToast();

  // Fetch institutions
  const { data: institutions = [], isLoading, refetch } = useQuery({
    queryKey: ["institutions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institutions")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch institution news counts
  const { data: newsCounts = {} } = useQuery({
    queryKey: ["institution-news-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_posts")
        .select("institution_id")
        .not("institution_id", "is", null);
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(news => {
        if (news.institution_id) {
          counts[news.institution_id] = (counts[news.institution_id] || 0) + 1;
        }
      });
      return counts;
    }
  });

  const filteredInstitutions = institutions.filter(institution =>
    institution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    institution.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateInstitution = () => {
    setSelectedInstitution(null);
    setModalMode("create");
    setInstitutionModalOpen(true);
  };

  const handleEditInstitution = (institution: any) => {
    setSelectedInstitution(institution);
    setModalMode("edit");
    setInstitutionModalOpen(true);
  };

  const handleViewInstitution = (institution: any) => {
    setSelectedInstitution(institution);
    setDetailModalOpen(true);
  };

  const handleToggleStatus = async (institutionId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    
    try {
      const { error } = await supabase
        .from("institutions")
        .update({ status: newStatus })
        .eq("id", institutionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Institution ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update institution status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success text-success-foreground";
      case "inactive":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const tableColumns = [
    {
      key: "name",
      title: "Institution",
      render: (value: any, institution: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            {institution.logo_url ? (
              <img 
                src={institution.logo_url} 
                alt={institution.name}
                className="w-8 h-8 rounded object-cover"
              />
            ) : (
              <School className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <div className="font-medium">{institution.name}</div>
            <div className="text-sm text-muted-foreground">{institution.email}</div>
          </div>
        </div>
      )
    },
    {
      key: "mobile",
      title: "Contact",
      render: (value: any, institution: any) => (
        <div className="text-sm">{institution.mobile || "Not provided"}</div>
      ),
      mobileHidden: true
    },
    {
      key: "news_count",
      title: "News Posts",
      render: (value: any, institution: any) => (
        <div className="flex items-center space-x-1">
          <Newspaper className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{newsCounts[institution.id] || 0}</span>
        </div>
      )
    },
    {
      key: "status",
      title: "Status",
      render: (value: any, institution: any) => (
        <Badge className={`${getStatusColor(institution.status)} text-xs`}>
          {institution.status}
        </Badge>
      )
    },
    {
      key: "created_at",
      title: "Created",
      render: (value: any, institution: any) => (
        <div className="text-sm">
          {new Date(institution.created_at).toLocaleDateString()}
        </div>
      ),
      mobileHidden: true
    },
    {
      key: "actions",
      title: "Actions",
      render: (value: any, institution: any) => (
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewInstitution(institution)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditInstitution(institution)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                {institution.status === "active" ? (
                  <ToggleLeft className="h-4 w-4" />
                ) : (
                  <ToggleRight className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {institution.status === "active" ? "Deactivate" : "Activate"} Institution
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to {institution.status === "active" ? "deactivate" : "activate"} {institution.name}?
                  {institution.status === "active" ? " This will prevent them from posting news." : " This will allow them to post news again."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleToggleStatus(institution.id, institution.status)}
                >
                  {institution.status === "active" ? "Deactivate" : "Activate"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institution Management"
        description="Manage institutions that can post news on the platform"
        breadcrumbs={[
          { label: "Dashboard", href: "#", onClick: () => {} },
          { label: "Institution Management", active: true }
        ]}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Institutions</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{institutions.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Institutions</CardTitle>
            <School className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {institutions.filter(i => i.status === "active").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total News Posts</CardTitle>
            <Newspaper className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Object.values(newsCounts).reduce((sum, count) => sum + count, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {institutions.filter(i => i.status === "inactive").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Institutions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Institutions</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search institutions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
              <Button onClick={handleCreateInstitution}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Institution
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={filteredInstitutions}
            columns={tableColumns}
            loading={isLoading}
            emptyMessage="No institutions found"
          />
        </CardContent>
      </Card>

      {/* Institution Modal */}
      <InstitutionModal
        institution={selectedInstitution}
        open={institutionModalOpen}
        onOpenChange={setInstitutionModalOpen}
        mode={modalMode}
        onSuccess={() => {
          refetch();
          setInstitutionModalOpen(false);
        }}
      />

      {/* Institution Detail Modal */}
      {selectedInstitution && (
        <InstitutionDetailModal
          institution={selectedInstitution}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          newsCount={newsCounts[selectedInstitution.id] || 0}
        />
      )}
    </div>
  );
};