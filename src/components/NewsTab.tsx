import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { NewsModal } from "@/components/NewsModal";
import { useNews } from "@/hooks/useNews";
import { Edit, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { safeFormatDate } from "@/lib/dateUtils";

interface NewsTabProps {
  userRole: "student" | "merchant" | "admin";
}

export function NewsTab({ userRole }: NewsTabProps) {
  const { news, loading, deleteNews, updateNews } = useNews();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteNews(id);
    setDeletingId(null);
  };

  const toggleStatus = async (newsItem: any) => {
    const newStatus = newsItem.status === "active" ? "inactive" : "active";
    await updateNews(newsItem.id, { status: newStatus });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">News</h2>
          <p className="text-muted-foreground">
            {userRole === "admin" ? "Manage news posts" : "Latest news and announcements"}
          </p>
        </div>
        {userRole === "admin" && (
          <NewsModal trigger={<Button><Plus className="w-4 h-4 mr-2" />Create News</Button>} />
        )}
      </div>

      <div className="space-y-4">
        {news.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No news posts found.</p>
              {userRole === "admin" && (
                <NewsModal trigger={<Button className="mt-4">Create First News Post</Button>} />
              )}
            </CardContent>
          </Card>
        ) : (
          news.map((newsItem) => (
            <Card key={newsItem.id} className={newsItem.status === "inactive" ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{newsItem.title}</CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant={newsItem.status === "active" ? "default" : "secondary"}>
                        {newsItem.status}
                      </Badge>
                      <Badge variant="outline">
                        {newsItem.visible_to === "both" ? "All Users" : 
                         newsItem.visible_to === "user" ? "Students" : "Merchants"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {safeFormatDate(newsItem.created_at, "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                  {userRole === "admin" && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStatus(newsItem)}
                      >
                        {newsItem.status === "active" ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <NewsModal
                        news={newsItem}
                        isEdit
                        trigger={<Button variant="outline" size="sm"><Edit className="w-4 h-4" /></Button>}
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete News Post</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{newsItem.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(newsItem.id)}
                              disabled={deletingId === newsItem.id}
                            >
                              {deletingId === newsItem.id ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{newsItem.content}</p>
                
                {newsItem.image_url && (
                  <div className="mb-4">
                    <img
                      src={newsItem.image_url}
                      alt={newsItem.title}
                      className="w-full max-w-md h-48 object-cover rounded-md"
                    />
                  </div>
                )}
                
                {newsItem.video_url && (
                  <div className="mb-4">
                    <video
                      src={newsItem.video_url}
                      controls
                      className="w-full max-w-md h-48 rounded-md"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}