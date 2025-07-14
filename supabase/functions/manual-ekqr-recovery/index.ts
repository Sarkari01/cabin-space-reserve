import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { action, transactionId } = await req.json();

    console.log('🔧 Manual EKQR Recovery:', { action, transactionId });

    if (action === 'createBookingForTransaction') {
      return await createBookingForTransaction(supabase, transactionId);
    } else if (action === 'recoverAllPendingEKQR') {
      return await recoverAllPendingEKQR(supabase);
    } else {
      throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('❌ Manual Recovery Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createBookingForTransaction(supabase: any, transactionId: string) {
  try {
    console.log('🔧 Creating booking for transaction:', transactionId);

    // Get transaction details
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (transactionError || !transaction) {
      throw new Error(`Transaction not found: ${transactionError?.message}`);
    }

    if (transaction.booking_id) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Booking already exists',
          bookingId: transaction.booking_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const bookingIntentData = transaction.payment_data?.bookingIntent;
    if (!bookingIntentData) {
      throw new Error('No booking intent data found');
    }

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
      throw new Error(`Booking creation failed: ${bookingError.message}`);
    }

    // Update transaction
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'completed',
        booking_id: booking.id,
        payment_data: {
          ...transaction.payment_data,
          manually_recovered: true,
          recovered_at: new Date().toISOString()
        }
      })
      .eq('id', transactionId);

    if (updateError) {
      console.error('❌ Transaction update failed:', updateError);
    }

    // Mark seat as unavailable
    const { error: seatError } = await supabase
      .from('seats')
      .update({ is_available: false })
      .eq('id', bookingIntentData.seat_id);

    if (seatError) {
      console.error('❌ Seat update failed:', seatError);
    }

    console.log('✅ Manual booking recovery completed:', booking.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Booking created successfully',
        bookingId: booking.id,
        booking: booking
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Manual booking creation failed:', error);
    throw error;
  }
}

async function recoverAllPendingEKQR(supabase: any) {
  try {
    console.log('🔧 Recovering all pending EKQR transactions...');

    // Get all pending EKQR transactions with booking intent data
    const { data: pendingTransactions, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('payment_method', 'ekqr')
      .eq('status', 'pending')
      .is('booking_id', null)
      .not('payment_data->bookingIntent', 'is', null);

    if (fetchError) {
      throw new Error(`Failed to fetch pending transactions: ${fetchError.message}`);
    }

    console.log(`Found ${pendingTransactions?.length || 0} pending EKQR transactions to recover`);

    const results = [];
    
    for (const transaction of pendingTransactions || []) {
      try {
        const { data: result } = await createBookingForTransaction(supabase, transaction.id);
        results.push({
          transactionId: transaction.id,
          success: true,
          bookingId: result?.bookingId
        });
      } catch (error) {
        console.error(`❌ Failed to recover transaction ${transaction.id}:`, error);
        results.push({
          transactionId: transaction.id,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Recovery completed: ${successCount} successful, ${failureCount} failed`,
        totalProcessed: results.length,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Bulk recovery failed:', error);
    throw error;
  }
}