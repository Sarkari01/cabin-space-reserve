import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Payment recovery job started at:', new Date().toISOString());
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ekqrApiKey = Deno.env.get('EKQR_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Find pending transactions older than 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: stuckTransactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'pending')
      .eq('payment_method', 'ekqr')
      .lt('created_at', tenMinutesAgo)
      .not('qr_id', 'is', null);

    if (error) {
      console.error('Error fetching stuck transactions:', error);
      throw error;
    }

    console.log(`Found ${stuckTransactions.length} stuck transactions to check`);

    let recovered = 0;
    let failed = 0;

    for (const transaction of stuckTransactions) {
      try {
        console.log(`Checking transaction ${transaction.id} with QR ID ${transaction.qr_id}`);
        
        // Check payment status with EKQR API
        const statusResponse = await fetch('https://ekqr.com/api/order/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey: ekqrApiKey,
            orderId: transaction.qr_id,
          }),
        });

        const statusData = await statusResponse.json();
        console.log(`EKQR status for ${transaction.qr_id}:`, statusData);

        if (statusData.status === 'SUCCESS' || statusData.paid === true) {
          console.log(`Transaction ${transaction.id} was actually paid! Creating booking...`);
          
          // Get booking data from transaction
          const bookingData = transaction.payment_data as any;
          
          if (bookingData?.bookingIntent) {
            const intent = bookingData.bookingIntent;
            
            // Check if booking already exists
            const { data: existingBooking } = await supabase
              .from('bookings')
              .select('id')
              .eq('id', transaction.booking_id)
              .single();

            if (!existingBooking) {
              // Create the booking
              const { error: bookingError } = await supabase
                .from('bookings')
                .insert({
                  id: transaction.booking_id,
                  user_id: transaction.user_id,
                  study_hall_id: intent.study_hall_id,
                  seat_id: intent.seat_id,
                  booking_period: intent.booking_period,
                  start_date: intent.start_date,
                  end_date: intent.end_date,
                  total_amount: intent.total_amount,
                  status: 'active',
                  payment_status: 'paid'
                });

              if (bookingError) {
                console.error('Error creating recovered booking:', bookingError);
                continue;
              }

              // Mark seat as unavailable
              await supabase
                .from('seats')
                .update({ is_available: false })
                .eq('id', intent.seat_id);

              console.log(`Created recovered booking for transaction ${transaction.id}`);
            }
          }

          // Update transaction status
          const { error: updateError } = await supabase
            .from('transactions')
            .update({
              status: 'completed',
              payment_data: {
                ...transaction.payment_data,
                recoveredAt: new Date().toISOString(),
                recoveryMethod: 'background_job'
              }
            })
            .eq('id', transaction.id);

          if (!updateError) {
            recovered++;
            console.log(`Successfully recovered transaction ${transaction.id}`);
          }
        } else if (statusData.status === 'FAILED' || statusData.status === 'EXPIRED') {
          // Mark as failed
          await supabase
            .from('transactions')
            .update({
              status: 'failed',
              payment_data: {
                ...transaction.payment_data,
                recoveryCheckedAt: new Date().toISOString(),
                finalStatus: statusData.status
              }
            })
            .eq('id', transaction.id);

          failed++;
          console.log(`Marked transaction ${transaction.id} as failed`);
        }
      } catch (err) {
        console.error(`Error processing transaction ${transaction.id}:`, err);
      }
    }

    const result = {
      checked: stuckTransactions.length,
      recovered,
      failed,
      timestamp: new Date().toISOString()
    };

    console.log('Recovery job completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in payment recovery job:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});