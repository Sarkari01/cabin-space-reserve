import { useEffect } from 'react';
import { useSMS } from './useSMS';
import { supabase } from '@/integrations/supabase/client';

export const useUserNotifications = () => {
  const { sendWelcomeUserSMS, sendWelcomeMerchantSMS, sendMerchantApprovedSMS } = useSMS();

  useEffect(() => {
    // Listen for new user registrations
    const userChannel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        },
        async (payload) => {
          const profile = payload.new;
          
          try {
            // Check if SMS is enabled for user/merchant creation
            const { data: settings } = await supabase
              .rpc('get_public_business_settings');

            const s: any = settings as any;
            if (!s?.sms_enabled || !s?.sms_login_credentials_enabled) {
              return;
            }

            // Check if this is a welcome SMS scenario (would need password from auth flow)
            // This is typically handled in the registration process itself
            console.log('New user registered:', profile);
            
          } catch (error) {
            console.error('Error in user notification:', error);
          }
        }
      )
      .subscribe();

    // Listen for merchant approval status changes
    const merchantChannel = supabase
      .channel('merchant-approval-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'merchant_profiles',
          filter: 'verification_status=eq.approved'
        },
        async (payload) => {
          const merchantProfile = payload.new;
          const oldProfile = payload.old;
          
          // Only send if status changed from not approved to approved
          if (oldProfile?.verification_status !== 'approved' && merchantProfile.verification_status === 'approved') {
            try {
              // Check if SMS is enabled
              const { data: settings } = await supabase
                .rpc('get_public_business_settings');

              const s: any = settings as any;
              if (!s?.sms_enabled || !s?.sms_merchant_enabled) {
                return;
              }

              // Get merchant user profile
              const { data: profile } = await supabase
                .from('profiles')
                .select('phone, sms_notifications_enabled, full_name')
                .eq('id', merchantProfile.merchant_id)
                .single();

              if (profile?.phone && profile?.sms_notifications_enabled) {
                await sendMerchantApprovedSMS(
                  profile.phone,
                  profile.full_name || 'Merchant',
                  merchantProfile.merchant_id
                );
              }
            } catch (error) {
              console.error('Error sending merchant approval notification:', error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
      supabase.removeChannel(merchantChannel);
    };
  }, [sendWelcomeUserSMS, sendWelcomeMerchantSMS, sendMerchantApprovedSMS]);

  return null;
};