import { useEffect } from 'react';
import { useSMS } from './useSMS';
import { supabase } from '@/integrations/supabase/client';

export const useBookingNotifications = () => {
  const { sendBookingConfirmationSMS, sendBookingAlertToMerchantSMS } = useSMS();

  useEffect(() => {
    const channel = supabase
      .channel('booking-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: 'status=eq.confirmed'
        },
        async (payload) => {
          const booking = payload.new;
          
          // Check if status changed to confirmed and payment is paid
          if (booking.status === 'confirmed' && booking.payment_status === 'paid') {
            try {
              // Get business settings to check if SMS is enabled
              const { data: settings } = await supabase
                .rpc('get_public_business_settings');

              const s: any = settings as any;
              if (!s?.sms_enabled || !s?.sms_booking_confirmations_enabled) {
                return;
              }

              // Get user and study hall details
              const { data: userProfile } = await supabase
                .from('profiles')
                .select('phone, sms_notifications_enabled, full_name')
                .eq('id', booking.user_id)
                .single();

              const { data: studyHall } = await supabase
                .from('study_halls')
                .select('name, merchant_id')
                .eq('id', booking.study_hall_id)
                .single();

              // Send booking confirmation to user
              if (userProfile?.phone && userProfile?.sms_notifications_enabled) {
                await sendBookingConfirmationSMS(
                  userProfile.phone,
                  booking.booking_number?.toString() || booking.id,
                  booking.start_date,
                  booking.end_date,
                  booking.user_id
                );
              }

              // Send booking alert to merchant
              if (studyHall?.merchant_id) {
                const { data: merchantProfile } = await supabase
                  .from('profiles')
                  .select('phone, sms_notifications_enabled, full_name')
                  .eq('id', studyHall.merchant_id)
                  .single();

                if (merchantProfile?.phone && merchantProfile?.sms_notifications_enabled) {
                  await sendBookingAlertToMerchantSMS(
                    merchantProfile.phone,
                    userProfile?.full_name || 'Guest User',
                    studyHall.name,
                    booking.start_date,
                    booking.end_date,
                    booking.booking_number?.toString() || booking.id,
                    studyHall.merchant_id
                  );
                }
              }
            } catch (error) {
              console.error('Error sending booking notifications:', error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sendBookingConfirmationSMS, sendBookingAlertToMerchantSMS]);

  return null;
};