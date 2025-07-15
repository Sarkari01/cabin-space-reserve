import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNews } from "@/hooks/useNews";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Eye, Edit, Trash2, Image } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function TelemarketingNewsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [visibleTo, setVisibleTo] = useState<"user" | "merchant" | "both">("both");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const { news, loading, refetch } = useNews();

  const filteredNews = news?.filter(article => {
    const matchesSearch = article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || article.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const resetForm = () => {
    setTitle("");
    setContent("");
    setImageUrl("");
    setVideoUrl("");
    setVisibleTo("both");
    setStatus("active");
    setSelectedNews(null);
    setIsEditMode(false);
  };

  const handleCreateNews = async () => {
    try {
      const { error } = await supabase
        .from("news_posts")
        .insert({
          title,
          content,
          image_url: imageUrl || null,
          video_url: videoUrl || null,
          visible_to: visibleTo,
          status
        });

      if (error) throw error;

      toast.success("News article created successfully");
      refetch();
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating news:", error);
      toast.error("Failed to create news article");
    }
  };

  const handleUpdateNews = async () => {
    if (!selectedNews) return;

    try {
      const { error } = await supabase
        .from("news_posts")
        .update({
          title,
          content,
          image_url: imageUrl || null,
          video_url: videoUrl || null,
          visible_to: visibleTo,
          status,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedNews.id);

      if (error) throw error;

      toast.success("News article updated successfully");
      refetch();
      setSelectedNews(null);
      setIsEditMode(false);
      resetForm();
    } catch (error) {
      console.error("Error updating news:", error);
      toast.error("Failed to update news article");
    }
  };

  const handleDeleteNews = async (id: string) => {
    try {
      const { error } = await supabase
        .from("news_posts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("News article deleted successfully");
      refetch();
    } catch (error) {
      console.error("Error deleting news:", error);
      toast.error("Failed to delete news article");
    }
  };

  const openEditModal = (article: any) => {
    setSelectedNews(article);
    setTitle(article.title);
    setContent(article.content);
    setImageUrl(article.image_url || "");
    setVideoUrl(article.video_url || "");
    setVisibleTo(article.visible_to);
    setStatus(article.status);
    setIsEditMode(true);
    setIsCreateModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    return status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case "user": return "bg-blue-100 text-blue-800";
      case "merchant": return "bg-purple-100 text-purple-800";
      case "both": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const totalNews = filteredNews.length;
  const activeNews = filteredNews.filter(n => n.status === "active").length;
  const userNews = filteredNews.filter(n => n.visible_to === "user" || n.visible_to === "both").length;
  const merchantNews = filteredNews.filter(n => n.visible_to === "merchant" || n.visible_to === "both").length;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading news...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">News Management</h2>
        <Button 
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create News
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeNews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">For Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{userNews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">For Merchants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{merchantNews}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search news..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* News Table */}
      <Card>
        <CardHeader>
          <CardTitle>News Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Media</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNews.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{article.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-md">
                        {article.content}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getVisibilityColor(article.visible_to)}>
                      {article.visible_to}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(article.status)}>
                      {article.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {article.image_url && (
                        <Badge variant="outline" className="gap-1">
                          <Image className="h-3 w-3" />
                          Image
                        </Badge>
                      )}
                      {article.video_url && (
                        <Badge variant="outline">Video</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(article.created_at), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{article.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {article.image_url && (
                              <img 
                                src={article.image_url} 
                                alt="News image" 
                                className="w-full h-64 object-cover rounded-lg"
                              />
                            )}
                            <p className="whitespace-pre-wrap">{article.content}</p>
                            <div className="flex gap-2">
                              <Badge className={getStatusColor(article.status)}>
                                {article.status}
                              </Badge>
                              <Badge className={getVisibilityColor(article.visible_to)}>
                                {article.visible_to}
                              </Badge>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => openEditModal(article)}
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-1 text-red-600"
                        onClick={() => handleDeleteNews(article.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredNews.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No news articles found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit News Article" : "Create News Article"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter news title..."
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter news content..."
                rows={6}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Image URL (optional)</label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Video URL (optional)</label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Visible To</label>
                <Select value={visibleTo} onValueChange={(value: "user" | "merchant" | "both") => setVisibleTo(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Users Only</SelectItem>
                    <SelectItem value="merchant">Merchants Only</SelectItem>
                    <SelectItem value="both">Both Users & Merchants</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={(value: "active" | "inactive") => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={isEditMode ? handleUpdateNews : handleCreateNews}>
                {isEditMode ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}