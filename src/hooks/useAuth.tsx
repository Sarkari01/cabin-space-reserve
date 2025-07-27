
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useSMS } from './useSMS';

type UserProfile = Tables<'profiles'>;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  userRole: 'admin' | 'merchant' | 'student' | 'incharge' | 'telemarketing_executive' | 'pending_payments_caller' | 'customer_care_executive' | 'settlement_manager' | 'general_administrator' | 'institution' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'merchant' | 'student' | 'incharge' | 'telemarketing_executive' | 'pending_payments_caller' | 'customer_care_executive' | 'settlement_manager' | 'general_administrator' | 'institution' | null>(null);
  const [loading, setLoading] = useState(true);
  const { sendWelcomeUserSMS, sendWelcomeMerchantSMS } = useSMS();

  // Fetch user profile data
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for ID:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('Profile fetch result:', { data, error });

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      console.log('Setting user profile:', data, 'Role:', data.role);
      setUserProfile(data);
      setUserRole(data.role);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, 'Session exists:', !!session, 'User ID:', session?.user?.id);
        
        // Explicitly sync session with Supabase client for JWT token propagation
        if (session) {
          try {
            await supabase.auth.setSession({
              access_token: session.access_token,
              refresh_token: session.refresh_token
            });
            console.log('Session synchronized with Supabase client');
          } catch (error) {
            console.error('Failed to sync session with Supabase client:', error);
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('Fetching profile for user:', session.user.id);
          // Fetch user profile immediately when user is authenticated
          await fetchUserProfile(session.user.id);
        } else {
          // Clear profile data when user logs out
          setUserProfile(null);
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Initial session check:', !!session, session?.user?.id);
      
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        console.log('No initial session found');
        setUserProfile(null);
        setUserRole(null);
      }
      
      setLoading(false);
    };

    initializeAuth();
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData,
      },
    });

    // If signup was successful and we have user data, send welcome SMS
    if (!error && data?.user && userData?.phone) {
      console.log('Sending welcome SMS for new user:', userData);
      
      try {
        // Wait a moment for the profile to be created via trigger
        setTimeout(async () => {
          if (userData.role === 'merchant') {
            await sendWelcomeMerchantSMS(
              userData.phone,
              userData.full_name || 'User',
              email,
              'Please use your email and password to login', // Updated message
              data.user.id
            );
          } else {
            await sendWelcomeUserSMS(
              userData.phone,
              userData.full_name || 'User', 
              email,
              'Please use your email and password to login', // Updated message
              data.user.id
            );
          }
        }, 2000);
      } catch (smsError) {
        console.error('Failed to send welcome SMS:', smsError);
        // Don't fail the entire signup process if SMS fails
      }
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // Session refresh utility
  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Failed to refresh session:', error);
      return false;
    }
    return true;
  };

  const value = {
    user,
    session,
    userProfile,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
