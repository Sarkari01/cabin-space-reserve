import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { ResponsiveTable } from "@/components/ResponsiveTable";
import { useToast } from "@/hooks/use-toast";
import { useInstitutions, type Institution } from "@/hooks/useInstitutions";
import { 
  School, 
  Search, 
  Eye, 
  Edit, 
  ToggleLeft, 
  ToggleRight,
  Newspaper,
  UserPlus
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const InstitutionsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [newsCounts, setNewsCounts] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const { 
    institutions, 
    loading: isLoading, 
    stats,
    fetchInstitutions, 
    toggleInstitutionStatus,
    getInstitutionNewsCounts 
  } = useInstitutions();

  useEffect(() => {
    fetchInstitutions();
    loadNewsCounts();
  }, []);

  const loadNewsCounts = async () => {
    const counts = await getInstitutionNewsCounts();
    setNewsCounts(counts);
  };

  const filteredInstitutions = institutions.filter(institution =>
    institution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    institution.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateInstitution = () => {
    toast({
      title: "Coming Soon",
      description: "Institution creation will be available through user management.",
      variant: "default",
    });
  };

  const handleEditInstitution = (institution: Institution) => {
    toast({
      title: "Coming Soon", 
      description: "Institution editing functionality will be available soon.",
      variant: "default",
    });
  };

  const handleViewInstitution = (institution: Institution) => {
    toast({
      title: "Institution Details",
      description: `Viewing ${institution.name} - ${institution.email}`,
      variant: "default",
    });
  };

  const handleToggleStatus = async (institutionId: string, currentStatus: string) => {
    try {
      await toggleInstitutionStatus(institutionId, currentStatus);
      await loadNewsCounts(); // Refresh counts after status change
    } catch (error) {
      console.error('Error toggling status:', error);
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
      render: (value: any, institution: Institution) => (
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
      key: "phone",
      title: "Contact",
      render: (value: any, institution: Institution) => (
        <div className="text-sm">{institution.phone || "Not provided"}</div>
      ),
      mobileHidden: true
    },
    {
      key: "news_count",
      title: "News Posts",
      render: (value: any, institution: Institution) => (
        <div className="flex items-center space-x-1">
          <Newspaper className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{newsCounts[institution.id] || 0}</span>
        </div>
      )
    },
    {
      key: "status",
      title: "Status",
      render: (value: any, institution: Institution) => (
        <Badge className={`${getStatusColor(institution.status)} text-xs`}>
          {institution.status}
        </Badge>
      )
    },
    {
      key: "created_at",
      title: "Created",
      render: (value: any, institution: Institution) => (
        <div className="text-sm">
          {new Date(institution.created_at).toLocaleDateString()}
        </div>
      ),
      mobileHidden: true
    },
    {
      key: "actions",
      title: "Actions",
      render: (value: any, institution: Institution) => (
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
            <div className="text-2xl font-bold">{stats.total_institutions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Institutions</CardTitle>
            <School className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {stats.active_institutions}
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
              {stats.total_news_posts}
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
              {stats.total_institutions - stats.active_institutions}
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
    </div>
  );
};