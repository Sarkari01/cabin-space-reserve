import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

interface PrivateHallFavorite {
  id: string;
  user_id: string;
  private_hall_id: string;
  created_at: string;
}

export const usePrivateHallFavorites = () => {
  const [favorites, setFavorites] = useState<PrivateHallFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("private_hall_favorites")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching private hall favorites:", error);
        toast({
          title: "Error",
          description: "Failed to load favorites",
          variant: "destructive",
        });
        return;
      }

      setFavorites(data || []);
    } catch (error) {
      console.error("Unexpected error fetching private hall favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (privateHallId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add favorites",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase.from("private_hall_favorites").insert({
        user_id: user.id,
        private_hall_id: privateHallId,
      });

      if (error) {
        if ((error as any).code === "23505") {
          toast({
            title: "Already in favorites",
            description: "This hall is already in your favorites",
            variant: "destructive",
          });
        } else {
          console.error("Error adding to private hall favorites:", error);
          toast({
            title: "Error",
            description: "Failed to add to favorites",
            variant: "destructive",
          });
        }
        return false;
      }

      await fetchFavorites();
      toast({ title: "Success", description: "Added to favorites" });
      return true;
    } catch (error) {
      console.error("Unexpected error adding to private hall favorites:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeFromFavorites = async (privateHallId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("private_hall_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("private_hall_id", privateHallId);

      if (error) {
        console.error("Error removing from private hall favorites:", error);
        toast({
          title: "Error",
          description: "Failed to remove from favorites",
          variant: "destructive",
        });
        return false;
      }

      await fetchFavorites();
      toast({ title: "Success", description: "Removed from favorites" });
      return true;
    } catch (error) {
      console.error(
        "Unexpected error removing from private hall favorites:",
        error
      );
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  const isFavorite = (privateHallId: string) => {
    return favorites.some((fav) => fav.private_hall_id === privateHallId);
  };

  const toggleFavorite = async (privateHallId: string) => {
    if (isFavorite(privateHallId)) {
      return await removeFromFavorites(privateHallId);
    } else {
      return await addToFavorites(privateHallId);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("private-hall-favorites-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "private_hall_favorites",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchFavorites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    favorites,
    loading,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites,
  };
};
