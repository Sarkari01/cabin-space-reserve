import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ResponsiveTable } from "@/components/ResponsiveTable";
import { InstitutionNewsModal } from "./InstitutionNewsModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Newspaper,
  Calendar,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface InstitutionNewsTabProps {
  institutionId?: string;
  mode?: "create" | "manage" | "recent";
  limit?: number;
}

export function InstitutionNewsTab({ 
  institutionId, 
  mode = "manage", 
  limit 
}: InstitutionNewsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const { toast } = useToast();

  // Fetch institution's news
  const { data: newsPosts = [], isLoading, refetch } = useQuery({
    queryKey: ["institution-news", institutionId, limit],
    queryFn: async () => {
      if (!institutionId) return [];
      
      let query = supabase
        .from("news_posts")
        .select("*")
        .eq("institution_id", institutionId)
        .order("created_at", { ascending: false });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!institutionId && mode !== "create"
  });

  const filteredNews = newsPosts.filter(news =>
    news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNews = () => {
    setSelectedNews(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const handleEditNews = (news: any) => {
    setSelectedNews(news);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleDeleteNews = async (newsId: string) => {
    try {
      const { error } = await supabase
        .from("news_posts")
        .delete()
        .eq("id", newsId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "News post deleted successfully",
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete news post",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (newsId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    
    try {
      const { error } = await supabase
        .from("news_posts")
        .update({ status: newStatus })
        .eq("id", newsId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `News post ${newStatus === "active" ? "published" : "unpublished"} successfully`,
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update news status",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      key: "visible_to",
      title: "Audience",
      render: (value: any, news: any) => (
        <Badge variant="outline">
          {news.visible_to === "both" ? "All Users" : 
           news.visible_to === "user" ? "Students" : "Merchants"}
        </Badge>
      ),
      mobileHidden: true
    },
    {
      key: "created_at",
      title: "Created",
      render: (value: any, news: any) => (
        <div className="text-sm">{formatDate(news.created_at)}</div>
      ),
      mobileHidden: true
    },
    {
      key: "actions",
      title: "Actions",
      render: (value: any, news: any) => (
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditNews(news)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(news.id, news.status)}
          >
            {news.status === "active" ? (
              <ToggleLeft className="h-4 w-4" />
            ) : (
              <ToggleRight className="h-4 w-4" />
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete News Post</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this news post? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeleteNews(news.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    }
  ];

  // Create mode
  if (mode === "create") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Create News Post</h2>
            <p className="text-muted-foreground">
              Share important updates and announcements with the community.
            </p>
          </div>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Ready to create a news post?</h3>
              <p className="text-muted-foreground mb-4">
                Click the button below to start creating your news post.
              </p>
              <Button onClick={handleCreateNews}>
                <Plus className="h-4 w-4 mr-2" />
                Create News Post
              </Button>
            </div>
          </CardContent>
        </Card>

        <InstitutionNewsModal
          institutionId={institutionId}
          news={selectedNews}
          open={modalOpen}
          onOpenChange={setModalOpen}
          mode={modalMode}
          onSuccess={() => {
            refetch();
            setModalOpen(false);
          }}
        />
      </div>
    );
  }

  // Recent mode (for dashboard overview)
  if (mode === "recent") {
    return (
      <div>
        {newsPosts.length > 0 ? (
          <div className="space-y-3">
            {newsPosts.slice(0, limit || 5).map((news) => (
              <div key={news.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{news.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(news.created_at)}
                  </p>
                </div>
                <Badge variant={news.status === "active" ? "default" : "secondary"}>
                  {news.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No news posts yet</p>
          </div>
        )}
      </div>
    );
  }

  // Manage mode (full table)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My News</h2>
          <p className="text-muted-foreground">
            Manage your published news posts and announcements.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All News Posts</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search news..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
              <Button onClick={handleCreateNews}>
                <Plus className="h-4 w-4 mr-2" />
                Create News
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={filteredNews}
            columns={newsColumns}
            loading={isLoading}
            emptyMessage="No news posts found"
          />
        </CardContent>
      </Card>

      <InstitutionNewsModal
        institutionId={institutionId}
        news={selectedNews}
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        onSuccess={() => {
          refetch();
          setModalOpen(false);
        }}
      />
    </div>
  );
}