import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { InstitutionNewsTab } from "@/components/institution/InstitutionNewsTab";
import { InstitutionProfileTab } from "@/components/institution/InstitutionProfileTab";
import { useInstitutions } from "@/hooks/useInstitutions";
import { useNews } from "@/hooks/useNews";
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
  const { currentInstitution, loading: institutionLoading } = useInstitutions();
  const { news, loading: newsLoading, fetchInstitutionNews } = useNews();

  const [newsStats, setNewsStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    views: 0
  });

  useEffect(() => {
    if (currentInstitution) {
      fetchInstitutionNews(currentInstitution.id);
    }
  }, [currentInstitution]);

  useEffect(() => {
    if (news.length > 0) {
      const published = news.filter(n => n.status === 'active').length;
      const drafts = news.filter(n => n.status === 'draft').length;
      setNewsStats({
        total: news.length,
        published,
        drafts,
        views: 0 // Would need view tracking
      });
    }
  }, [news]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "news":
        return <InstitutionNewsTab institutionId={currentInstitution?.id} mode="manage" />;
      case "profile":
        return <InstitutionProfileTab />;
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Your Institution Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              {currentInstitution ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Welcome to {currentInstitution.name}'s dashboard. Here you can:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Create and manage news posts</li>
                    <li>View your publishing statistics</li>
                    <li>Update your institution profile</li>
                    <li>Monitor your content performance</li>
                  </ul>
                </div>
              ) : (
                <div className="text-center py-8">
                  <School className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    Loading institution details...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={currentInstitution ? `${currentInstitution.name} Dashboard` : "Institution Dashboard"}
        description="Manage your institution's news and content"
        breadcrumbs={[
          { label: "Dashboard", active: true }
        ]}
      />

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total News Posts</CardTitle>
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newsStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {newsLoading ? "Loading..." : "All time"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <FileText className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{newsStats.published}</div>
            <p className="text-xs text-muted-foreground">Active posts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileText className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{newsStats.drafts}</div>
            <p className="text-xs text-muted-foreground">Unpublished</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <User className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {currentInstitution?.status === 'active' ? 'Active' : 'Inactive'}
            </div>
            <p className="text-xs text-muted-foreground">Account status</p>
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