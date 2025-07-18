import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SendSMSRequest {
  to: string;
  template_purpose: string;
  variables: Record<string, string>;
  user_id?: string;
}

export interface SendSMSResponse {
  success: boolean;
  message: string;
  response?: string;
  log_id?: string;
}

export const useSMS = () => {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const sendSMS = async (request: SendSMSRequest): Promise<SendSMSResponse> => {
    setSending(true);
    try {
      console.log('Sending SMS:', request);
      
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: request
      });

      if (error) {
        console.error('SMS Error:', error);
        throw new Error(error.message || 'Failed to send SMS');
      }

      console.log('SMS Response:', data);
      
      if (data.success) {
        toast({
          title: "SMS Sent",
          description: "SMS sent successfully",
        });
      } else {
        toast({
          title: "SMS Failed",
          description: data.message || "Failed to send SMS",
          variant: "destructive",
        });
      }

      return data;
    } catch (error) {
      console.error('SMS service error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "SMS Error",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setSending(false);
    }
  };

  const sendWelcomeUserSMS = async (phone: string, name: string, email: string, password: string, user_id?: string) => {
    return await sendSMS({
      to: phone,
      template_purpose: 'user_created',
      variables: { name, email, password },
      user_id
    });
  };

  const sendWelcomeMerchantSMS = async (phone: string, name: string, email: string, password: string, user_id?: string) => {
    return await sendSMS({
      to: phone,
      template_purpose: 'merchant_created',
      variables: { name, email, password },
      user_id
    });
  };

  const sendOTPSMS = async (phone: string, otp: string, user_id?: string) => {
    return await sendSMS({
      to: phone,
      template_purpose: 'otp_verification',
      variables: { otp },
      user_id
    });
  };

  const sendBookingConfirmationSMS = async (
    phone: string, 
    booking_id: string, 
    start_date: string, 
    end_date: string, 
    user_id?: string
  ) => {
    return await sendSMS({
      to: phone,
      template_purpose: 'booking_confirmation',
      variables: { booking_id, start_date, end_date },
      user_id
    });
  };

  const sendPasswordResetSMS = async (phone: string, password: string, user_id?: string) => {
    return await sendSMS({
      to: phone,
      template_purpose: 'password_reset',
      variables: { password },
      user_id
    });
  };

  const sendMerchantApprovedSMS = async (phone: string, name: string, user_id?: string) => {
    return await sendSMS({
      to: phone,
      template_purpose: 'merchant_approved',
      variables: { name },
      user_id
    });
  };

  const sendBookingAlertToMerchantSMS = async (
    phone: string,
    user_name: string,
    study_hall: string,
    start_date: string,
    end_date: string,
    booking_id: string,
    user_id?: string
  ) => {
    return await sendSMS({
      to: phone,
      template_purpose: 'booking_alert_merchant',
      variables: { user_name, study_hall, start_date, end_date, booking_id },
      user_id
    });
  };

  return {
    sendSMS,
    sendWelcomeUserSMS,
    sendWelcomeMerchantSMS,
    sendOTPSMS,
    sendBookingConfirmationSMS,
    sendPasswordResetSMS,
    sendMerchantApprovedSMS,
    sendBookingAlertToMerchantSMS,
    sending
  };
};