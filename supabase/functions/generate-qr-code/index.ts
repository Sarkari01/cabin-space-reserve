import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import QRCode from "https://esm.sh/qrcode@1.5.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface QRCodeRequest {
  studyHallId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studyHallId }: QRCodeRequest = await req.json();

    if (!studyHallId) {
      return new Response(
        JSON.stringify({ error: 'Study hall ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the study hall exists and get details
    const { data: studyHall, error: studyHallError } = await supabase
      .from('study_halls')
      .select('id, name, merchant_id')
      .eq('id', studyHallId)
      .single();

    if (studyHallError || !studyHall) {
      return new Response(
        JSON.stringify({ error: 'Study hall not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate QR code URL - use production domain or fallback
    const domain = Deno.env.get('PUBLIC_DOMAIN') || 'https://jseyxxsptcckjumjcljk.lovable.app';
    const qrUrl = `${domain}/studyhall/${studyHallId}/booking`;

    console.log(`Generating QR code for URL: ${qrUrl}`);

    // Generate QR code as data URL then convert to buffer
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Convert data URL to buffer
    const base64Data = qrCodeDataUrl.split(',')[1];
    const qrCodeBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload QR code to Supabase Storage
    const fileName = `qr-${studyHallId}-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('qr-codes')
      .upload(fileName, qrCodeBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading QR code:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload QR code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL for the uploaded QR code
    const { data: publicUrl } = supabase.storage
      .from('qr-codes')
      .getPublicUrl(fileName);

    // Update study hall with QR code URL
    const { error: updateError } = await supabase
      .from('study_halls')
      .update({ qr_code_url: publicUrl.publicUrl })
      .eq('id', studyHallId);

    if (updateError) {
      console.error('Error updating study hall with QR code URL:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update study hall' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`QR code generated successfully for study hall ${studyHallId}`);

    return new Response(
      JSON.stringify({
        success: true,
        qrCodeUrl: publicUrl.publicUrl,
        studyHallName: studyHall.name,
        bookingUrl: qrUrl
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-qr-code function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);