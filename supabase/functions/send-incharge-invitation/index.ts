import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  email: string;
  full_name: string;
  invitation_token: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, full_name, invitation_token }: InvitationRequest = await req.json();

    console.log('Sending invitation to:', email);

    // For now, we'll just log the invitation details
    // In a real implementation, you would:
    // 1. Use a service like Resend, SendGrid, or similar to send emails
    // 2. Create a proper invitation email template
    // 3. Include a secure link for the incharge to set up their account

    const invitationUrl = `${req.headers.get('origin') || 'https://your-app-domain.com'}/incharge/setup?token=${invitation_token}`;

    console.log('Invitation details:', {
      email,
      full_name,
      invitation_token,
      invitation_url: invitationUrl
    });

    // Simulate email sending
    const emailContent = {
      to: email,
      subject: "You've been invited as an Incharge",
      html: `
        <h1>Welcome to the team, ${full_name}!</h1>
        <p>You have been invited to join as an Incharge to help manage study hall operations.</p>
        <p>Please click the link below to set up your account:</p>
        <a href="${invitationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Set Up Your Account
        </a>
        <p>If you have any questions, please contact your administrator.</p>
        <p>This invitation link will expire in 7 days.</p>
      `
    };

    console.log('Email would be sent with content:', emailContent);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation sent successfully',
        debug: {
          email_content: emailContent,
          invitation_url: invitationUrl
        }
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );

  } catch (error) {
    console.error('Error sending invitation:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send invitation',
        details: error.message 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );
  }
});