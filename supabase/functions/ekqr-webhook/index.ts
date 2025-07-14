import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EKQRWebhookPayload {
  orderId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  amount: number;
  transactionId?: string;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('EKQR Webhook received:', req.method);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const payload: EKQRWebhookPayload = await req.json();
    console.log('Webhook payload:', payload);

    // Find the transaction with the EKQR order ID
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('qr_id', payload.orderId)
      .single();

    if (transactionError || !transaction) {
      console.error('Transaction not found:', payload.orderId);
      return new Response(JSON.stringify({ error: 'Transaction not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Found transaction:', transaction.id);

    if (payload.status === 'SUCCESS' && transaction.status === 'pending') {
      console.log('Processing successful payment for transaction:', transaction.id);

      // Get booking data from the transaction
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', transaction.booking_id)
        .single();

      if (!existingBooking && transaction.booking_id) {
        // Get the booking intent data from transaction payment_data
        const bookingData = transaction.payment_data as any;
        
        if (bookingData?.bookingIntent) {
          const intent = bookingData.bookingIntent;
          
          // Create the booking
          const { data: newBooking, error: bookingError } = await supabase
            .from('bookings')
            .insert({
              user_id: transaction.user_id,
              study_hall_id: intent.study_hall_id,
              seat_id: intent.seat_id,
              booking_period: intent.booking_period,
              start_date: intent.start_date,
              end_date: intent.end_date,
              total_amount: intent.total_amount,
              status: 'confirmed',
              payment_status: 'paid'
            })
            .select()
            .single();

          if (bookingError) {
            console.error('Error creating booking:', bookingError);
            throw bookingError;
          }

          console.log('Created booking:', newBooking.id);

          // Mark seat as unavailable
          const { error: seatError } = await supabase
            .from('seats')
            .update({ is_available: false })
            .eq('id', intent.seat_id);

          if (seatError) {
            console.error('Error updating seat:', seatError);
          }
        }
      }

      // Update transaction status and link to booking if one was created
      const updateData: any = {
        status: 'completed',
        payment_data: {
          ...transaction.payment_data,
          webhookReceived: true,
          webhookTimestamp: payload.timestamp,
          transactionId: payload.transactionId
        }
      };

      // Link booking to transaction if it was created
      if (newBooking) {
        updateData.booking_id = newBooking.id;
      }

      const { error: updateError } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
        throw updateError;
      }

      console.log('Successfully processed EKQR payment webhook');
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Payment processed successfully',
        transactionId: transaction.id 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (payload.status === 'FAILED') {
      // Update transaction as failed
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'failed',
          payment_data: {
            ...transaction.payment_data,
            webhookReceived: true,
            webhookTimestamp: payload.timestamp,
            failureReason: 'Payment failed via webhook'
          }
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Error updating failed transaction:', updateError);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Payment failure recorded' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Webhook received but no action needed' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in EKQR webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});