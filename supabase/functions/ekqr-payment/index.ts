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
  const EKQR_MERCHANT_ID = Deno.env.get('EKQR_MERCHANT_ID');

  if (!EKQR_API_KEY || !EKQR_MERCHANT_ID) {
    throw new Error('EKQR credentials not configured');
  }

  // TODO: Replace with actual EKQR API endpoint
  const response = await fetch('https://api.ekqr.in/qrcode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${EKQR_API_KEY}`,
    },
    body: JSON.stringify({
      merchantId: EKQR_MERCHANT_ID,
      amount: amount,
      orderId: `ORDER_${Date.now()}`,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create QR code');
  }

  const data = await response.json();
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      qrId: data.qrId,
      qrImage: data.qrImage,
      orderId: data.orderId
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

  // TODO: Replace with actual EKQR API endpoint
  const response = await fetch(`https://api.ekqr.in/transaction/${transactionId}`, {
    headers: {
      'Authorization': `Bearer ${EKQR_API_KEY}`,
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