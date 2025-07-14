import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: 'monthly' | 'yearly';
  features: string[];
  status: 'active' | 'inactive';
  max_study_halls: number;
  max_bookings_per_month: number;
  priority_support: boolean;
  analytics_access: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanData {
  name: string;
  price: number;
  duration: 'monthly' | 'yearly';
  features: string[];
  max_study_halls: number;
  max_bookings_per_month: number;
  priority_support: boolean;
  analytics_access: boolean;
  status?: 'active' | 'inactive';
}

interface DBPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: any;
  status: string;
  max_study_halls: number | null;
  max_bookings_per_month: number | null;
  priority_support: boolean | null;
  analytics_access: boolean | null;
  created_at: string;
  updated_at: string;
}

export const useSubscriptionPlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      
      const transformedPlans: SubscriptionPlan[] = (data || []).map((plan: DBPlan) => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        duration: plan.duration as 'monthly' | 'yearly',
        features: Array.isArray(plan.features) ? plan.features : [],
        status: plan.status as 'active' | 'inactive',
        max_study_halls: plan.max_study_halls || 5,
        max_bookings_per_month: plan.max_bookings_per_month || 100,
        priority_support: plan.priority_support || false,
        analytics_access: plan.analytics_access || false,
        created_at: plan.created_at,
        updated_at: plan.updated_at,
      }));
      
      setPlans(transformedPlans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subscription plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (planData: CreatePlanData) => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert([planData])
        .select()
        .single();

      if (error) throw error;

      const transformedPlan: SubscriptionPlan = {
        id: data.id,
        name: data.name,
        price: data.price,
        duration: data.duration as 'monthly' | 'yearly',
        features: Array.isArray(data.features) ? data.features.map(String) : [],
        status: data.status as 'active' | 'inactive',
        max_study_halls: data.max_study_halls || 5,
        max_bookings_per_month: data.max_bookings_per_month || 100,
        priority_support: data.priority_support || false,
        analytics_access: data.analytics_access || false,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setPlans(prev => [...prev, transformedPlan]);
      toast({
        title: "Success",
        description: "Subscription plan created successfully",
      });
      return data;
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: "Error",
        description: "Failed to create subscription plan",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePlan = async (id: string, updates: Partial<CreatePlanData>) => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const transformedPlan: SubscriptionPlan = {
        id: data.id,
        name: data.name,
        price: data.price,
        duration: data.duration as 'monthly' | 'yearly',
        features: Array.isArray(data.features) ? data.features.map(String) : [],
        status: data.status as 'active' | 'inactive',
        max_study_halls: data.max_study_halls || 5,
        max_bookings_per_month: data.max_bookings_per_month || 100,
        priority_support: data.priority_support || false,
        analytics_access: data.analytics_access || false,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setPlans(prev => prev.map(plan => plan.id === id ? transformedPlan : plan));
      toast({
        title: "Success",
        description: "Subscription plan updated successfully",
      });
      return data;
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: "Error",
        description: "Failed to update subscription plan",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPlans(prev => prev.filter(plan => plan.id !== id));
      toast({
        title: "Success",
        description: "Subscription plan deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete subscription plan",
        variant: "destructive",
      });
      throw error;
    }
  };

  const togglePlanStatus = async (id: string) => {
    const plan = plans.find(p => p.id === id);
    if (!plan) return;

    const newStatus = plan.status === 'active' ? 'inactive' : 'active';
    await updatePlan(id, { status: newStatus });
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    loading,
    createPlan,
    updatePlan,
    deletePlan,
    togglePlanStatus,
    refreshPlans: fetchPlans,
  };
};