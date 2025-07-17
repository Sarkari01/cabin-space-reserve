
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

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

// Generate QR code using QR Server API (reliable service for PNG generation)
async function generateQRCodePNG(text: string): Promise<Uint8Array> {
  try {
    console.log('Generating QR code for URL:', text);
    
    // Use QR Server API to generate a proper scannable QR code
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=${encodeURIComponent(text)}`;
    
    console.log('Calling QR API:', qrApiUrl);
    
    const response = await fetch(qrApiUrl);
    
    if (!response.ok) {
      throw new Error(`QR API failed: ${response.status} ${response.statusText}`);
    }
    
    const qrCodeBuffer = new Uint8Array(await response.arrayBuffer());
    
    console.log('QR code PNG generated successfully, size:', qrCodeBuffer.length, 'bytes');
    return qrCodeBuffer;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
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
      .select('id, name, merchant_id, qr_booking_enabled')
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

    try {
      // Generate QR code PNG
      const qrCodeBuffer = await generateQRCodePNG(qrUrl);
      console.log('QR code PNG generated successfully');

      // Upload QR code to Supabase Storage as PNG
      const fileName = `qr-${studyHallId}-${Date.now()}.png`;
      console.log(`Uploading QR code with filename: ${fileName}`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('qr-codes')
        .upload(fileName, qrCodeBuffer, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading QR code:', uploadError);
        return new Response(
          JSON.stringify({ error: 'Failed to upload QR code', details: uploadError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('QR code uploaded successfully:', uploadData);

      // Get public URL for the uploaded QR code
      const { data: publicUrl } = supabase.storage
        .from('qr-codes')
        .getPublicUrl(fileName);

      console.log('Public URL generated:', publicUrl.publicUrl);

      // Update study hall with QR code URL
      const { error: updateError } = await supabase
        .from('study_halls')
        .update({ qr_code_url: publicUrl.publicUrl })
        .eq('id', studyHallId);

      if (updateError) {
        console.error('Error updating study hall with QR code URL:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update study hall', details: updateError.message }),
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

    } catch (qrError: any) {
      console.error('Error generating QR code:', qrError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate QR code', details: qrError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Error in generate-qr-code function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
