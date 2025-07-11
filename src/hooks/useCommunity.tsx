import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type CommunityPost = Tables<"community_posts"> & {
  profiles: Pick<Tables<"profiles">, "full_name" | "email">;
  community_reactions: Tables<"community_reactions">[];
  community_comments: (Tables<"community_comments"> & {
    profiles: Pick<Tables<"profiles">, "full_name" | "email">;
  })[];
};

type CommunityPostInsert = TablesInsert<"community_posts">;
type CommunityReactionInsert = TablesInsert<"community_reactions">;
type CommunityCommentInsert = TablesInsert<"community_comments">;

export function useCommunity() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          profiles:user_id(full_name, email),
          community_reactions(*),
          community_comments(
            *,
            profiles:user_id(full_name, email)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data as CommunityPost[] || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load community posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData: CommunityPostInsert): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("community_posts")
        .insert(postData);

      if (error) throw error;

      await fetchPosts(); // Refetch to get the new post with relations
      toast({
        title: "Success",
        description: "Post created successfully",
      });
      return true;
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
      return false;
    }
  };

  const addReaction = async (reactionData: CommunityReactionInsert): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("community_reactions")
        .insert(reactionData);

      if (error) throw error;

      await fetchPosts(); // Refetch to update reactions
      return true;
    } catch (error) {
      console.error("Error adding reaction:", error);
      return false;
    }
  };

  const removeReaction = async (postId: string, userId: string, emoji: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("community_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId)
        .eq("emoji", emoji);

      if (error) throw error;

      await fetchPosts(); // Refetch to update reactions
      return true;
    } catch (error) {
      console.error("Error removing reaction:", error);
      return false;
    }
  };

  const addComment = async (commentData: CommunityCommentInsert): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("community_comments")
        .insert(commentData);

      if (error) throw error;

      await fetchPosts(); // Refetch to get the new comment
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
      return true;
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
      return false;
    }
  };

  const deletePost = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPosts((prev) => prev.filter((post) => post.id !== id));
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
      return true;
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return {
    posts,
    loading,
    createPost,
    addReaction,
    removeReaction,
    addComment,
    deletePost,
    refetch: fetchPosts,
  };
}