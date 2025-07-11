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

    const { action, transactionId, amount } = await req.json();

    switch (action) {
      case 'createQR':
        return await createQRCode(amount);
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

async function createQRCode(amount: number) {
  const EKQR_API_KEY = Deno.env.get('EKQR_API_KEY');
  
  if (!EKQR_API_KEY) {
    throw new Error('EKQR API Key not configured in project secrets');
  }

  // Get merchant code from business settings
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data: settings, error } = await supabase
    .from('business_settings')
    .select('ekqr_merchant_code')
    .single();

  if (error || !settings?.ekqr_merchant_code) {
    throw new Error('EKQR Merchant Code not configured in business settings');
  }

  // EKQR API call based on documentation
  const response = await fetch('https://api.ekqr.in/api/qr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': EKQR_API_KEY,
    },
    body: JSON.stringify({
      merchant_code: settings.ekqr_merchant_code,
      amount: amount.toString(),
      order_id: `ORDER_${Date.now()}`,
      description: 'Study Hall Booking Payment',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create QR code');
  }

  const data = await response.json();
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      qrId: data.qr_id,
      qrImage: data.qr_code,
      orderId: data.order_id,
      paymentUrl: data.payment_url
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function checkPaymentStatus(transactionId: string) {
  const EKQR_API_KEY = Deno.env.get('EKQR_API_KEY');

  if (!EKQR_API_KEY) {
    throw new Error('EKQR credentials not configured');
  }

  // Check EKQR payment status
  const response = await fetch(`https://api.ekqr.in/api/status/${transactionId}`, {
    headers: {
      'x-api-key': EKQR_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to check payment status');
  }

  const data = await response.json();
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      status: data.status, // 'pending', 'completed', 'failed'
      transactionId: data.transactionId
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}