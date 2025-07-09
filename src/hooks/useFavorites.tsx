import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Favorite {
  id: string;
  user_id: string;
  study_hall_id: string;
  created_at: string;
  study_hall?: {
    id: string;
    name: string;
    location: string;
    image_url?: string;
    daily_price: number;
    total_seats: number;
    status: string;
  };
}

export const useFavorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("study_halls")
        .select(`
          id,
          name,
          location,
          image_url,
          daily_price,
          total_seats,
          status
        `)
        .eq("status", "active");

      if (error) throw error;
      
      // For now, we'll simulate favorites with localStorage until migration is applied
      const favoriteIds = JSON.parse(localStorage.getItem(`favorites_${user.id}`) || "[]");
      const favoriteStudyHalls = (data || []).filter(hall => favoriteIds.includes(hall.id));
      
      const favoritesWithStudyHall = favoriteStudyHalls.map(hall => ({
        id: `fav_${hall.id}`,
        user_id: user.id,
        study_hall_id: hall.id,
        created_at: new Date().toISOString(),
        study_hall: hall
      }));

      setFavorites(favoritesWithStudyHall);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast({
        title: "Error",
        description: "Failed to fetch favorites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (studyHallId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add favorites",
        variant: "destructive",
      });
      return false;
    }

    try {
      // For now, use localStorage until migration is applied
      const favoriteIds = JSON.parse(localStorage.getItem(`favorites_${user.id}`) || "[]");
      if (!favoriteIds.includes(studyHallId)) {
        favoriteIds.push(studyHallId);
        localStorage.setItem(`favorites_${user.id}`, JSON.stringify(favoriteIds));
      }

      toast({
        title: "Success",
        description: "Added to favorites",
      });

      fetchFavorites();
      return true;
    } catch (error) {
      console.error("Error adding to favorites:", error);
      toast({
        title: "Error",
        description: "Failed to add to favorites",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeFromFavorites = async (studyHallId: string) => {
    try {
      // For now, use localStorage until migration is applied
      const favoriteIds = JSON.parse(localStorage.getItem(`favorites_${user.id}`) || "[]");
      const updatedFavorites = favoriteIds.filter((id: string) => id !== studyHallId);
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(updatedFavorites));

      toast({
        title: "Success",
        description: "Removed from favorites",
      });

      fetchFavorites();
      return true;
    } catch (error) {
      console.error("Error removing from favorites:", error);
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      });
      return false;
    }
  };

  const isFavorite = (studyHallId: string) => {
    return favorites.some(fav => fav.study_hall_id === studyHallId);
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  return {
    favorites,
    loading,
    fetchFavorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
  };
};