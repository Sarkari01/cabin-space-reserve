import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CreateSubscriptionOrderRequest {
  plan_id: string;
  merchant_id: string;
  amount: number;
}

interface VerifySubscriptionPaymentRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  subscription_transaction_id: string;
}

Deno.serve(async (req) => {
  console.log('🚀 Subscription payment function invoked - method:', req.method, 'url:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Subscription: Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  const url = new URL(req.url);
  if (url.pathname.includes('/health')) {
    console.log('💚 Subscription: Health check requested');
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    return new Response(
      JSON.stringify({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        razorpay_key_id_configured: !!keyId,
        razorpay_key_secret_configured: !!keySecret,
        function_name: 'subscription-payment',
        available_actions: ['create_subscription_order', 'verify_subscription_payment']
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('🔧 Subscription: Initializing Supabase client');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('📖 Subscription: Parsing request body');
    const requestBody = await req.json();
    console.log('📦 Subscription: Received request:', JSON.stringify(requestBody, null, 2));
    const { action, ...requestData } = requestBody;

    // Validate Razorpay credentials upfront
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      console.error('❌ Missing Razorpay credentials');
      return new Response(
        JSON.stringify({ 
          error: 'Razorpay payment service is not configured. Please contact support.',
          code: 'MISSING_CREDENTIALS'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'create_subscription_order') {
      return await createSubscriptionOrder(requestData as CreateSubscriptionOrderRequest, supabase, keyId, keySecret);
    } else if (action === 'verify_subscription_payment') {
      return await verifySubscriptionPayment(requestData as VerifySubscriptionPaymentRequest, supabase, keySecret);
    } else {
      return new Response(
        JSON.stringify({ 
          error: `Invalid action: ${action}. Supported actions: create_subscription_order, verify_subscription_payment`,
          code: 'INVALID_ACTION'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('💥 Subscription function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        code: 'FUNCTION_ERROR',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createSubscriptionOrder(
  { plan_id, merchant_id, amount }: CreateSubscriptionOrderRequest, 
  supabase: any, 
  keyId: string, 
  keySecret: string
) {
  console.log('💳 Creating subscription order for plan:', plan_id, 'merchant:', merchant_id, 'amount: ₹', amount);

  try {
    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      throw new Error('Plan not found');
    }

    // Create subscription transaction record with null subscription_id initially
    const { data: transaction, error: transactionError } = await supabase
      .from('subscription_transactions')
      .insert({
        merchant_id,
        subscription_id: null, // Will be updated after subscription creation
        amount,
        payment_method: 'razorpay',
        status: 'pending'
      })
      .select()
      .single();

    if (transactionError) {
      throw new Error('Failed to create transaction record');
    }

    // Generate receipt for Razorpay
    const timestamp = Date.now().toString().slice(-8);
    const receipt = `sub_${transaction.id.substring(0, 15)}_${timestamp}`.substring(0, 40);

    const orderData = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: receipt,
      payment_capture: 1,
      notes: {
        plan_id: plan_id,
        merchant_id: merchant_id,
        transaction_id: transaction.id,
        plan_name: plan.name,
        purpose: 'Subscription Payment'
      }
    };

    console.log('📤 Sending subscription order request to Razorpay:', JSON.stringify(orderData, null, 2));

    const auth = btoa(`${keyId}:${keySecret}`);
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'User-Agent': 'StudyHall-Subscription/1.0'
      },
      body: JSON.stringify(orderData)
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ Razorpay API Error:', responseText);
      throw new Error('Failed to create Razorpay order');
    }

    const order = JSON.parse(responseText);
    console.log('✅ Subscription order created successfully:', order.id);

    // Update transaction with order details
    await supabase
      .from('subscription_transactions')
      .update({
        payment_data: {
          razorpay_order_id: order.id,
          plan_details: plan
        }
      })
      .eq('id', transaction.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: keyId,
        receipt: order.receipt,
        transaction_id: transaction.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error creating subscription order:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create subscription order', 
        code: 'ORDER_CREATION_FAILED',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function verifySubscriptionPayment(
  { razorpay_payment_id, razorpay_order_id, razorpay_signature, subscription_transaction_id }: VerifySubscriptionPaymentRequest,
  supabase: any,
  keySecret: string
) {
  console.log('🔍 Verifying subscription payment:', razorpay_payment_id);

  try {
    // Verify signature
    const generated_signature = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(keySecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ).then(key => 
      crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(`${razorpay_order_id}|${razorpay_payment_id}`)
      )
    ).then(signature => 
      Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    );

    if (generated_signature !== razorpay_signature) {
      console.error('❌ Invalid payment signature');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid payment signature',
          code: 'SIGNATURE_MISMATCH'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get transaction
    const { data: transaction, error: txnError } = await supabase
      .from('subscription_transactions')
      .select('*')
      .eq('id', subscription_transaction_id)
      .single();

    if (txnError || !transaction) {
      console.error('Failed to find subscription transaction:', txnError);
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get plan details from transaction
    const planId = transaction.payment_data?.plan_details?.id;
    if (!planId) {
      throw new Error('Plan details not found in transaction');
    }

    // Create or update merchant subscription
    const startDate = new Date().toISOString();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Default to 1 month

    // Check if merchant already has a subscription
    const { data: existingSubscription } = await supabase
      .from('merchant_subscriptions')
      .select('id')
      .eq('merchant_id', transaction.merchant_id)
      .single();

    let subscriptionData;
    if (existingSubscription) {
      // Update existing subscription
      const { data, error } = await supabase
        .from('merchant_subscriptions')
        .update({
          plan_id: planId,
          status: 'active',
          start_date: startDate,
          end_date: endDate.toISOString(),
          payment_method: 'razorpay',
          auto_renew: true,
          last_payment_date: startDate
        })
        .eq('id', existingSubscription.id)
        .select()
        .single();

      if (error) throw error;
      subscriptionData = data;
    } else {
      // Create new subscription
      const { data, error } = await supabase
        .from('merchant_subscriptions')
        .insert({
          merchant_id: transaction.merchant_id,
          plan_id: planId,
          status: 'active',
          start_date: startDate,
          end_date: endDate.toISOString(),
          payment_method: 'razorpay',
          auto_renew: true,
          last_payment_date: startDate
        })
        .select()
        .single();

      if (error) throw error;
      subscriptionData = data;
    }

    // Update transaction status
    await supabase
      .from('subscription_transactions')
      .update({
        status: 'completed',
        payment_id: razorpay_payment_id,
        subscription_id: subscriptionData.id,
        payment_data: {
          ...transaction.payment_data,
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature,
          verified_at: new Date().toISOString()
        }
      })
      .eq('id', subscription_transaction_id);

    console.log('✅ Subscription payment verified and activated');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Subscription payment verified successfully',
        subscription_id: subscriptionData.id,
        transaction_id: subscription_transaction_id,
        payment_id: razorpay_payment_id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error verifying subscription payment:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to verify subscription payment', 
        code: 'VERIFICATION_FAILED',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}