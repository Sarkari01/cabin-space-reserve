
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCommunity } from "@/hooks/useCommunity";
import { supabase } from "@/integrations/supabase/client";
import { Search, Eye, Trash2, AlertTriangle, MessageSquare, Heart } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function TelemarketingCommunityTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const { posts, loading, refetch } = useCommunity();

  const filteredPosts = posts?.filter(post => {
    const matchesSearch = post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      toast.success("Post deleted successfully");
      refetch();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("community_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast.success("Comment deleted successfully");
      refetch();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const totalPosts = filteredPosts.length;
  const totalComments = 0; // Will be calculated separately
  const totalReactions = 0; // Will be calculated separately

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading community data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Community Moderation</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalComments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPosts > 0 ? Math.round(((totalComments + totalReactions) / totalPosts) * 100) / 100 : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search posts and users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Community Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Community Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{post.profiles?.full_name || "Anonymous"}</div>
                      <div className="text-sm text-muted-foreground">{post.profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <p className="truncate">{post.content}</p>
                      {post.media_url && (
                        <Badge variant="outline" className="mt-1">Media</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {post.community_comments?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {post.community_reactions?.length || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(post.created_at), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => setSelectedPost(post)}
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Post Details</DialogTitle>
                          </DialogHeader>
                          {selectedPost && (
                            <div className="space-y-6">
                              {/* Post Content */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">
                                    {selectedPost.profiles?.full_name || "Anonymous"}
                                  </CardTitle>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(selectedPost.created_at), "MMM dd, yyyy 'at' HH:mm")}
                                  </p>
                                </CardHeader>
                                <CardContent>
                                  <p className="whitespace-pre-wrap">{selectedPost.content}</p>
                                  {selectedPost.media_url && (
                                    <div className="mt-4">
                                      <img 
                                        src={selectedPost.media_url} 
                                        alt="Post media" 
                                        className="max-w-full h-auto rounded-lg"
                                      />
                                    </div>
                                  )}
                                </CardContent>
                              </Card>

                              {/* Comments */}
                              <div>
                                <h3 className="font-semibold mb-4">Comments ({selectedPost.community_comments?.length || 0})</h3>
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                  {selectedPost.community_comments?.map((comment: any) => (
                                    <Card key={comment.id}>
                                      <CardContent className="p-4">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <p className="font-medium">{comment.profiles?.full_name || "Anonymous"}</p>
                                            <p className="text-sm">{comment.comment}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {format(new Date(comment.created_at), "MMM dd, yyyy 'at' HH:mm")}
                                            </p>
                                          </div>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button variant="ghost" size="sm">
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Are you sure you want to delete this comment? This action cannot be undone.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteComment(comment.id)}>
                                                  Delete
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>

                              {/* Reactions */}
                              <div>
                                <h3 className="font-semibold mb-4">Reactions ({selectedPost.community_reactions?.length || 0})</h3>
                                <div className="flex flex-wrap gap-2">
                                  {selectedPost.community_reactions?.map((reaction: any) => (
                                    <Badge key={reaction.id} variant="outline">
                                      {reaction.emoji} {reaction.profiles?.full_name || "Anonymous"}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="gap-1 text-red-600">
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Post</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this post? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeletePost(post.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredPosts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No community posts found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
