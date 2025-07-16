import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type NewsPost = Tables<"news_posts">;
type NewsPostInsert = TablesInsert<"news_posts">;
type NewsPostUpdate = TablesUpdate<"news_posts">;

export function useNews() {
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("news_posts")
        .select(`
          *,
          creator:created_by (
            id,
            full_name,
            email,
            role
          ),
          institution:institution_id (
            id,
            name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error("Error fetching news:", error);
      toast({
        title: "Error",
        description: "Failed to load news posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutionNews = async (institutionId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("news_posts")
        .select(`
          *,
          creator:created_by (
            id,
            full_name,
            email,
            role
          ),
          institution:institution_id (
            id,
            name,
            email
          )
        `)
        .eq("institution_id", institutionId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error("Error fetching institution news:", error);
      toast({
        title: "Error",
        description: "Failed to load institution news posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNews = async (newsData: NewsPostInsert): Promise<NewsPost | null> => {
    try {
      const { data, error } = await supabase
        .from("news_posts")
        .insert(newsData)
        .select()
        .single();

      if (error) throw error;

      setNews((prev) => [data, ...prev]);
      toast({
        title: "Success",
        description: "News post created successfully",
      });
      return data;
    } catch (error) {
      console.error("Error creating news:", error);
      toast({
        title: "Error",
        description: "Failed to create news post",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateNews = async (id: string, updates: NewsPostUpdate): Promise<NewsPost | null> => {
    try {
      const { data, error } = await supabase
        .from("news_posts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setNews((prev) => prev.map((item) => (item.id === id ? data : item)));
      toast({
        title: "Success",
        description: "News post updated successfully",
      });
      return data;
    } catch (error) {
      console.error("Error updating news:", error);
      toast({
        title: "Error",
        description: "Failed to update news post",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteNews = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("news_posts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setNews((prev) => prev.filter((item) => item.id !== id));
      toast({
        title: "Success",
        description: "News post deleted successfully",
      });
      return true;
    } catch (error) {
      console.error("Error deleting news:", error);
      toast({
        title: "Error",
        description: "Failed to delete news post",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return {
    news,
    loading,
    createNews,
    updateNews,
    deleteNews,
    fetchInstitutionNews,
    refetch: fetchNews,
  };
}