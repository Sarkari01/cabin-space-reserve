import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const EKQR_BASE_URL = 'https://api.ekqr.in/api/v2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { action, ...requestData } = await req.json();
    const ekqrApiKey = Deno.env.get('EKQR_API_KEY');

    if (!ekqrApiKey) {
      throw new Error('EKQR_API_KEY not configured');
    }

    console.log('EKQR request:', { action, requestData });

    switch (action) {
      case 'createOrder':
        return await createOrder(requestData, ekqrApiKey);
      case 'checkStatus':
        return await checkOrderStatus(requestData, ekqrApiKey);
      default:
        throw new Error(`Invalid action: ${action}`);
    }
  } catch (error) {
    console.error('EKQR Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createOrder(data: any, ekqrApiKey: string) {
  console.log('Creating EKQR order:', data);
  
  const requestBody = {
    key: ekqrApiKey,
    client_txn_id: data.bookingId,
    amount: data.amount.toString(),
    p_info: `Study Hall Booking - ${data.bookingId}`,
    customer_name: data.customerName || 'Customer',
    customer_email: data.customerEmail || 'customer@example.com',
    customer_mobile: data.customerMobile || '9999999999',
    redirect_url: data.redirectUrl || 'https://jseyxxsptcckjumjcljk.lovable.app/payment-success',
    udf1: `booking_id:${data.bookingId}`,
    udf2: `study_hall_id:${data.studyHallId || ''}`,
    udf3: `seat_id:${data.seatId || ''}`
  };

  console.log('EKQR request body:', requestBody);

  const response = await fetch(`${EKQR_BASE_URL}/create_order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  const responseData = await response.json();
  console.log('EKQR create order response:', responseData);
  
  if (!response.ok || !responseData.status) {
    throw new Error(responseData.msg || 'Failed to create EKQR order');
  }

  return new Response(
    JSON.stringify({
      success: true,
      orderId: responseData.data.order_id,
      paymentUrl: responseData.data.payment_url,
      sessionId: responseData.data.session_id,
      upiIntent: responseData.data.upi_intent,
      isUtrRequired: responseData.data.is_utr_required
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function checkOrderStatus(data: any, ekqrApiKey: string) {
  console.log('Checking EKQR order status:', data);
  
  const requestBody = {
    key: ekqrApiKey,
    client_txn_id: data.clientTxnId,
    txn_date: data.txnDate
  };

  console.log('EKQR status request body:', requestBody);

  const response = await fetch(`${EKQR_BASE_URL}/check_order_status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  const responseData = await response.json();
  console.log('EKQR status response:', responseData);
  
  if (!response.ok || !responseData.status) {
    throw new Error(responseData.msg || 'Failed to check order status');
  }

  return new Response(
    JSON.stringify({
      success: true,
      status: responseData.data.status,
      transactionId: responseData.data.id,
      amount: responseData.data.amount,
      customerVpa: responseData.data.customer_vpa,
      upiTxnId: responseData.data.upi_txn_id,
      remark: responseData.data.remark
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}