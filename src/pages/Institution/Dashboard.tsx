import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { InstitutionNewsTab } from "@/components/institution/InstitutionNewsTab";
import { InstitutionProfileTab } from "@/components/institution/InstitutionProfileTab";
import { InstitutionAnalyticsTab } from "@/components/institution/InstitutionAnalyticsTab";
import { InstitutionCreateNewsTab } from "@/components/institution/InstitutionCreateNewsTab";
import { useInstitutions } from "@/hooks/useInstitutions";
import { useNews } from "@/hooks/useNews";
import { useAuth } from "@/hooks/useAuth";
import { 
  School, 
  Newspaper, 
  FileText, 
  User,
  TrendingUp,
  Eye,
  Calendar
} from "lucide-react";

export default function InstitutionDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  const { currentInstitution, loading: institutionLoading } = useInstitutions();
  const { news, loading: newsLoading, fetchInstitutionNews } = useNews();

  const [newsStats, setNewsStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    views: 0,
    thisMonth: 0
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
      const thisMonth = news.filter(n => {
        const createdAt = new Date(n.created_at);
        const now = new Date();
        return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
      }).length;
      
      setNewsStats({
        total: news.length,
        published,
        drafts,
        views: 0, // Would need view tracking
        thisMonth
      });
    }
  }, [news]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const renderTabContent = () => {
    console.log('renderTabContent: Current state:', { 
      institutionLoading, 
      currentInstitution: !!currentInstitution,
      userRole: user?.role,
      activeTab 
    });

    // Show loading state if institution is being loaded
    if (institutionLoading) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Loading institution data...</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Show error state if no institution found and not loading
    if (!currentInstitution) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">No institution found for your account.</p>
              <p className="text-sm text-muted-foreground">
                Please contact support or create an institution profile first.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    switch (activeTab) {
      case "create-news":
        return <InstitutionCreateNewsTab institutionId={currentInstitution?.id} />;
      case "news":
        return <InstitutionNewsTab institutionId={currentInstitution?.id} mode="manage" />;
      case "news-analytics":
        return <InstitutionAnalyticsTab institutionId={currentInstitution?.id} />;
      case "profile":
        return <InstitutionProfileTab />;
      case "institution-info":
        return <InstitutionProfileTab />;
      case "analytics":
        return <InstitutionAnalyticsTab institutionId={currentInstitution?.id} />;
      case "community":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Community Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Community features coming soon...</p>
            </CardContent>
          </Card>
        );
      case "notifications":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notification Center</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Notification management coming soon...</p>
            </CardContent>
          </Card>
        );
      default:
        return (
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("create-news")}>
                    <CardContent className="flex items-center space-x-4 p-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Create News Post</p>
                        <p className="text-sm text-muted-foreground">Share updates with your community</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("news")}>
                    <CardContent className="flex items-center space-x-4 p-4">
                      <div className="p-2 bg-success/10 rounded-lg">
                        <Newspaper className="h-6 w-6 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">Manage News</p>
                        <p className="text-sm text-muted-foreground">Edit and organize your posts</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("analytics")}>
                    <CardContent className="flex items-center space-x-4 p-4">
                      <div className="p-2 bg-warning/10 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium">View Analytics</p>
                        <p className="text-sm text-muted-foreground">Track your content performance</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {news.length > 0 ? (
                  <div className="space-y-4">
                    {news.slice(0, 3).map((post) => (
                      <div key={post.id} className="flex items-center space-x-4 p-3 bg-muted/50 rounded-lg">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Newspaper className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{post.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(post.created_at).toLocaleDateString()} • Status: {post.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No news posts yet. Create your first post!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Eye className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{newsStats.views}</p>
                      <p className="text-sm text-muted-foreground">Total Views</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <Calendar className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{newsStats.thisMonth}</p>
                      <p className="text-sm text-muted-foreground">Posts This Month</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <DashboardSidebar
      userRole="institution"
      userName={currentInstitution?.name || user?.email || "Institution"}
      onTabChange={handleTabChange}
      activeTab={activeTab}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold">
            {currentInstitution ? `${currentInstitution.name} Dashboard` : "Institution Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            Manage your institution's news and content
          </p>
        </div>

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

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </DashboardSidebar>
  );
}