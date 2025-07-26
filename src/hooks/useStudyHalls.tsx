import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { StudyHallData as StudyHall, Seat } from '@/types/StudyHall';

// Utility function to wait for authentication context to be established
const waitForAuth = async (maxAttempts = 5, delay = 1000) => {
  for (let i = 0; i < maxAttempts; i++) {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.access_token) {
      console.log(`Authentication context established after ${i + 1} attempts`);
      return sessionData.session;
    }
    console.log(`Waiting for auth context, attempt ${i + 1}/${maxAttempts}`);
    if (i < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Failed to establish authentication context after maximum attempts');
};

// Utility function to test RLS access with retry logic
const testRLSAccess = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabase
        .from('study_halls')
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          throw new Error('Authentication context not properly established - RLS access denied');
        }
        throw error;
      }
      
      console.log(`RLS access test successful on attempt ${i + 1}`);
      return true;
    } catch (error) {
      console.log(`RLS access test failed, attempt ${i + 1}/${retries}:`, error);
      if (i === retries - 1) throw error;
      
      // Wait before retry and refresh session
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      await supabase.auth.refreshSession();
    }
  }
};

export const useStudyHalls = () => {
  const [studyHalls, setStudyHalls] = useState<StudyHall[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();
  const { toast } = useToast();

  const fetchStudyHalls = async () => {
    try {
      setLoading(true);
      
      // Ensure we have an authenticated session
      if (!session || !user) {
        console.log('No authenticated session available for study halls fetch');
        setStudyHalls([]);
        return;
      }

      // Verify session is still valid
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error('Session validation failed:', sessionError);
        toast({
          title: "Authentication Error",
          description: "Please log in again to continue",
          variant: "destructive",
        });
        return;
      }

      console.log('Fetching study halls with authenticated user:', user.id);
      
      let query = supabase
        .from('study_halls')
        .select('*');
      
      // If user is a merchant, only fetch their study halls
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (profile?.role === 'merchant') {
          query = query.eq('merchant_id', user.id);
        }
      }
      
      const { data: studyHallsData, error: studyHallsError } = await query.order('created_at', { ascending: false });
      
      if (studyHallsError) throw studyHallsError;
      
      // Fetch incharges separately
      const { data: inchargesData, error: inchargesError } = await supabase
        .from('incharges')
        .select('id, full_name, email, mobile, status, permissions, assigned_study_halls, merchant_id')
        .eq('status', 'active');
      
      if (inchargesError) {
        console.error('Error fetching incharges:', inchargesError);
        // Continue without incharges data instead of failing completely
      }
      
      // Debug logging
      console.log('Raw study halls data:', studyHallsData);
      console.log('Raw incharges data:', inchargesData);
      
      // Transform the data to include relevant incharges for each study hall
      const transformedData = (studyHallsData || []).map(hall => {
        console.log(`\n=== Processing study hall: ${hall.name} (ID: ${hall.id}) ===`);
        
        // Find incharges assigned to this specific study hall
        const assignedIncharges = (inchargesData || []).filter(incharge => {
          console.log(`\nChecking incharge: ${incharge.full_name} (ID: ${incharge.id})`);
          console.log('  - assigned_study_halls raw:', incharge.assigned_study_halls);
          console.log('  - Type:', typeof incharge.assigned_study_halls);
          console.log('  - Is Array:', Array.isArray(incharge.assigned_study_halls));
          console.log('  - Target hall ID:', hall.id);
          
          // Supabase returns JSONB columns as JavaScript arrays, not JSON strings
          let studyHallIds: string[] = [];
          
          try {
            if (incharge.assigned_study_halls) {
              if (Array.isArray(incharge.assigned_study_halls)) {
                // Supabase JSONB returns as JS array - this is the expected case
                studyHallIds = incharge.assigned_study_halls.map(id => String(id));
                console.log('  - Processed as array:', studyHallIds);
              } else {
                console.warn('  - Unexpected data type for assigned_study_halls:', typeof incharge.assigned_study_halls);
                studyHallIds = [];
              }
            } else {
              console.log('  - No assigned study halls');
              studyHallIds = [];
            }
          } catch (error) {
            console.error('  - Error processing assigned_study_halls:', error);
            studyHallIds = [];
          }
          
          const isAssigned = studyHallIds.includes(hall.id);
          console.log('  - Final studyHallIds:', studyHallIds);
          console.log('  - Is assigned to this hall:', isAssigned);
          
          return isAssigned;
        });

        console.log(`\n✅ Found ${assignedIncharges.length} incharges for ${hall.name}`);
        if (assignedIncharges.length > 0) {
          console.log('   Assigned incharges:', assignedIncharges.map(i => i.full_name));
        }

        return {
          ...hall,
          amenities: Array.isArray(hall.amenities) ? hall.amenities : [],
          incharges: assignedIncharges
        };
      }) as StudyHall[];
      
      console.log('\n🏁 Final transformed data with incharges:', transformedData.map(h => ({
        name: h.name,
        id: h.id,
        inchargeCount: h.incharges?.length || 0,
        inchargeNames: h.incharges?.map(i => i.full_name) || []
      })));
      
      setStudyHalls(transformedData);
    } catch (error: any) {
      console.error('Error fetching study halls:', error);
      toast({
        title: "Error",
        description: "Failed to fetch study halls",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createStudyHall = async (studyHallData: Omit<StudyHall, 'id' | 'merchant_id' | 'created_at' | 'updated_at'>) => {
    try {
      // First, ensure we have basic authentication
      if (!session || !user) {
        throw new Error('User not authenticated');
      }

      console.log('🔐 Starting study hall creation with enhanced auth validation...');
      
      // Step 1: Wait for proper authentication context to be established
      console.log('⏳ Waiting for authentication context...');
      let validSession;
      try {
        validSession = await waitForAuth(5, 1000);
        console.log('✅ Authentication context established:', {
          hasToken: !!validSession.access_token,
          userId: validSession.user?.id,
          expiresAt: validSession.expires_at
        });
      } catch (authError) {
        console.error('❌ Authentication context failed:', authError);
        throw new Error('Failed to establish authentication context. Please refresh the page and try again.');
      }

      // Step 2: Test RLS access with retry logic
      console.log('🔒 Testing RLS access...');
      try {
        await testRLSAccess(3);
        console.log('✅ RLS access confirmed');
      } catch (rlsError) {
        console.error('❌ RLS access failed:', rlsError);
        // If it's the misleading "relation does not exist" error, provide better context
        if (rlsError.message.includes('relation') && rlsError.message.includes('does not exist')) {
          throw new Error('Authentication context lost. Please refresh the page and try again.');
        }
        throw rlsError;
      }

      // Step 3: Check subscription limits
      console.log('📋 Checking subscription limits...');
      const { data: limitsData, error: limitsError } = await supabase
        .rpc('get_merchant_subscription_limits', {
          p_merchant_id: user.id
        });

      if (limitsError) {
        console.error('Error checking subscription limits:', limitsError);
        throw new Error('Failed to verify subscription limits. Please try again.');
      }

      const limits = limitsData?.[0];
      if (!limits?.can_create_study_hall) {
        let message = '';
        
        if (limits?.is_trial && limits?.trial_expires_at) {
          const expiryDate = new Date(limits.trial_expires_at);
          if (expiryDate < new Date()) {
            message = 'Your trial has expired. Please upgrade to continue creating study halls.';
          } else {
            message = `Trial users are limited to ${limits.max_study_halls} study hall${limits.max_study_halls === 1 ? '' : 's'}.`;
          }
        } else if (limits?.current_study_halls >= limits?.max_study_halls) {
          message = `You've reached your limit of ${limits.max_study_halls} study hall${limits.max_study_halls === 1 ? '' : 's'}. Upgrade to Premium for unlimited study halls.`;
        } else {
          message = 'Please subscribe to a plan to create study halls.';
        }

        toast({
          title: "Study Hall Limit Reached",
          description: message,
          variant: "destructive"
        });
        
        return { data: null, error: { message } };
      }

      // Step 4: Proceed with creation
      console.log('🏗️ Creating study hall with validated context...');
      const { data, error } = await supabase
        .from('study_halls')
        .insert([{
          ...studyHallData,
          merchant_id: user.id,
        }])
        .select()
        .single();
        
      if (error) {
        console.error('❌ Database insert error:', error);
        
        // Provide better error messages for common issues
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          throw new Error('Authentication session expired during creation. Please refresh the page and try again.');
        }
        
        throw new Error(error.message || 'Failed to create study hall');
      }
      
      console.log('✅ Study hall created successfully:', data);
      
      // Refresh the study halls list
      await fetchStudyHalls();
      
      toast({
        title: "Success",
        description: "Study hall created successfully",
      });
      
      return { data, error: null };
      
    } catch (error: any) {
      console.error('🚨 Study hall creation failed:', error);
      
      // Provide user-friendly error messages
      let errorMessage = error.message || "Failed to create study hall";
      
      if (error.message.includes('authentication') || error.message.includes('session')) {
        errorMessage = "Authentication issue detected. Please refresh the page and try again.";
      } else if (error.message.includes('RLS') || error.message.includes('access denied')) {
        errorMessage = "Database access denied. Please log out and log in again.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { data: null, error };
    }
  };

  const updateStudyHall = async (id: string, updates: Partial<StudyHall>) => {
    try {
      const { data, error } = await supabase
        .from('study_halls')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      await fetchStudyHalls();
      toast({
        title: "Success",
        description: "Study hall updated successfully. Seats are being synchronized...",
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update study hall",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteStudyHall = async (id: string) => {
    try {
      const { error } = await supabase
        .from('study_halls')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      await fetchStudyHalls();
      toast({
        title: "Success",
        description: "Study hall deleted successfully",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete study hall",
        variant: "destructive",
      });
      return { error };
    }
  };

  const toggleStudyHallStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('study_halls')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      await fetchStudyHalls();
      toast({
        title: "Success",
        description: `Study hall ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update study hall status",
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    if (session && user) {
      fetchStudyHalls();
    }
  }, [user, session]);

  return {
    studyHalls,
    loading,
    fetchStudyHalls,
    createStudyHall,
    updateStudyHall,
    deleteStudyHall,
    toggleStudyHallStatus,
  };
};

export const useSeats = (studyHallId?: string) => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSeats = async (hallId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('seats')
        .select('*')
        .eq('study_hall_id', hallId)
        .order('row_name')
        .order('seat_number');
        
      if (error) throw error;
      setSeats(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch seats",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studyHallId) {
      fetchSeats(studyHallId);
    }
  }, [studyHallId]);

  // Real-time subscription for seat updates with debouncing
  useEffect(() => {
    if (!studyHallId) return;

    let debounceTimer: NodeJS.Timeout;

    const channel = supabase
      .channel(`seats-changes-${studyHallId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seats',
          filter: `study_hall_id=eq.${studyHallId}`
        },
        (payload) => {
          // Debounce rapid updates to prevent excessive re-renders
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            fetchSeats(studyHallId);
          }, 500);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [studyHallId]);

  return {
    seats,
    loading,
    fetchSeats,
  };
};