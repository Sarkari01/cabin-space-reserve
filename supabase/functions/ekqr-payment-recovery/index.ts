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

    const { action, ...requestData } = await req.json();

    console.log('EKQR Recovery request:', { action, requestData });

    switch (action) {
      case 'recoverPendingPayments':
        return await recoverPendingPayments(supabase);
      case 'verifySpecificPayment':
        return await verifySpecificPayment(requestData, supabase);
      default:
        throw new Error(`Invalid action: ${action}`);
    }
  } catch (error) {
    console.error('EKQR Recovery Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function recoverPendingPayments(supabase: any) {
  console.log('🔄 Starting recovery process for pending EKQR payments');
  
  // Find pending EKQR transactions older than 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data: pendingTransactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('payment_method', 'ekqr')
    .eq('status', 'pending')
    .not('qr_id', 'is', null)
    .lt('created_at', fiveMinutesAgo);

  if (error) {
    throw new Error(`Failed to fetch pending transactions: ${error.message}`);
  }

  console.log(`📋 Found ${pendingTransactions?.length || 0} pending EKQR transactions to check`);

  const results = [];
  
  for (const transaction of pendingTransactions || []) {
    try {
      console.log(`🔍 Checking transaction ${transaction.id} with EKQR order ${transaction.qr_id}`);
      
      // Check EKQR status for this transaction
      const { data: statusResponse, error: statusError } = await supabase.functions.invoke('ekqr-payment', {
        body: {
          action: 'checkOrderStatus',
          orderId: transaction.qr_id,
          transactionId: transaction.id
        }
      });

      if (!statusError && statusResponse?.paid) {
        console.log(`✅ Found successful payment for transaction ${transaction.id}`);
        results.push({
          transactionId: transaction.id,
          status: 'recovered',
          bookingId: statusResponse.booking?.id
        });
      } else {
        console.log(`⏳ Transaction ${transaction.id} still pending`);
        results.push({
          transactionId: transaction.id,
          status: 'still_pending'
        });
      }
    } catch (error) {
      console.error(`❌ Error checking transaction ${transaction.id}:`, error);
      results.push({
        transactionId: transaction.id,
        status: 'error',
        error: error.message
      });
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Recovery process completed. Checked ${pendingTransactions?.length || 0} transactions.`,
      results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function verifySpecificPayment(data: any, supabase: any) {
  const { transactionId, orderId } = data;
  
  if (!transactionId && !orderId) {
    throw new Error('Either transactionId or orderId is required');
  }

  console.log(`🔍 Verifying specific payment: transaction=${transactionId}, order=${orderId}`);

  // Check EKQR status
  const { data: statusResponse, error } = await supabase.functions.invoke('ekqr-payment', {
    body: {
      action: 'checkOrderStatus',
      orderId: orderId,
      transactionId: transactionId
    }
  });

  if (error) {
    throw new Error(`Payment verification failed: ${error.message}`);
  }

  return new Response(
    JSON.stringify({
      success: true,
      verified: statusResponse?.paid || false,
      status: statusResponse?.status,
      booking: statusResponse?.booking,
      message: statusResponse?.paid ? 'Payment verified and booking created' : 'Payment still pending'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}