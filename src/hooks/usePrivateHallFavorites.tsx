import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

interface PrivateHallFavorite {
  id: string;
  user_id: string;
  private_hall_id: string;
  created_at: string;
  private_halls?: {
    id: string;
    name: string;
    location: string;
    monthly_price: number;
    image_url?: string;
  };
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

      // Step 1: fetch favorites
      const { data: favs, error } = await supabase
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

      if (!favs || favs.length === 0) {
        setFavorites([]);
        return;
      }

      // Step 2: fetch details for related private halls
      const hallIds = Array.from(new Set(favs.map((f) => f.private_hall_id)));
      const { data: halls, error: hallsError } = await supabase
        .from("private_halls")
        .select("id, name, location, monthly_price")
        .in("id", hallIds);

      if (hallsError) {
        console.warn("Could not enrich private hall favorites with hall details:", hallsError);
        setFavorites(favs as any);
        return;
      }

      // Step 3: fetch main images for these private halls
      const { data: hallImages, error: imagesError } = await supabase
        .from("private_hall_images")
        .select("private_hall_id, image_url, is_main")
        .in("private_hall_id", hallIds);

      if (imagesError) {
        console.warn("Could not load private hall images:", imagesError);
      }

      const imageMap = new Map<string, { image_url: string }>();
      (hallImages || []).forEach((img: any) => {
        const existing = imageMap.get(img.private_hall_id);
        // Prefer main image; otherwise keep the first encountered
        if (!existing || img.is_main) {
          imageMap.set(img.private_hall_id, { image_url: img.image_url });
        }
      });

      const hallMap = new Map(halls.map((h) => [h.id, h]));
      const enriched = favs.map((f) => {
        const hall = hallMap.get(f.private_hall_id);
        const img = imageMap.get(f.private_hall_id);
        return {
          ...f,
          private_halls: hall ? { ...hall, image_url: img?.image_url } : undefined,
        };
      }) as PrivateHallFavorite[];

      setFavorites(enriched);
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
