import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'general_administrator'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, user_metadata } = await req.json();

    if (!email || !password || !user_metadata?.role) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role
    const validRoles = ['telemarketing_executive', 'pending_payments_caller', 'customer_care_executive', 'settlement_manager', 'general_administrator', 'admin', 'merchant', 'student', 'institution'];
    if (!validRoles.includes(user_metadata.role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role specified' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the user using admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: {
        full_name: user_metadata.full_name || '',
        phone: user_metadata.phone || '',
        role: user_metadata.role
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update the profile created by the trigger with additional information
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: user_metadata.full_name || '',
        phone: user_metadata.phone || ''
      })
      .eq('id', newUser.user.id);

    if (profileUpdateError) {
      console.error('Error updating profile:', profileUpdateError);
      // Don't fail the entire operation for profile update errors
    }

    // Create admin profile for operational users
    const operationalRoles = ['telemarketing_executive', 'pending_payments_caller', 'customer_care_executive', 'settlement_manager', 'general_administrator'];
    if (operationalRoles.includes(user_metadata.role)) {
      const { error: adminProfileError } = await supabaseAdmin
        .from('admin_user_profiles')
        .insert({
          user_id: newUser.user.id,
          department: user_metadata.department || 'Operations',
          status: 'active',
          permissions: {}
        });

      if (adminProfileError) {
        console.error('Error creating admin profile:', adminProfileError);
        // Don't fail the entire operation for admin profile creation errors
      }
    }

    // Create institution profile for institution users
    if (user_metadata.role === 'institution') {
      const { error: institutionError } = await supabaseAdmin
        .from('institutions')
        .insert({
          user_id: newUser.user.id,
          name: user_metadata.full_name || 'New Institution',
          email: email,
          status: 'active'
        });

      if (institutionError) {
        console.error('Error creating institution profile:', institutionError);
        // Don't fail the entire operation for institution profile creation errors
      }
    }

    console.log('User created successfully:', newUser.user.id);

    return new Response(
      JSON.stringify({ 
        user: newUser.user,
        success: true 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in admin-create-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});