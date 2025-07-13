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
  
  // Generate a unique EKQR order ID
  const ekqrOrderId = `EKQR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Get the correct domain from request headers or use fallback
  const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://jseyxxsptcckjumjcljk.lovableproject.com';
  const redirectUrl = data.redirectUrl || `${origin}/payment-success?booking_id=${data.bookingId}&amount=${data.amount}&study_hall_id=${data.studyHallId || ''}`;
  
  console.log('Using redirect URL:', redirectUrl);
  console.log('Request origin:', origin);
  console.log(`Creating EKQR order with ID: ${ekqrOrderId} for transaction: ${data.bookingId}`);
  
  const requestBody = {
    key: ekqrApiKey,
    client_txn_id: ekqrOrderId, // Use unique EKQR order ID
    amount: data.amount.toString(),
    p_info: `Study Hall Booking - ${data.bookingId}`,
    customer_name: data.customerName || 'Customer',
    customer_email: data.customerEmail || 'customer@example.com',
    customer_mobile: data.customerMobile || '9999999999',
    redirect_url: redirectUrl,
    udf1: `transaction_id:${data.bookingId}`, // Store transaction ID in UDF1
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

  // Update transaction with EKQR order ID for polling
  const supabaseService = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  await supabaseService
    .from('transactions')
    .update({
      qr_id: ekqrOrderId, // Store EKQR order ID for status polling
      payment_data: {
        ...((await supabaseService.from('transactions').select('payment_data').eq('id', data.bookingId).single()).data?.payment_data || {}),
        ekqr_order_id: ekqrOrderId,
        order_id: responseData.data.order_id
      }
    })
    .eq('id', data.bookingId);

  return new Response(
    JSON.stringify({
      success: true,
      orderId: ekqrOrderId, // Return our EKQR order ID for polling
      paymentUrl: responseData.data.payment_url,
      sessionId: responseData.data.session_id,
      upiIntent: responseData.data.upi_intent,
      isUtrRequired: responseData.data.is_utr_required
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function checkOrderStatus(data: any, ekqrApiKey: string) {
  console.log('🔍 EKQR: Checking order status for:', data);
  
  try {
    const requestBody = {
      key: ekqrApiKey,
      client_txn_id: data.clientTxnId,
      txn_date: data.txnDate
    };

    console.log('📤 EKQR: Status request body:', requestBody);

    const response = await fetch(`${EKQR_BASE_URL}/check_order_status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();
    console.log('📥 EKQR: Status response:', responseData);
    
    if (!response.ok) {
      console.error('❌ EKQR: HTTP error:', response.status, response.statusText);
      throw new Error(`HTTP ${response.status}: ${responseData.msg || 'Failed to check order status'}`);
    }

    if (!responseData.status) {
      console.error('❌ EKQR: API error:', responseData);
      throw new Error(responseData.msg || 'API returned error status');
    }

    // If payment is successful, create booking automatically
    if (responseData.data.status === 'success') {
      console.log('✅ EKQR: Payment successful, processing booking creation');
      
      try {
        // Get Supabase service client
        const supabaseService = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        console.log('🔍 EKQR: Finding transaction with EKQR order ID:', data.clientTxnId);
        
        // Find the transaction using the qr_id (which is our EKQR order ID)
        const { data: transaction, error: txnError } = await supabaseService
          .from('transactions')
          .select('*, booking_id')
          .eq('qr_id', data.clientTxnId)
          .single();

        if (txnError) {
          console.error('❌ EKQR: Transaction lookup error:', txnError);
          throw new Error(`Transaction lookup failed: ${txnError.message}`);
        }

        if (!transaction) {
          console.error('❌ EKQR: Transaction not found for ID:', data.clientTxnId);
          throw new Error('Transaction not found');
        }

        console.log('✅ EKQR: Transaction found:', transaction.id);

        // Skip booking creation if already exists
        if (transaction.booking_id) {
          console.log('ℹ️ EKQR: Booking already exists for this transaction:', transaction.booking_id);
        } else {
          // Get the booking intent data from transaction payment_data
          const bookingIntentData = transaction.payment_data?.bookingIntent;
          
          if (!bookingIntentData) {
            console.error('❌ EKQR: No booking intent data found in transaction');
            throw new Error('Booking intent data not found in transaction');
          }

          console.log('🏗️ EKQR: Creating booking from intent data:', bookingIntentData);

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
            console.error('❌ EKQR: Booking creation error:', bookingError);
            throw new Error(`Booking creation failed: ${bookingError.message}`);
          }

          console.log('✅ EKQR: Booking created successfully:', booking.id);

          // Update transaction status and link to booking (preserve existing payment_data)
          const preservedPaymentData = transaction.payment_data || {};
          const { error: updateError } = await supabaseService
            .from('transactions')
            .update({
              status: 'completed',
              booking_id: booking.id,
              payment_data: {
                ...preservedPaymentData,
                ekqr_payment_id: responseData.data.id,
                upi_txn_id: responseData.data.upi_txn_id,
                completed_at: new Date().toISOString()
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', transaction.id);

          if (updateError) {
            console.error('❌ EKQR: Transaction update error:', updateError);
            // Don't throw here as booking was created successfully
          }

          // Mark seat as unavailable
          const { error: seatError } = await supabaseService
            .from('seats')
            .update({ is_available: false })
            .eq('id', bookingIntentData.seat_id);

          if (seatError) {
            console.error('❌ EKQR: Seat update error:', seatError);
            // Don't throw here as booking was created successfully
          }

          console.log('🎉 EKQR: Payment and booking process completed successfully');
        }
      } catch (error) {
        console.error('💥 EKQR: Error processing successful payment:', error);
        // Continue to return success status as payment was successful on EKQR side
        // The booking creation can be handled by retry mechanisms or manual intervention
      }
    }
  } catch (error) {
    console.error('💥 EKQR: Error in checkOrderStatus:', error);
    throw error;
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