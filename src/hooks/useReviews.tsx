import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface Review {
  id: string;
  user_id: string;
  merchant_id: string;
  study_hall_id: string;
  booking_id: string;
  rating: number;
  review_text?: string;
  status: 'approved' | 'pending' | 'hidden';
  merchant_response?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  study_halls?: {
    name: string;
  };
}

export interface EligibleBooking {
  booking_id: string;
  study_hall_id: string;
  study_hall_name: string;
  end_date: string;
  already_reviewed: boolean;
}

export interface CreateReviewData {
  study_hall_id: string;
  booking_id: string;
  rating: number;
  review_text?: string;
}

export const useReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [eligibleBookings, setEligibleBookings] = useState<EligibleBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch reviews for a specific study hall
  const fetchReviews = async (studyHallId: string, limit = 10) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('study_hall_reviews')
        .select(`
          *,
          profiles:user_id (full_name, email),
          study_halls:study_hall_id (name)
        `)
        .eq('study_hall_id', studyHallId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setReviews((data as unknown as Review[]) || []);
      return (data as unknown as Review[]) || [];
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to fetch reviews",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch all reviews (for admin/merchant)
  const fetchAllReviews = async (filters?: {
    merchantId?: string;
    userId?: string;
    studyHallId?: string;
    status?: string;
    limit?: number;
  }) => {
    try {
      setLoading(true);
      let query = supabase
        .from('study_hall_reviews')
        .select(`
          *,
          profiles:user_id (full_name, email),
          study_halls:study_hall_id (name)
        `);

      if (filters?.merchantId) {
        query = query.eq('merchant_id', filters.merchantId);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.studyHallId) {
        query = query.eq('study_hall_id', filters.studyHallId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status as 'approved' | 'pending' | 'hidden');
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 50);

      if (error) throw error;
      setReviews((data as unknown as Review[]) || []);
      return (data as unknown as Review[]) || [];
    } catch (error: any) {
      console.error('Error fetching all reviews:', error);
      toast({
        title: "Error",
        description: "Failed to fetch reviews",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get eligible bookings for review
  const fetchEligibleBookings = async (userId?: string) => {
    if (!userId && !user?.id) return [];

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc(
        'get_eligible_bookings_for_review',
        { p_user_id: userId || user?.id }
      );

      if (error) throw error;
      setEligibleBookings(data || []);
      return data || [];
    } catch (error: any) {
      console.error('Error fetching eligible bookings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch eligible bookings",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Create a new review
  const createReview = async (reviewData: CreateReviewData) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a review",
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoading(true);

      // Get merchant_id from study hall
      const { data: studyHall, error: studyHallError } = await supabase
        .from('study_halls')
        .select('merchant_id')
        .eq('id', reviewData.study_hall_id)
        .single();

      if (studyHallError) throw studyHallError;

      const { data, error } = await supabase
        .from('study_hall_reviews')
        .insert([
          {
            user_id: user.id,
            merchant_id: studyHall.merchant_id,
            study_hall_id: reviewData.study_hall_id,
            booking_id: reviewData.booking_id,
            rating: reviewData.rating,
            review_text: reviewData.review_text,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Review submitted successfully!",
        variant: "default",
      });

      // Refresh eligible bookings
      await fetchEligibleBookings();
      
      return data;
    } catch (error: any) {
      console.error('Error creating review:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update a review
  const updateReview = async (reviewId: string, updates: Partial<CreateReviewData>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('study_hall_reviews')
        .update(updates)
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Review updated successfully!",
        variant: "default",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating review:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update review",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Add merchant response
  const addMerchantResponse = async (reviewId: string, response: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('study_hall_reviews')
        .update({ merchant_response: response })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Response added successfully!",
        variant: "default",
      });

      return data;
    } catch (error: any) {
      console.error('Error adding merchant response:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add response",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update review status (admin only)
  const updateReviewStatus = async (reviewId: string, status: 'approved' | 'pending' | 'hidden') => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('study_hall_reviews')
        .update({ status })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Review ${status} successfully!`,
        variant: "default",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating review status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update review status",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a review
  const deleteReview = async (reviewId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('study_hall_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Review deleted successfully!",
        variant: "default",
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete review",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    reviews,
    eligibleBookings,
    loading,
    fetchReviews,
    fetchAllReviews,
    fetchEligibleBookings,
    createReview,
    updateReview,
    addMerchantResponse,
    updateReviewStatus,
    deleteReview,
  };
};