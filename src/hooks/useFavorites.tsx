import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface Favorite {
  id: string;
  user_id: string;
  study_hall_id: string;
  created_at: string;
  study_halls?: {
    id: string;
    name: string;
    location: string;
    daily_price: number;
    image_url?: string;
  };
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
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
        .from("favorites")
        .select(`
          *,
          study_halls (
            id,
            name,
            location,
            daily_price,
            image_url
          )
        `)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching favorites:", error);
        toast({
          title: "Error",
          description: "Failed to load favorites",
          variant: "destructive"
        });
        return;
      }

      setFavorites(data || []);
    } catch (error) {
      console.error("Unexpected error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (studyHallId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add favorites",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from("favorites")
        .insert({
          user_id: user.id,
          study_hall_id: studyHallId
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already in favorites",
            description: "This study hall is already in your favorites",
            variant: "destructive"
          });
        } else {
          console.error("Error adding to favorites:", error);
          toast({
            title: "Error",
            description: "Failed to add to favorites",
            variant: "destructive"
          });
        }
        return false;
      }

      await fetchFavorites(); // Refresh the list
      toast({
        title: "Success",
        description: "Added to favorites"
      });
      return true;
    } catch (error) {
      console.error("Unexpected error adding to favorites:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const removeFromFavorites = async (studyHallId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("study_hall_id", studyHallId);

      if (error) {
        console.error("Error removing from favorites:", error);
        toast({
          title: "Error",
          description: "Failed to remove from favorites",
          variant: "destructive"
        });
        return false;
      }

      await fetchFavorites(); // Refresh the list
      toast({
        title: "Success",
        description: "Removed from favorites"
      });
      return true;
    } catch (error) {
      console.error("Unexpected error removing from favorites:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const isFavorite = (studyHallId: string) => {
    return favorites.some(fav => fav.study_hall_id === studyHallId);
  };

  const toggleFavorite = async (studyHallId: string) => {
    if (isFavorite(studyHallId)) {
      return await removeFromFavorites(studyHallId);
    } else {
      return await addToFavorites(studyHallId);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('favorites-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${user.id}`
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
    refetch: fetchFavorites
  };
};