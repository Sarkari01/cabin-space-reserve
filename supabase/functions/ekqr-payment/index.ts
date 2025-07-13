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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { action, ...requestData } = await req.json();
    const ekqrApiKey = Deno.env.get('EKQR_API_KEY');

    if (!ekqrApiKey) {
      throw new Error('EKQR_API_KEY not configured');
    }

    console.log('EKQR request:', { action, requestData });

    switch (action) {
      case 'createOrder':
        return await createOrder(requestData, ekqrApiKey, req);
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

async function createOrder(data: any, ekqrApiKey: string, req: Request) {
  console.log('Creating EKQR order:', data);
  
  // Use the user's real domain for redirect URL
  const userDomain = 'https://sarkarininja.com';
  const redirectUrl = data.redirectUrl || `${userDomain}/payment-success?booking_id=${data.bookingId}&amount=${data.amount}&study_hall_id=${data.studyHallId || ''}`;
  
  console.log('Using redirect URL:', redirectUrl);
  
  const requestBody = {
    key: ekqrApiKey,
    client_txn_id: data.bookingId,
    amount: data.amount.toString(),
    p_info: `Study Hall Booking - ${data.bookingId}`,
    customer_name: data.customerName || 'Customer',
    customer_email: data.customerEmail || 'customer@example.com',
    customer_mobile: data.customerMobile || '9999999999',
    redirect_url: redirectUrl,
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

  // If payment is successful, create booking automatically
  if (responseData.data.status === 'success') {
    console.log('✅ EKQR Payment successful, creating booking');
    
    try {
      // Get Supabase service client
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Find the transaction using the client_txn_id (which is our transaction ID)
      const { data: transaction, error: txnError } = await supabaseService
        .from('transactions')
        .select('*, booking_id')
        .eq('id', data.clientTxnId)
        .single();

      if (txnError || !transaction) {
        console.error('Failed to find transaction:', txnError);
        throw new Error('Transaction not found');
      }

      // Skip booking creation if already exists
      if (transaction.booking_id) {
        console.log('Booking already exists for this transaction');
      } else {
        // Get the booking intent data from transaction payment_data
        const bookingIntentData = transaction.payment_data?.bookingIntent;
        
        if (!bookingIntentData) {
          console.error('No booking intent data found in transaction');
          throw new Error('Booking intent data not found');
        }

        // Create the booking
        const { data: booking, error: bookingError } = await supabaseService
          .from('bookings')
          .insert({
            user_id: transaction.user_id,
            study_hall_id: bookingIntentData.study_hall_id,
            seat_id: bookingIntentData.seat_id,
            booking_period: bookingIntentData.booking_period,
            start_date: bookingIntentData.start_date,
            end_date: bookingIntentData.end_date,
            total_amount: bookingIntentData.total_amount,
            status: 'confirmed',
            payment_status: 'paid'
          })
          .select()
          .single();

        if (bookingError) {
          console.error('Failed to create booking:', bookingError);
          throw new Error('Failed to create booking');
        }

        console.log('✅ Booking created:', booking.id);

        // Update transaction status and link to booking
        await supabaseService
          .from('transactions')
          .update({
            status: 'completed',
            booking_id: booking.id,
            payment_data: {
              ...transaction.payment_data,
              ekqr_payment_id: responseData.data.id,
              upi_txn_id: responseData.data.upi_txn_id,
              completed_at: new Date().toISOString()
            }
          })
          .eq('id', transaction.id);

        // Mark seat as unavailable
        await supabaseService
          .from('seats')
          .update({ is_available: false })
          .eq('id', bookingIntentData.seat_id);

        console.log('✅ EKQR Payment and booking process completed successfully');
      }
    } catch (error) {
      console.error('❌ Error processing successful payment:', error);
      // Continue to return success status as payment was successful
    }
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