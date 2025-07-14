import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EKQR_BASE_URL = 'https://api.ekqr.in/api/v2';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Auto EKQR Recovery: Starting automatic recovery process');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const ekqrApiKey = Deno.env.get('EKQR_API_KEY');
    if (!ekqrApiKey) {
      throw new Error('EKQR_API_KEY not configured');
    }

    // Find pending EKQR transactions older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: pendingTransactions, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('payment_method', 'ekqr')
      .eq('status', 'pending')
      .lt('created_at', fiveMinutesAgo);

    if (fetchError) {
      console.error('❌ Failed to fetch pending transactions:', fetchError);
      throw fetchError;
    }

    if (!pendingTransactions || pendingTransactions.length === 0) {
      console.log('✅ No pending EKQR transactions found older than 5 minutes');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending transactions to recover',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Found ${pendingTransactions.length} pending EKQR transactions to check`);

    const results = {
      success: 0,
      failed: 0,
      stillPending: 0,
      errors: [] as string[]
    };

    // Process each pending transaction
    for (const transaction of pendingTransactions) {
      try {
        console.log(`🔍 Checking transaction: ${transaction.id}`);
        
        // Try multiple ways to get the order ID
        let orderIdToCheck = transaction.qr_id || 
                           transaction.payment_data?.ekqr_order_id || 
                           transaction.payment_id;

        if (!orderIdToCheck) {
          console.log(`⚠️ No order ID found for transaction ${transaction.id}, skipping`);
          results.failed++;
          results.errors.push(`Transaction ${transaction.id}: No order ID found`);
          continue;
        }

        // Check payment status with EKQR API
        const statusResult = await checkEKQRPaymentStatus(
          orderIdToCheck, 
          ekqrApiKey, 
          transaction.id
        );

        if (statusResult.success) {
          // Payment successful - create booking if needed
          const booking = await createBookingFromTransaction(supabase, transaction, statusResult.paymentData);
          
          if (booking) {
            console.log(`✅ Successfully recovered payment for transaction: ${transaction.id}`);
            results.success++;
          } else {
            console.log(`⚠️ Payment successful but booking creation failed for: ${transaction.id}`);
            results.failed++;
            results.errors.push(`Transaction ${transaction.id}: Booking creation failed`);
          }
        } else if (statusResult.failed) {
          // Payment failed - mark transaction as failed
          await supabase
            .from('transactions')
            .update({ 
              status: 'failed',
              payment_data: {
                ...transaction.payment_data,
                auto_recovery_failed_at: new Date().toISOString(),
                failure_reason: statusResult.reason || 'Payment failed'
              }
            })
            .eq('id', transaction.id);
          
          console.log(`❌ Marked transaction as failed: ${transaction.id}`);
          results.failed++;
        } else {
          // Still pending
          console.log(`⏳ Transaction still pending: ${transaction.id}`);
          results.stillPending++;
        }

      } catch (error) {
        console.error(`💥 Error processing transaction ${transaction.id}:`, error);
        results.failed++;
        results.errors.push(`Transaction ${transaction.id}: ${error.message}`);
      }
    }

    console.log('📊 Auto recovery completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Auto recovery completed',
        processed: pendingTransactions.length,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Auto EKQR Recovery Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function checkEKQRPaymentStatus(orderIdToCheck: string, ekqrApiKey: string, transactionId: string) {
  try {
    const requestBody = {
      key: ekqrApiKey,
      client_txn_id: orderIdToCheck,
      txn_date: new Date().toISOString().split('T')[0]
    };

    console.log(`📤 Checking EKQR status for order: ${orderIdToCheck}`);

    const response = await fetch(`${EKQR_BASE_URL}/check_order_status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();
    console.log(`📥 EKQR response for ${orderIdToCheck}:`, responseData);
    
    if (!response.ok || !responseData.status) {
      return { success: false, failed: false, reason: responseData.msg || 'API error' };
    }

    // Check payment status
    const paymentStatus = responseData.data?.status?.toLowerCase();
    const isSuccess = paymentStatus === 'success' || 
                     paymentStatus === 'completed' || 
                     paymentStatus === 'paid' ||
                     responseData.data?.paid === true ||
                     responseData.data?.payment_status === 'success';

    const isFailed = paymentStatus === 'failed' || 
                    paymentStatus === 'cancelled' ||
                    paymentStatus === 'timeout' ||
                    responseData.data?.paid === false;

    if (isSuccess) {
      return { 
        success: true, 
        paymentData: responseData.data 
      };
    } else if (isFailed) {
      return { 
        success: false, 
        failed: true, 
        reason: responseData.data?.remark || `Payment ${paymentStatus}` 
      };
    } else {
      return { 
        success: false, 
        failed: false, 
        reason: 'Still pending' 
      };
    }

  } catch (error) {
    console.error(`❌ Error checking EKQR status for ${orderIdToCheck}:`, error);
    return { success: false, failed: false, reason: error.message };
  }
}

async function createBookingFromTransaction(supabase: any, transaction: any, paymentData: any) {
  try {
    // Skip if booking already exists
    if (transaction.booking_id) {
      console.log(`ℹ️ Booking already exists for transaction: ${transaction.id}`);
      return true;
    }

    // Get booking intent data
    const bookingIntentData = transaction.payment_data?.bookingIntent;
    if (!bookingIntentData) {
      console.error(`❌ No booking intent data for transaction: ${transaction.id}`);
      return false;
    }

    console.log(`🏗️ Creating booking for transaction: ${transaction.id}`);

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
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
      console.error(`❌ Booking creation error for ${transaction.id}:`, bookingError);
      return false;
    }

    console.log(`✅ Booking created: ${booking.id} for transaction: ${transaction.id}`);

    // Update transaction
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'completed',
        booking_id: booking.id,
        payment_data: {
          ...transaction.payment_data,
          ekqr_payment_id: paymentData.id,
          upi_txn_id: paymentData.upi_txn_id,
          customer_vpa: paymentData.customer_vpa,
          auto_recovered_at: new Date().toISOString()
        }
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error(`❌ Transaction update error for ${transaction.id}:`, updateError);
    }

    // Mark seat as unavailable
    const { error: seatError } = await supabase
      .from('seats')
      .update({ is_available: false })
      .eq('id', bookingIntentData.seat_id);

    if (seatError) {
      console.error(`❌ Seat update error for ${transaction.id}:`, seatError);
    }

    return booking;
  } catch (error) {
    console.error(`💥 Error creating booking for transaction ${transaction.id}:`, error);
    return false;
  }
}