import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SMSRequest {
  to: string;
  template_purpose: string;
  variables: Record<string, string>;
  user_id?: string;
}

interface SMSTemplate {
  id: string;
  message_template: string;
  template_id: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { to, template_purpose, variables, user_id }: SMSRequest = await req.json();

    if (!to || !template_purpose) {
      throw new Error('Missing required parameters: to, template_purpose');
    }

    console.log(`SMS Request: ${template_purpose} to ${to}`);

    // Get business settings for SMS configuration
    const { data: settings, error: settingsError } = await supabase
      .from('business_settings')
      .select('sms_enabled, sms_username, sms_password, sms_sender_id, sms_merchant_enabled, sms_user_enabled, sms_otp_enabled, sms_booking_confirmations_enabled, sms_login_credentials_enabled')
      .single();

    if (settingsError) {
      throw new Error(`Failed to get SMS settings: ${settingsError.message}`);
    }

    if (!settings.sms_enabled) {
      console.log('SMS is disabled in settings');
      return new Response(
        JSON.stringify({ success: false, message: 'SMS is disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check specific SMS type settings
    const smsTypeEnabled = {
      'merchant_created': settings.sms_merchant_enabled && settings.sms_login_credentials_enabled,
      'user_created': settings.sms_user_enabled && settings.sms_login_credentials_enabled,
      'booking_confirmation': settings.sms_booking_confirmations_enabled,
      'otp_verification': settings.sms_otp_enabled,
      'password_reset': settings.sms_login_credentials_enabled,
      'merchant_approved': settings.sms_merchant_enabled,
      'booking_alert_merchant': settings.sms_merchant_enabled && settings.sms_booking_confirmations_enabled,
    };

    if (!smsTypeEnabled[template_purpose as keyof typeof smsTypeEnabled]) {
      console.log(`SMS type ${template_purpose} is disabled`);
      return new Response(
        JSON.stringify({ success: false, message: `SMS type ${template_purpose} is disabled` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get SMS template
    const { data: template, error: templateError } = await supabase
      .from('sms_templates')
      .select('id, message_template, template_id')
      .eq('purpose', template_purpose)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      throw new Error(`SMS template not found for purpose: ${template_purpose}`);
    }

    // Replace variables in template
    let message = template.message_template;
    for (const [key, value] of Object.entries(variables)) {
      message = message.replace(new RegExp(`{${key}}`, 'g'), value);
    }

    console.log(`Sending SMS: ${message.substring(0, 50)}...`);

    // Send SMS via SMSStriker API
    const smsUrl = new URL('https://www.smsstriker.com/API/sms.php');
    smsUrl.searchParams.set('username', settings.sms_username);
    smsUrl.searchParams.set('password', settings.sms_password);
    smsUrl.searchParams.set('from', settings.sms_sender_id);
    smsUrl.searchParams.set('to', to);
    smsUrl.searchParams.set('msg', message);
    smsUrl.searchParams.set('type', '1');
    
    if (template.template_id) {
      smsUrl.searchParams.set('template_id', template.template_id);
    }

    const smsResponse = await fetch(smsUrl.toString());
    const smsResponseText = await smsResponse.text();
    
    console.log(`SMS Response: ${smsResponseText}`);

    // Parse response - SMSStriker returns "Ack: Messages has been sent" for success
    const isSuccess = smsResponseText.includes('Messages has been sent') || 
                     smsResponseText.includes('Ack:') ||
                     smsResponseText.toLowerCase().includes('ok') || 
                     smsResponseText.toLowerCase().includes('success');
    const status = isSuccess ? 'sent' : 'failed';

    // Log SMS attempt
    const { error: logError } = await supabase
      .from('sms_logs')
      .insert({
        recipient_phone: to,
        message: message,
        template_purpose: template_purpose,
        template_id: template.template_id,
        status: status,
        response_data: { 
          response: smsResponseText,
          url: smsUrl.toString().replace(settings.sms_password, '***')
        },
        error_message: isSuccess ? null : smsResponseText,
        user_id: user_id || null,
        sent_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Failed to log SMS:', logError);
    }

    return new Response(
      JSON.stringify({
        success: isSuccess,
        message: isSuccess ? 'SMS sent successfully' : 'SMS failed to send',
        response: smsResponseText,
        log_id: null // Could return the log ID if needed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SMS Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});