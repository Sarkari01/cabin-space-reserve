import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface Institution {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface InstitutionStats {
  total_institutions: number;
  active_institutions: number;
  total_news_posts: number;
}

export function useInstitutions() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [currentInstitution, setCurrentInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InstitutionStats>({
    total_institutions: 0,
    active_institutions: 0,
    total_news_posts: 0
  });
  const { toast } = useToast();
  const { user, userRole, loading: authLoading } = useAuth();

  // Fetch all institutions (admin only)
  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstitutions(data || []);
    } catch (error: any) {
      console.error('Error fetching institutions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch institutions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch current user's institution
  const fetchCurrentInstitution = async () => {
    if (!user) {
      console.log('fetchCurrentInstitution: No user available');
      return;
    }
    
    try {
      console.log('fetchCurrentInstitution: Starting fetch for user:', user.id);
      setLoading(true);
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('fetchCurrentInstitution: Database error:', error);
        throw error;
      }
      
      console.log('fetchCurrentInstitution: Found institution:', data);
      setCurrentInstitution(data);
    } catch (error: any) {
      console.error('Error fetching current institution:', error);
      toast({
        title: "Error",
        description: "Failed to fetch institution details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create institution
  const createInstitution = async (institutionData: any) => {
    try {
      const { data, error } = await supabase
        .from('institutions')
        .insert(institutionData)
        .select()
        .single();

      if (error) throw error;

      setInstitutions(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Institution created successfully",
      });
      return data;
    } catch (error: any) {
      console.error('Error creating institution:', error);
      toast({
        title: "Error",
        description: "Failed to create institution",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update institution
  const updateInstitution = async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('institutions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setInstitutions(prev => 
        prev.map(inst => inst.id === id ? data : inst)
      );
      
      if (currentInstitution?.id === id) {
        setCurrentInstitution(data);
      }

      toast({
        title: "Success",
        description: "Institution updated successfully",
      });
      return data;
    } catch (error: any) {
      console.error('Error updating institution:', error);
      toast({
        title: "Error",
        description: "Failed to update institution",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Toggle institution status
  const toggleInstitutionStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    return updateInstitution(id, { status: newStatus });
  };

  // Fetch institution statistics
  const fetchStats = async () => {
    try {
      // Get institution count
      const { count: totalCount } = await supabase
        .from('institutions')
        .select('*', { count: 'exact', head: true });

      const { count: activeCount } = await supabase
        .from('institutions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get news posts count
      const { count: newsCount } = await supabase
        .from('news_posts')
        .select('*', { count: 'exact', head: true })
        .not('institution_id', 'is', null);

      setStats({
        total_institutions: totalCount || 0,
        active_institutions: activeCount || 0,
        total_news_posts: newsCount || 0
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  // Get news count for each institution
  const getInstitutionNewsCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('news_posts')
        .select('institution_id')
        .not('institution_id', 'is', null);

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach(post => {
        if (post.institution_id) {
          counts[post.institution_id] = (counts[post.institution_id] || 0) + 1;
        }
      });

      return counts;
    } catch (error: any) {
      console.error('Error fetching news counts:', error);
      return {};
    }
  };

  useEffect(() => {
    console.log('useInstitutions useEffect triggered:', { 
      user: !!user, 
      userRole, 
      authLoading 
    });

    // Don't do anything if auth is still loading
    if (authLoading) {
      console.log('useInstitutions: Auth still loading, waiting...');
      return;
    }

    // Don't do anything if user is not available
    if (!user) {
      console.log('useInstitutions: No user available, setting loading to false');
      setLoading(false);
      return;
    }

    // Wait for userRole to be available
    if (!userRole) {
      console.log('useInstitutions: User role not yet available, waiting...');
      return;
    }

    console.log('useInstitutions: Processing user with role:', userRole);

    if (userRole === 'admin') {
      console.log('useInstitutions: Fetching data for admin user');
      fetchInstitutions();
      fetchStats();
    } else if (userRole === 'institution') {
      console.log('useInstitutions: Fetching current institution for institution user');
      fetchCurrentInstitution();
    } else {
      console.log('useInstitutions: User role not admin or institution, setting loading to false');
      setLoading(false);
    }
  }, [user, userRole, authLoading]);

  return {
    institutions,
    currentInstitution,
    loading,
    stats,
    fetchInstitutions,
    fetchCurrentInstitution,
    createInstitution,
    updateInstitution,
    toggleInstitutionStatus,
    fetchStats,
    getInstitutionNewsCounts
  };
}