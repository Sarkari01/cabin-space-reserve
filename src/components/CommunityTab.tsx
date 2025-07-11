import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCommunity } from "@/hooks/useCommunity";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Send, Smile, Upload, X, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

interface CommunityTabProps {
  userRole?: "student" | "merchant" | "admin";
}

export function CommunityTab({ userRole }: CommunityTabProps = {}) {
  const { posts, loading, createPost, addReaction, removeReaction, addComment } = useCommunity();
  const { user } = useAuth();
  const { toast } = useToast();
  const [newPost, setNewPost] = useState("");
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [posting, setPosting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) return null;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `community/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('community-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('community-media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast({
        title: "Invalid File",
        description: "Please select an image or video file.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || !user) return;

    setPosting(true);
    
    let mediaUrl = null;
    if (selectedFile) {
      mediaUrl = await handleFileUpload(selectedFile);
    }

    const success = await createPost({
      user_id: user.id,
      content: newPost.trim(),
      media_url: mediaUrl,
    });

    if (success) {
      setNewPost("");
      setSelectedFile(null);
    }
    setPosting(false);
  };

  const handleReaction = async (postId: string, emoji: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    const existingReaction = post?.community_reactions.find(
      r => r.user_id === user.id && r.emoji === emoji
    );

    if (existingReaction) {
      await removeReaction(postId, user.id, emoji);
    } else {
      await addReaction({
        post_id: postId,
        user_id: user.id,
        emoji,
      });
    }
  };

  const handleAddComment = async (postId: string) => {
    const comment = newComments[postId]?.trim();
    if (!comment || !user) return;

    const success = await addComment({
      post_id: postId,
      user_id: user.id,
      comment,
    });

    if (success) {
      setNewComments(prev => ({ ...prev, [postId]: "" }));
    }
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const getReactionCount = (post: any, emoji: string) => {
    return post.community_reactions.filter((r: any) => r.emoji === emoji).length;
  };

  const hasUserReacted = (post: any, emoji: string) => {
    return post.community_reactions.some((r: any) => r.user_id === user?.id && r.emoji === emoji);
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
      <div>
        <h2 className="text-2xl font-bold">Community</h2>
        <p className="text-muted-foreground">Share thoughts and connect with others</p>
      </div>

      {/* Create New Post */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <Textarea
              placeholder="What's on your mind?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              rows={3}
              className="resize-none"
            />
            
            {/* File Upload Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="community-upload"
                />
                <label
                  htmlFor="community-upload"
                  className="flex items-center gap-2 px-3 py-1 text-sm border border-input rounded-md cursor-pointer hover:bg-accent transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Add Media"}
                </label>
                {selectedFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeSelectedFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* File Preview */}
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                  <ImageIcon className="w-4 h-4" />
                  <span>{selectedFile.name}</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {REACTION_EMOJIS.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewPost(prev => prev + emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
              <Button
                onClick={handleCreatePost}
                disabled={!newPost.trim() || posting || uploading}
              >
                <Send className="w-4 h-4 mr-2" />
                {posting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {post.profiles?.full_name?.charAt(0) || post.profiles?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {post.profiles?.full_name || post.profiles?.email || "Unknown User"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(post.created_at), "MMM dd, yyyy 'at' HH:mm")}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap">{post.content}</p>

                {post.media_url && (
                  <div>
                    <img
                      src={post.media_url}
                      alt="Post media"
                      className="w-full max-w-md h-64 object-cover rounded-md"
                    />
                  </div>
                )}

                {/* Reactions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  {REACTION_EMOJIS.map((emoji) => {
                    const count = getReactionCount(post, emoji);
                    const hasReacted = hasUserReacted(post, emoji);
                    
                    return (
                      <Button
                        key={emoji}
                        variant={hasReacted ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleReaction(post.id, emoji)}
                        className="h-8 px-2"
                      >
                        <span className="mr-1">{emoji}</span>
                        {count > 0 && <span>{count}</span>}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleComments(post.id)}
                    className="ml-auto"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {post.community_comments.length} Comments
                  </Button>
                </div>

                {/* Comments Section */}
                {showComments[post.id] && (
                  <div className="space-y-4 pt-4 border-t">
                    {/* Add Comment */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Write a comment..."
                        value={newComments[post.id] || ""}
                        onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment(post.id);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddComment(post.id)}
                        disabled={!newComments[post.id]?.trim()}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-3">
                      {post.community_comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {comment.profiles?.full_name?.charAt(0) || comment.profiles?.email?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-muted p-3 rounded-lg">
                              <p className="font-medium text-sm">
                                {comment.profiles?.full_name || comment.profiles?.email || "Unknown User"}
                              </p>
                              <p className="text-sm">{comment.comment}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(comment.created_at), "MMM dd, yyyy 'at' HH:mm")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
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