import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { School, Mail, Phone, Calendar, Newspaper, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveTable } from "@/components/ResponsiveTable";

interface InstitutionDetailModalProps {
  institution: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newsCount: number;
}

export function InstitutionDetailModal({ 
  institution, 
  open, 
  onOpenChange, 
  newsCount 
}: InstitutionDetailModalProps) {
  
  // Fetch institution's news
  const { data: institutionNews = [], isLoading } = useQuery({
    queryKey: ["institution-news", institution?.id],
    queryFn: async () => {
      if (!institution?.id) return [];
      
      const { data, error } = await supabase
        .from("news_posts")
        .select("*")
        .eq("institution_id", institution.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!institution?.id && open
  });

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

  const newsColumns = [
    {
      key: "title",
      title: "Title",
      render: (value: any, news: any) => (
        <div>
          <div className="font-medium">{news.title}</div>
          <div className="text-sm text-muted-foreground line-clamp-2">
            {news.content.substring(0, 100)}...
          </div>
        </div>
      )
    },
    {
      key: "status",
      title: "Status",
      render: (value: any, news: any) => (
        <Badge variant={news.status === "active" ? "default" : "secondary"}>
          {news.status}
        </Badge>
      )
    },
    {
      key: "created_at",
      title: "Published",
      render: (value: any, news: any) => (
        <div className="text-sm">
          {new Date(news.created_at).toLocaleDateString()}
        </div>
      )
    }
  ];

  if (!institution) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
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
            <span>{institution.name}</span>
            <Badge className={`${getStatusColor(institution.status)} text-xs`}>
              {institution.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{institution.email}</span>
                </div>
                {institution.mobile && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{institution.mobile}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Created {new Date(institution.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Newspaper className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total News Posts</span>
                  </div>
                  <Badge variant="outline">{newsCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Last News Posted</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {institutionNews.length > 0 
                      ? new Date(institutionNews[0].created_at).toLocaleDateString()
                      : "Never"
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* News Posts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent News Posts</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Navigate to news tab with institution filter
                    onOpenChange(false);
                    // You can implement navigation to news tab with filter here
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View All News
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {institutionNews.length > 0 ? (
                <ResponsiveTable
                  data={institutionNews.slice(0, 5)} // Show only first 5
                  columns={newsColumns}
                  loading={isLoading}
                  emptyMessage="No news posts found"
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No news posts yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}