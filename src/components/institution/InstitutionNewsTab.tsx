import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNews } from "@/hooks/useNews";
import { useInstitutions } from "@/hooks/useInstitutions";
import { InstitutionNewsModal } from "@/components/institution/InstitutionNewsModal";
import { Newspaper, Plus, Eye, Edit, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

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
  const { news, loading, fetchInstitutionNews } = useNews();
  const { currentInstitution } = useInstitutions();
  const [showModal, setShowModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  const effectiveInstitutionId = institutionId || currentInstitution?.id;

  useEffect(() => {
    if (effectiveInstitutionId) {
      fetchInstitutionNews(effectiveInstitutionId);
    }
  }, [effectiveInstitutionId]);

  const handleCreateNews = () => {
    setSelectedNews(null);
    setModalMode("create");
    setShowModal(true);
  };

  const handleEditNews = (newsItem: any) => {
    setSelectedNews(newsItem);
    setModalMode("edit");
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'draft':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const displayNews = limit ? news.slice(0, limit) : news;

  if (loading) {
    return (
      <div className="text-center py-8">
        <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">Loading news posts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {mode === "create" ? "Create News Post" : 
               mode === "recent" ? "Recent News" : "My News Posts"}
            </CardTitle>
            {mode !== "recent" && (
              <Button onClick={handleCreateNews}>
                <Plus className="h-4 w-4 mr-2" />
                Create News Post
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {displayNews.length === 0 ? (
            <div className="text-center py-8">
              <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {mode === "recent" ? "No recent news posts" : "No news posts created yet"}
              </p>
              {mode !== "recent" && (
                <Button className="mt-4" onClick={handleCreateNews}>
                  Create your first news post
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {displayNews.map((newsItem: any) => (
                <Card key={newsItem.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{newsItem.title}</h3>
                          <Badge className={getStatusColor(newsItem.status)}>
                            {newsItem.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {newsItem.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Created: {format(new Date(newsItem.created_at), 'MMM dd, yyyy')}</span>
                          <span>Updated: {format(new Date(newsItem.updated_at), 'MMM dd, yyyy')}</span>
                          <span>Visibility: {newsItem.visible_to}</span>
                        </div>
                      </div>
                      
                      {mode !== "recent" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditNews(newsItem)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InstitutionNewsModal
        institutionId={effectiveInstitutionId}
        news={selectedNews}
        open={showModal}
        onOpenChange={setShowModal}
        mode={modalMode}
        onSuccess={() => {
          setShowModal(false);
          if (effectiveInstitutionId) {
            fetchInstitutionNews(effectiveInstitutionId);
          }
        }}
      />
    </div>
  );
}