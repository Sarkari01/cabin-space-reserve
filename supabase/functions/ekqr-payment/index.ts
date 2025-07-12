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

    const requestBody = await req.json();
    console.log('[EKQR] Received request:', requestBody);
    const { action, transactionId, amount, bookingId } = requestBody;

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
  const requestBody = {
    amount: amount,
    purpose: 'Study Hall Booking',
    order_id: `BOOKING_${bookingId}`
  };
  
  console.log('[EKQR-PAYMENT] Making API request to EKQR');
  console.log('[EKQR-PAYMENT] Request URL: https://ekqr.co/api/ekqr');
  console.log('[EKQR-PAYMENT] Request body:', requestBody);
  console.log('[EKQR-PAYMENT] API key preview:', ekqrApiKey ? `${ekqrApiKey.substring(0, 8)}...` : 'NOT SET');
  
  const response = await fetch('https://ekqr.co/api/ekqr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ekqrApiKey,
    },
    body: JSON.stringify(requestBody),
  });

  console.log('[EKQR-PAYMENT] API response status:', response.status);
  console.log('[EKQR-PAYMENT] Response headers:', Object.fromEntries(response.headers.entries()));

  const responseText = await response.text();
  console.log('[EKQR-PAYMENT] Raw API response:', responseText);

  if (!response.ok) {
    console.error('[EKQR-PAYMENT] API Error - Status:', response.status);
    console.error('[EKQR-PAYMENT] API Error - Response:', responseText);
    
    // Provide more specific error messages based on status codes
    if (response.status === 401) {
      throw new Error(`Invalid EKQR API key. Status: ${response.status}, Response: ${responseText}`);
    } else if (response.status === 400) {
      throw new Error(`Invalid payment request. Status: ${response.status}, Response: ${responseText}`);
    } else if (response.status >= 500) {
      throw new Error(`EKQR service error. Status: ${response.status}, Response: ${responseText}`);
    }
    
    throw new Error(`Failed to create QR code. Status: ${response.status}, Response: ${responseText}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
    console.log('[EKQR-PAYMENT] Parsed response data:', data);
  } catch (parseError) {
    console.error('[EKQR-PAYMENT] Failed to parse response as JSON:', parseError);
    throw new Error(`Invalid API response format: ${responseText}`);
  }
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      qr_id: data.id,
      qr_image_url: data.qr_url,
      reference_id: data.order_id,
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
  console.log('[EKQR-PAYMENT] Making status check API request for QR ID:', qrId);
  console.log('[EKQR-PAYMENT] Status check URL:', `https://ekqr.co/api/ekqr/status/${qrId}`);
  console.log('[EKQR-PAYMENT] API key preview:', ekqrApiKey ? `${ekqrApiKey.substring(0, 8)}...` : 'NOT SET');
  
  const response = await fetch(`https://ekqr.co/api/ekqr/status/${qrId}`, {
    headers: {
      'x-api-key': ekqrApiKey,
    },
  });

  console.log('[EKQR-PAYMENT] Status check response status:', response.status);
  console.log('[EKQR-PAYMENT] Status check response headers:', Object.fromEntries(response.headers.entries()));

  const responseText = await response.text();
  console.log('[EKQR-PAYMENT] Status check raw response:', responseText);

  if (!response.ok) {
    console.error('[EKQR-PAYMENT] Status Check Error - Status:', response.status);
    console.error('[EKQR-PAYMENT] Status Check Error - Response:', responseText);
    
    if (response.status === 401) {
      throw new Error(`Invalid EKQR API key for status check. Status: ${response.status}, Response: ${responseText}`);
    } else if (response.status === 404) {
      throw new Error(`Payment transaction not found. Status: ${response.status}, Response: ${responseText}`);
    }
    
    throw new Error(`Failed to check payment status. Status: ${response.status}, Response: ${responseText}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
    console.log('[EKQR-PAYMENT] Status check parsed data:', data);
  } catch (parseError) {
    console.error('[EKQR-PAYMENT] Failed to parse status response as JSON:', parseError);
    throw new Error(`Invalid status response format: ${responseText}`);
  }
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      status: data.status, // 'pending', 'success', 'failed'
      qr_id: data.id,
      reference_id: data.order_id,
      amount: data.amount,
      transaction_id: data.reference_id
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}