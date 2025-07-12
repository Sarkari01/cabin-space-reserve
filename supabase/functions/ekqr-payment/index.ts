import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { action, transactionId, amount, bookingId } = await req.json();

    switch (action) {
      case 'createQR':
        return await createQRCode(amount, bookingId);
      case 'checkStatus':
        return await checkPaymentStatus(transactionId);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('EKQR Payment Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function createQRCode(amount: number, bookingId: string) {
  // Get EKQR API key from business settings
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data: settings, error } = await supabase
    .from('business_settings')
    .select('ekqr_api_key')
    .single();

  if (error || !settings?.ekqr_api_key) {
    throw new Error('EKQR API Key not configured in business settings');
  }

  // EKQR API call based on official documentation
  const response = await fetch('https://api.ekqr.in/api/qrcode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_key': settings.ekqr_api_key,
    },
    body: JSON.stringify({
      amount: amount,
      reference_id: `BOOKING_${bookingId}`
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to create QR code: ${errorData}`);
  }

  const data = await response.json();
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      qr_id: data.qr_id,
      qr_image_url: data.qr_image_url,
      reference_id: data.reference_id,
      amount: data.amount
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function checkPaymentStatus(qrId: string) {
  // Get EKQR API key from business settings
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data: settings } = await supabase
    .from('business_settings')
    .select('ekqr_api_key')
    .single();

  if (!settings?.ekqr_api_key) {
    throw new Error('EKQR API Key not configured');
  }

  // Check EKQR payment status based on official documentation
  const response = await fetch(`https://api.ekqr.in/api/transaction/${qrId}`, {
    headers: {
      'api_key': settings.ekqr_api_key,
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to check payment status: ${errorData}`);
  }

  const data = await response.json();
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      status: data.status, // 'pending', 'success', 'failed'
      qr_id: data.qr_id,
      reference_id: data.reference_id,
      amount: data.amount,
      transaction_id: data.transaction_id
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}