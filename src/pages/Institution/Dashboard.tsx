import { useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NewsTab } from "@/components/NewsTab";
import { InstitutionNewsTab } from "@/components/institution/InstitutionNewsTab";
import { InstitutionProfileTab } from "@/components/institution/InstitutionProfileTab";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Newspaper, 
  Settings, 
  Plus,
  TrendingUp,
  Eye,
  Calendar
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const InstitutionDashboard = () => {
  const { user, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Get institution data
  const { data: institution } = useQuery({
    queryKey: ["current-institution", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("institutions")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();
      
      if (error) {
        console.error("Error fetching institution:", error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id
  });

  // Get institution's news stats
  const { data: newsStats } = useQuery({
    queryKey: ["institution-news-stats", institution?.id],
    queryFn: async () => {
      if (!institution?.id) return { total: 0, active: 0, thisMonth: 0 };
      
      const { data, error } = await supabase
        .from("news_posts")
        .select("id, status, created_at")
        .eq("institution_id", institution.id);
      
      if (error) throw error;
      
      const total = data.length;
      const active = data.filter(news => news.status === "active").length;
      const thisMonth = data.filter(news => {
        const newsDate = new Date(news.created_at);
        const now = new Date();
        return newsDate.getMonth() === now.getMonth() && 
               newsDate.getFullYear() === now.getFullYear();
      }).length;
      
      return { total, active, thisMonth };
    },
    enabled: !!institution?.id
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Welcome back!</h2>
                <p className="text-muted-foreground">
                  Here's what's happening with your institution today.
                </p>
              </div>
              <Badge variant="outline" className="text-sm">
                {institution?.status || "Active"}
              </Badge>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total News Posts</CardTitle>
                  <Newspaper className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{newsStats?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    All time publications
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Posts</CardTitle>
                  <Eye className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">{newsStats?.active || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently published
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  <Calendar className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{newsStats?.thisMonth || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    New posts this month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button onClick={() => setActiveTab("post-news")} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Create News Post
                </Button>
                <Button variant="outline" onClick={() => setActiveTab("my-news")} className="flex-1">
                  <Newspaper className="h-4 w-4 mr-2" />
                  Manage My News
                </Button>
              </CardContent>
            </Card>

            {/* Recent News */}
            <Card>
              <CardHeader>
                <CardTitle>Recent News</CardTitle>
              </CardHeader>
              <CardContent>
                <InstitutionNewsTab 
                  institutionId={institution?.id} 
                  mode="recent" 
                  limit={5}
                />
              </CardContent>
            </Card>
          </div>
        );
      
      case "post-news":
        return (
          <InstitutionNewsTab 
            institutionId={institution?.id} 
            mode="create"
          />
        );
      
      case "my-news":
        return (
          <InstitutionNewsTab 
            institutionId={institution?.id} 
            mode="manage"
          />
        );
      
      case "profile":
        return <InstitutionProfileTab institution={institution} />;
      
      default:
        return <div>Tab not found</div>;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Please log in to access your institution dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardSidebar 
      userRole="institution" 
      userName={user?.email || ""} 
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div className="flex-1 space-y-4 p-8 pt-6">
        {renderTabContent()}
      </div>
    </DashboardSidebar>
  );
};

export default InstitutionDashboard;