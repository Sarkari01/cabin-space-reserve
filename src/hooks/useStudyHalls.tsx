import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { StudyHallData as StudyHall, CreateStudyHallData, Seat } from '@/types/StudyHall';

export const useStudyHalls = () => {
  const [studyHalls, setStudyHalls] = useState<StudyHall[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchStudyHalls = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching study halls for user:', user?.id);
      
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
          
        console.log('👤 User profile:', profile);
          
        if (profile?.role === 'merchant') {
          query = query.eq('merchant_id', user.id);
          console.log('🏪 Fetching study halls for merchant:', user.id);
        }
      }
      
      const { data: studyHallsData, error: studyHallsError } = await query.order('created_at', { ascending: false });
      
      if (studyHallsError) {
        console.error('❌ Error fetching study halls:', studyHallsError);
        throw studyHallsError;
      }
      
      console.log('📊 Raw study halls fetched:', studyHallsData?.length || 0);
      
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
          // Remove complex features for now
        };
      }) as StudyHall[];
      
      console.log('\n🏁 Final transformed data with incharges:', transformedData.map(h => ({
        name: h.name,
        id: h.id,
        inchargeCount: 0,
        inchargeNames: []
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

  const createStudyHall = async (studyHallData: CreateStudyHallData) => {
    if (!user) {
      const error = new Error('User not authenticated');
      console.error('Create study hall failed:', error);
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return { data: null, error };
    }
    
    console.log('🚀 Creating study hall with data:', studyHallData);
    
    // Step 1: Verify and refresh session before database operations
    console.log('🔍 Verifying session state...');
    
    // Get current session
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      toast({
        title: "Authentication Error",
        description: "Please log out and log in again",
        variant: "destructive"
      });
      return { data: null, error: sessionError };
    }

    if (!currentSession || !currentSession.user) {
      console.error('❌ No valid session found');
      toast({
        title: "Authentication Error", 
        description: "Please log out and log in again",
        variant: "destructive"
      });
      return { data: null, error: new Error('No valid session') };
    }

    // Step 2: Refresh session to ensure it's current
    console.log('🔄 Refreshing session...');
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error('❌ Session refresh error:', refreshError);
      toast({
        title: "Authentication Error",
        description: "Session refresh failed. Please log in again",
        variant: "destructive" 
      });
      return { data: null, error: refreshError };
    }

    // Step 3: Comprehensive authentication debugging
    console.log('🔍 Session Debug Info:', {
      originalUser: user?.id,
      currentSessionUserId: currentSession?.user?.id,
      refreshedSessionUserId: refreshedSession?.user?.id,
      sessionValid: !!refreshedSession,
      accessToken: refreshedSession?.access_token ? 'present' : 'missing',
      expiresAt: refreshedSession?.expires_at,
      userRole: refreshedSession?.user?.user_metadata?.role
    });

    // Step 4: Test database connection with auth context
    console.log('🔍 Testing authenticated database access...');
    try {
      const { data: authTest, error: authTestError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', refreshedSession.user.id)
        .single();
      
      console.log('✅ Auth test result:', { authTest, authTestError });
      
      if (authTestError) {
        console.error('❌ Authenticated database access failed:', authTestError);
        toast({
          title: "Database Access Error",
          description: `Authentication context issue: ${authTestError.message}`,
          variant: "destructive"
        });
        return { data: null, error: authTestError };
      }

      if (authTest?.role !== 'merchant') {
        console.error('❌ User is not a merchant:', authTest);
        toast({
          title: "Permission Error", 
          description: "Only merchants can create study halls",
          variant: "destructive"
        });
        return { data: null, error: new Error('User is not a merchant') };
      }

    } catch (authTestException: any) {
      console.error('❌ Auth test exception:', authTestException);
      toast({
        title: "Database Error",
        description: `Auth verification failed: ${authTestException.message}`,
        variant: "destructive"
      });
      return { data: null, error: authTestException };
    }

    // Check subscription limits before creating
    try {
      console.log('🔍 Checking subscription limits for user:', user.id);
      const { data: limitsData, error: limitsError } = await supabase
        .rpc('get_merchant_subscription_limits', {
          p_merchant_id: user.id
        });

      if (limitsError) {
        console.error('Error checking subscription limits:', limitsError);
        toast({
          title: "Error",
          description: "Failed to verify subscription limits",
          variant: "destructive"
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

      // Validate required fields first
      const monthlyPrice = Number(studyHallData.monthly_price);
      const totalSeats = Number(studyHallData.total_seats);
      const rows = Number(studyHallData.rows);
      const seatsPerRow = Number(studyHallData.seats_per_row);

      if (!studyHallData.name?.trim()) {
        throw new Error('Study hall name is required');
      }
      if (!studyHallData.location?.trim()) {
        throw new Error('Location is required');
      }
      if (!monthlyPrice || monthlyPrice <= 0) {
        throw new Error('Monthly price must be greater than 0');
      }
      if (!totalSeats || totalSeats <= 0) {
        throw new Error('Total seats must be greater than 0');
      }
      if (!rows || rows <= 0) {
        throw new Error('Number of rows must be greater than 0');
      }
      if (!seatsPerRow || seatsPerRow <= 0) {
        throw new Error('Seats per row must be greater than 0');
      }

      // Prepare data for database insertion - only include meaningful values
      const dbData: any = {
        name: studyHallData.name.trim(),
        location: studyHallData.location.trim(),
        total_seats: totalSeats,
        rows: rows,
        seats_per_row: seatsPerRow,
        monthly_price: monthlyPrice,
        merchant_id: user.id,
      };

      // Only include optional fields if they have meaningful values
      if (studyHallData.description?.trim()) {
        dbData.description = studyHallData.description.trim();
      }
      
      if (studyHallData.formatted_address?.trim()) {
        dbData.formatted_address = studyHallData.formatted_address.trim();
      }

      // Handle optional fields - only include if provided
      if (studyHallData.custom_row_names && studyHallData.custom_row_names.length > 0) {
        const filteredNames = studyHallData.custom_row_names.filter(name => name?.trim());
        if (filteredNames.length > 0) {
          dbData.custom_row_names = filteredNames;
        }
      }

      if (studyHallData.amenities && studyHallData.amenities.length > 0) {
        dbData.amenities = studyHallData.amenities;
      }

      if (studyHallData.image_url?.trim()) {
        dbData.image_url = studyHallData.image_url.trim();
      }

      if (studyHallData.latitude && studyHallData.longitude) {
        dbData.latitude = Number(studyHallData.latitude);
        dbData.longitude = Number(studyHallData.longitude);
      }

      if (studyHallData.status) {
        dbData.status = studyHallData.status;
      }

      // Remove complex layout features for now

      console.log('📤 Sending to database:', dbData);

      const { data, error } = await supabase
        .from('study_halls')
        .insert([dbData])
        .select()
        .single();
        
      if (error) {
        console.error('❌ Database insert error:', error);
        throw error;
      }
      
      console.log('✅ Study hall created successfully:', data);
      
      // Force refresh the study halls list
      console.log('🔄 Refreshing study halls list...');
      await fetchStudyHalls();
      
      toast({
        title: "Success",
        description: `Study hall "${data.name}" created successfully`,
      });
      
      return { data, error: null };
      } catch (error: any) {
        // Log complete error details for debugging
        console.error('❌ Create study hall error (FULL DETAILS):', {
          error,
          errorMessage: error?.message,
          errorCode: error?.code,
          errorDetails: error?.details,
          errorHint: error?.hint,
          stack: error?.stack,
          userData: {
            userId: user.id,
            userEmail: user?.email
          }
        });
        
        // Show the actual error message to help identify the real issue
        const actualErrorMessage = error?.message || "Unknown error occurred";
        
        toast({
          title: "Database Error", 
          description: `${actualErrorMessage} (Code: ${error?.code || 'unknown'})`,
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
    fetchStudyHalls();
  }, [user]);

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