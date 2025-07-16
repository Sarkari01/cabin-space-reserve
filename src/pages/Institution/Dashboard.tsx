import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { InstitutionNewsTab } from "@/components/institution/InstitutionNewsTab";
import { InstitutionProfileTab } from "@/components/institution/InstitutionProfileTab";
import { 
  School, 
  Newspaper, 
  FileText, 
  User,
  BarChart3
} from "lucide-react";

export default function InstitutionDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  // Show migration notice for any tab switch
  const handleTabChange = (value: string) => {
    if (value !== "overview") {
      toast({
        title: "Migration Required",
        description: "Please run the database migration first to enable full institution functionality.",
        variant: "destructive",
      });
      return;
    }
    setActiveTab(value);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "news":
        return <InstitutionNewsTab mode="manage" />;
      case "profile":
        return <InstitutionProfileTab />;
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Your Institution Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Once the database migration is complete, you'll be able to:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-sm text-muted-foreground">
                <li>Create and manage news posts</li>
                <li>View your publishing statistics</li>
                <li>Update your institution profile</li>
                <li>Schedule news posts for later publication</li>
              </ul>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institution Dashboard"
        description="Manage your institution's news and content"
        breadcrumbs={[
          { label: "Dashboard", active: true }
        ]}
      />

      {/* Migration Notice */}
      <Card className="border-warning bg-warning/5">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <School className="h-5 w-5 text-warning" />
            <div>
              <p className="font-medium text-warning">Database Migration Required</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please run the database migration to enable full institution dashboard functionality.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total News Posts</CardTitle>
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Migration required</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <FileText className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">0</div>
            <p className="text-xs text-muted-foreground">Migration required</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileText className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">0</div>
            <p className="text-xs text-muted-foreground">Migration required</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Views</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">0</div>
            <p className="text-xs text-muted-foreground">Migration required</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="news">My News</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {renderTabContent()}
        </TabsContent>
      </Tabs>
    </div>
  );
}