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
    const supabaseServiceRole = createClient(
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
        return await createOrder(requestData, ekqrApiKey, req, supabaseServiceRole);
      case 'checkStatus':
        return await checkOrderStatus(requestData, ekqrApiKey, supabaseServiceRole);
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

async function createOrder(data: any, ekqrApiKey: string, req: Request, supabaseServiceRole: any) {
  console.log('Creating EKQR order:', data);
  
  // Store booking intent in transaction for later use
  const { error: updateError } = await supabaseServiceRole
    .from('transactions')
    .update({
      payment_data: {
        bookingIntent: {
          study_hall_id: data.studyHallId,
          seat_id: data.seatId,
          booking_period: data.bookingPeriod || 'daily',
          start_date: data.startDate,
          end_date: data.endDate,
          total_amount: data.amount
        }
      }
    })
    .eq('id', data.bookingId);

  if (updateError) {
    console.error('Error storing booking intent:', updateError);
  }
  
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

async function checkOrderStatus(data: any, ekqrApiKey: string, supabaseServiceRole: any) {
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

  // Get transaction data to find booking intent
  const transactionId = data.clientTxnId;
  const { data: transactionData, error: transactionError } = await supabaseServiceRole
    .from('transactions')
    .select('*, payment_data')
    .eq('id', transactionId)
    .single();

  if (transactionError || !transactionData) {
    console.error('Error fetching transaction:', transactionError);
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

  // If payment is successful, create booking
  if (responseData.data.status === 'success') {
    console.log('Payment successful, creating booking...');
    
    // Get booking intent from transaction payment_data
    const bookingIntent = transactionData.payment_data?.bookingIntent;
    if (!bookingIntent) {
      console.error('Booking intent not found in transaction data');
    } else {
      // Create booking using consistent logic
      const { data: booking, error: bookingError } = await supabaseServiceRole
        .from('bookings')
        .insert({
          study_hall_id: bookingIntent.study_hall_id,
          seat_id: bookingIntent.seat_id,
          booking_period: bookingIntent.booking_period,
          start_date: bookingIntent.start_date,
          end_date: bookingIntent.end_date,
          total_amount: bookingIntent.total_amount,
          user_id: transactionData.user_id,
          status: 'confirmed',
          payment_status: 'paid'
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Error creating booking:', bookingError);
      } else {
        console.log('Booking created successfully:', booking);

        // Update transaction with booking_id and mark as completed
        const { error: transactionUpdateError } = await supabaseServiceRole
          .from('transactions')
          .update({ 
            booking_id: booking.id,
            status: 'completed'
          })
          .eq('id', transactionId);

        if (transactionUpdateError) {
          console.error('Error updating transaction with booking_id:', transactionUpdateError);
        }

        // Mark seat as unavailable
        const { error: seatError } = await supabaseServiceRole
          .from('seats')
          .update({ is_available: false })
          .eq('id', bookingIntent.seat_id);

        if (seatError) {
          console.error('Error updating seat availability:', seatError);
        }

        console.log('EKQR payment and booking process completed successfully');
      }
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