import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
// Import a proper QR code library that works in Deno
import { encode } from "https://deno.land/x/qrcode@v2.0.0/mod.ts";

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

// Generate a real, scannable QR code using proper library
async function generateQRCodeSVG(text: string): Promise<string> {
  try {
    console.log('Generating QR code for URL:', text);
    
    // Use the proper QR library to generate scannable QR code
    const qrData = await encode(text, {
      errorCorrection: 'M', // Medium error correction
      type: 'svg',
      width: 400,
      height: 400,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      margin: 2
    });
    
    console.log('QR code SVG generated successfully');
    return qrData;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

function svgStringToBuffer(svgString: string): Uint8Array {
  const encoder = new TextEncoder();
  const svgData = encoder.encode(svgString);
  console.log('QR code buffer created, size:', svgData.length, 'bytes');
  return svgData;
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
      // Generate QR code SVG
      const qrCodeSvg = await generateQRCodeSVG(qrUrl);
      console.log('QR code SVG generated successfully');

      // Convert SVG to buffer
      const qrCodeBuffer = svgStringToBuffer(qrCodeSvg);

      // Upload QR code to Supabase Storage as SVG
      const fileName = `qr-${studyHallId}-${Date.now()}.svg`;
      console.log(`Uploading QR code with filename: ${fileName}`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('qr-codes')
        .upload(fileName, qrCodeBuffer, {
          contentType: 'image/svg+xml',
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