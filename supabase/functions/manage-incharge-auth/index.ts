import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManageInchargeAuthRequest {
  action: 'create_with_password' | 'update_password';
  inchargeId?: string;
  email: string;
  password: string;
  fullName?: string;
  mobile?: string;
  assignedStudyHalls?: string[];
  permissions?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client with service role key for admin operations
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

    // Initialize regular client to verify merchant auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { persistSession: false },
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Verify user is a merchant
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'merchant') {
      throw new Error('Access denied: Only merchants can manage incharge authentication');
    }

    const { action, inchargeId, email, password, fullName, mobile, assignedStudyHalls, permissions }: ManageInchargeAuthRequest = await req.json();

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    let result;

    if (action === 'create_with_password') {
      // Create new auth user
      const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for merchant-created accounts
        user_metadata: {
          full_name: fullName,
          role: 'incharge'
        }
      });

      if (createError) {
        console.error('Auth user creation error:', createError);
        throw new Error(`Failed to create user account: ${createError.message}`);
      }

      if (!authUser?.user) {
        throw new Error('Failed to create user account');
      }

      // Create incharge record
      const { data: incharge, error: inchargeError } = await supabase
        .from('incharges')
        .insert({
          email,
          full_name: fullName || '',
          mobile: mobile || '',
          merchant_id: user.id,
          created_by: user.id,
          assigned_study_halls: assignedStudyHalls || [],
          permissions: permissions || {
            view_bookings: true,
            manage_bookings: true,
            view_transactions: true
          },
          auth_method: 'password',
          password_set_by_merchant: true,
          password_last_changed: new Date().toISOString(),
          account_activated: true,
          status: 'active'
        })
        .select()
        .single();

      if (inchargeError) {
        console.error('Incharge creation error:', inchargeError);
        // Clean up the auth user if incharge creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw new Error(`Failed to create incharge record: ${inchargeError.message}`);
      }

      // Log activity
      await supabase
        .from('incharge_activity_logs')
        .insert({
          incharge_id: incharge.id,
          action: 'account_created_with_password',
          details: {
            created_by_merchant: user.id,
            auth_method: 'password'
          }
        });

      result = { success: true, incharge, authUser: authUser.user };

    } else if (action === 'update_password') {
      if (!inchargeId) {
        throw new Error('Incharge ID is required for password updates');
      }

      // Verify the incharge belongs to this merchant
      const { data: incharge, error: inchargeError } = await supabase
        .from('incharges')
        .select('*')
        .eq('id', inchargeId)
        .eq('merchant_id', user.id)
        .single();

      if (inchargeError || !incharge) {
        throw new Error('Incharge not found or access denied');
      }

      // Get the auth user by email
      const { data: authUsers, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (getUserError) {
        throw new Error('Failed to retrieve user information');
      }

      const authUser = authUsers.users.find(u => u.email === incharge.email);
      if (!authUser) {
        throw new Error('Auth user not found for this incharge');
      }

      // Update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        authUser.id,
        { password }
      );

      if (updateError) {
        console.error('Password update error:', updateError);
        throw new Error(`Failed to update password: ${updateError.message}`);
      }

      // Update incharge record
      const { error: inchargeUpdateError } = await supabase
        .from('incharges')
        .update({
          password_last_changed: new Date().toISOString(),
          password_set_by_merchant: true
        })
        .eq('id', inchargeId);

      if (inchargeUpdateError) {
        console.error('Incharge update error:', inchargeUpdateError);
        throw new Error('Failed to update incharge record');
      }

      // Log activity
      await supabase
        .from('incharge_activity_logs')
        .insert({
          incharge_id: inchargeId,
          action: 'password_changed_by_merchant',
          details: {
            changed_by_merchant: user.id,
            timestamp: new Date().toISOString()
          }
        });

      result = { success: true, message: 'Password updated successfully' };
    }

    console.log(`Incharge auth ${action} completed successfully for merchant ${user.id}`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in manage-incharge-auth function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);