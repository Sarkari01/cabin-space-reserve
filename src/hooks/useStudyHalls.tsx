import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { StudyHallData as StudyHall, Seat } from '@/types/StudyHall';

// Enhanced session verification utility with JWT token refresh
const verifySession = async (): Promise<boolean> => {
  try {
    console.log('Starting enhanced session verification...');
    
    // First, try to refresh the session to ensure we have a valid JWT token
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.log('Session refresh failed, trying current session:', refreshError.message);
      // Fall back to getting the current session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !currentSession) {
        console.error('No valid session available:', sessionError?.message);
        return false;
      }
      // Use current session if refresh failed
      await supabase.auth.setSession(currentSession);
      console.log('Using current session for user:', currentSession.user.id);
    } else if (refreshedSession) {
      // Use refreshed session - this ensures JWT token is fresh
      await supabase.auth.setSession(refreshedSession);
      console.log('Using refreshed session for user:', refreshedSession.user.id);
    }

    // Additional step: Force the client to use the latest session context
    // by making a quick authenticated request to verify JWT is working
    const { data: authTest, error: authTestError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();
    
    if (authTestError && authTestError.code === 'PGRST116') {
      // PGRST116 means no rows found, which is fine - it means auth is working
      console.log('Session verification successful - auth context is working');
    } else if (authTestError) {
      console.error('Session verification failed - auth context not working:', authTestError);
      return false;
    } else {
      console.log('Session verification successful - found user profile');
    }
    
    return true;
  } catch (error) {
    console.error('Session verification failed:', error);
    return false;
  }
};

// Function to ensure database context is properly authenticated
const ensureAuthenticatedContext = async (userId: string): Promise<boolean> => {
  try {
    console.log('Ensuring authenticated context for user:', userId);
    
    // Step 1: Verify the session is properly set
    const sessionValid = await verifySession();
    if (!sessionValid) {
      console.error('Session validation failed');
      return false;
    }

    // Step 2: Test that auth.uid() works in database context
    // We'll do this by checking if we can access user's profile
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Database authentication context test failed:', error);
      
      // If it's a permission error, it means auth.uid() is returning null
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.error('Permission denied - auth.uid() is likely returning null');
        return false;
      }
      
      return false;
    }

    console.log('Database authentication context verified for user:', data.id);
    return true;
  } catch (error) {
    console.error('Failed to ensure authenticated context:', error);
    return false;
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
      console.log('Starting study hall creation process...');
      console.log('Current user:', user?.id);
      console.log('Current session:', session?.access_token ? 'exists' : 'missing');
      
      // Simple authentication check
      if (!user || !session) {
        console.error('User not authenticated');
        toast({
          title: "Authentication Required",
          description: "You must be logged in to create a study hall. Please sign in again.",
          variant: "destructive",
        });
        return { data: null, error: { message: 'User not authenticated' } };
      }

      // Ensure authenticated context with enhanced JWT verification
      console.log('Ensuring authenticated database context...');
      const authContextValid = await ensureAuthenticatedContext(user.id);
      if (!authContextValid) {
        console.error('Authentication context verification failed');
        toast({
          title: "Authentication Error",
          description: "Unable to verify your authentication. Please sign out and sign in again.",
          variant: "destructive",
        });
        return { data: null, error: { message: 'Authentication context failed' } };
      }
      
      console.log('Authentication context verified successfully');

      // Check subscription limits
      console.log('Checking subscription limits...');
      const { data: limitsData, error: limitsError } = await supabase
        .rpc('get_merchant_subscription_limits', {
          p_merchant_id: user.id
        });

      if (limitsError) {
        console.error('Error checking subscription limits:', limitsError);
        toast({
          title: "Error",
          description: "Failed to verify subscription limits. Please try again.",
          variant: "destructive",
        });
        return { data: null, error: limitsError };
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

      // Create the study hall
      console.log('Creating study hall with data:', studyHallData);
      console.log('Merchant ID:', user.id);
      
      // Test if study_halls table is accessible
      console.log('Testing study_halls table access...');
      const { data: testAccess, error: testAccessError } = await supabase
        .from('study_halls')
        .select('id')
        .limit(1);
      
      if (testAccessError) {
        console.error('Study halls table access test failed:', testAccessError);
        toast({
          title: "Database Table Error",
          description: `Cannot access study_halls table: ${testAccessError.message}`,
          variant: "destructive",
        });
        return { data: null, error: testAccessError };
      }
      
      console.log('Study halls table access test successful');
      
      // First try the normal database insert
      const { data, error } = await supabase
        .from('study_halls')
        .insert([{
          ...studyHallData,
          merchant_id: user.id,
        }])
        .select()
        .single();

      // If we get a "relation does not exist" error, use the secure function
      if (error && error.message.includes('relation "study_halls" does not exist')) {
        console.log('Direct insert failed, trying secure function...');
        
        const { data: functionData, error: functionError } = await supabase
          .rpc('create_study_hall_with_context', {
            p_name: studyHallData.name,
            p_description: studyHallData.description || '',
            p_location: studyHallData.location,
            p_total_seats: studyHallData.total_seats,
            p_rows: studyHallData.rows,
            p_seats_per_row: studyHallData.seats_per_row,
            p_monthly_price: studyHallData.monthly_price,
            p_amenities: studyHallData.amenities ? JSON.stringify(studyHallData.amenities) : '[]',
            p_custom_row_names: studyHallData.custom_row_names || [],
            p_formatted_address: studyHallData.formatted_address,
            p_latitude: studyHallData.latitude,
            p_longitude: studyHallData.longitude,
            p_image_url: studyHallData.image_url
          });

        if (functionError) {
          console.error('Function call error:', functionError);
          toast({
            title: "Error",
            description: `Failed to create study hall via function: ${functionError.message}`,
            variant: "destructive",
          });
          return { data: null, error: functionError };
        }

        // Type guard for function response
        const response = functionData as any;
        if (!response?.success) {
          console.error('Function returned error:', response);
          toast({
            title: "Error",
            description: `Failed to create study hall: ${response?.error || 'Unknown error'}`,
            variant: "destructive",
          });
          return { data: null, error: { message: response?.error || 'Unknown error' } };
        }

        console.log('Study hall created successfully via function:', response.data);
        toast({
          title: "Success",
          description: "Study hall created successfully",
        });
        
        // Refresh the study halls list
        await fetchStudyHalls();
        
        return { data: response.data, error: null };
      } else if (error) {
        console.error('Study hall creation error:', error);
        toast({
          title: "Error",
          description: `Failed to create study hall: ${error.message}`,
          variant: "destructive",
        });
        return { data: null, error };
      }

      console.log('Study hall created successfully:', data);
      toast({
        title: "Success",
        description: "Study hall created successfully",
      });
      
      // Refresh the study halls list
      await fetchStudyHalls();
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Unexpected error creating study hall:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
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