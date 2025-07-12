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
  console.log('[EKQR-PAYMENT] Creating QR code for booking:', bookingId, 'Amount:', amount);
  
  // Get EKQR API key from Supabase secrets
  const ekqrApiKey = Deno.env.get('EKQR_API_KEY');
  
  if (!ekqrApiKey) {
    console.error('[EKQR-PAYMENT] EKQR_API_KEY not found in environment variables');
    throw new Error('EKQR payment service is not configured. Please contact support.');
  }

  console.log('[EKQR-PAYMENT] API key found, length:', ekqrApiKey.length);

  // EKQR API call based on official documentation
  console.log('[EKQR-PAYMENT] Making API request to EKQR');
  const response = await fetch('https://api.ekqr.in/api/qrcode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_key': ekqrApiKey,
    },
    body: JSON.stringify({
      amount: amount,
      reference_id: `BOOKING_${bookingId}`
    }),
  });

  console.log('[EKQR-PAYMENT] API response status:', response.status);

  if (!response.ok) {
    const errorData = await response.text();
    console.error('[EKQR-PAYMENT] API Error Response:', errorData);
    
    // Provide more specific error messages based on status codes
    if (response.status === 401) {
      throw new Error('Invalid EKQR API key. Please check your configuration.');
    } else if (response.status === 400) {
      throw new Error('Invalid payment amount or booking details.');
    } else if (response.status >= 500) {
      throw new Error('EKQR service is temporarily unavailable. Please try again later.');
    }
    
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
  console.log('[EKQR-PAYMENT] Checking payment status for QR ID:', qrId);
  
  // Get EKQR API key from Supabase secrets
  const ekqrApiKey = Deno.env.get('EKQR_API_KEY');
  
  if (!ekqrApiKey) {
    console.error('[EKQR-PAYMENT] EKQR_API_KEY not found in environment variables');
    throw new Error('EKQR payment service is not configured. Please contact support.');
  }

  // Check EKQR payment status based on official documentation
  console.log('[EKQR-PAYMENT] Making status check API request');
  const response = await fetch(`https://api.ekqr.in/api/transaction/${qrId}`, {
    headers: {
      'api_key': ekqrApiKey,
    },
  });

  console.log('[EKQR-PAYMENT] Status check response:', response.status);

  if (!response.ok) {
    const errorData = await response.text();
    console.error('[EKQR-PAYMENT] Status Check Error:', errorData);
    
    if (response.status === 401) {
      throw new Error('Invalid EKQR API key for status check.');
    } else if (response.status === 404) {
      throw new Error('Payment transaction not found.');
    }
    
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