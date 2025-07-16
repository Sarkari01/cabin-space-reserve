import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNews } from "@/hooks/useNews";
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Calendar,
  Users,
  MessageSquare,
  Share,
  Heart
} from "lucide-react";

interface InstitutionAnalyticsTabProps {
  institutionId?: string;
}

export function InstitutionAnalyticsTab({ institutionId }: InstitutionAnalyticsTabProps) {
  const { news, loading, fetchInstitutionNews } = useNews();
  
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalPosts: 0,
    avgViewsPerPost: 0,
    monthlyGrowth: 0,
    engagementRate: 0,
    topPerformingPost: null as any,
    recentActivity: [] as any[]
  });

  useEffect(() => {
    if (institutionId) {
      fetchInstitutionNews(institutionId);
    }
  }, [institutionId]);

  useEffect(() => {
    if (news.length > 0) {
      // Calculate analytics (mock data for now)
      const totalPosts = news.length;
      const publishedPosts = news.filter(n => n.status === 'active');
      const totalViews = Math.floor(Math.random() * 10000) + 1000; // Mock data
      const avgViewsPerPost = totalPosts > 0 ? Math.floor(totalViews / totalPosts) : 0;
      const monthlyGrowth = Math.floor(Math.random() * 30) + 5; // Mock data
      const engagementRate = Math.floor(Math.random() * 50) + 10; // Mock data
      
      const topPerformingPost = publishedPosts.length > 0 ? publishedPosts[0] : null;
      
      const recentActivity = news.slice(0, 5).map(post => ({
        ...post,
        views: Math.floor(Math.random() * 500) + 50,
        engagement: Math.floor(Math.random() * 100) + 10
      }));

      setAnalytics({
        totalViews,
        totalPosts,
        avgViewsPerPost,
        monthlyGrowth,
        engagementRate,
        topPerformingPost,
        recentActivity
      });
    }
  }, [news]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgViewsPerPost}</div>
            <p className="text-xs text-muted-foreground">Per post</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <Heart className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.engagementRate}%</div>
            <p className="text-xs text-muted-foreground">Avg engagement</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalPosts}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Post */}
      {analytics.topPerformingPost && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Post</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{analytics.topPerformingPost.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {analytics.topPerformingPost.content.substring(0, 150)}...
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{Math.floor(Math.random() * 1000) + 100} views</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{Math.floor(Math.random() * 50) + 5} comments</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Share className="h-4 w-4" />
                      <span>{Math.floor(Math.random() * 25) + 2} shares</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Post Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {analytics.recentActivity.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{post.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Published {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{post.views}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{post.engagement}%</span>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      post.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                    }`}>
                      {post.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No posts to analyze yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Content Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Audience Engagement</p>
                  <p className="text-sm text-muted-foreground">Your posts receive high engagement from students</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{analytics.engagementRate}%</p>
                <p className="text-xs text-muted-foreground">Avg rate</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium">Publishing Frequency</p>
                  <p className="text-sm text-muted-foreground">Consistent posting schedule improves reach</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-success">Good</p>
                <p className="text-xs text-muted-foreground">Keep it up</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-warning/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <Share className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium">Content Sharing</p>
                  <p className="text-sm text-muted-foreground">Consider adding more visual content</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-warning">Improve</p>
                <p className="text-xs text-muted-foreground">Add images</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}