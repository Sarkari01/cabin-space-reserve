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

// Generate QR code using a reliable method that creates scannable PNG files
async function generateQRCodePNG(text: string): Promise<Uint8Array> {
  try {
    console.log('Generating QR code for URL:', text);
    
    // Use QR Server API with optimized settings for better scannability
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&format=png&ecc=M&margin=2&data=${encodeURIComponent(text)}`;
    
    console.log('Calling QR API:', qrApiUrl);
    
    const response = await fetch(qrApiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'StudySpace-QR-Generator/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`QR API failed: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('image/png')) {
      throw new Error(`Expected PNG image, got: ${contentType}`);
    }
    
    const qrCodeBuffer = new Uint8Array(await response.arrayBuffer());
    
    // Validate that we received valid image data
    if (qrCodeBuffer.length < 100) {
      throw new Error('Received invalid or too small QR code data');
    }
    
    console.log('QR code PNG generated successfully, size:', qrCodeBuffer.length, 'bytes');
    return qrCodeBuffer;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

// Validate QR code content by checking if it contains expected URL
function validateQRContent(url: string, studyHallId: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.includes(studyHallId) && urlObj.pathname.includes('booking');
  } catch {
    return false;
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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(studyHallId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid study hall ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the study hall exists and get details
    const { data: studyHall, error: studyHallError } = await supabase
      .from('study_halls')
      .select('id, name, merchant_id, qr_booking_enabled, status')
      .eq('id', studyHallId)
      .eq('status', 'active')
      .single();

    if (studyHallError || !studyHall) {
      console.error('Study hall not found:', studyHallError);
      return new Response(
        JSON.stringify({ error: 'Study hall not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate QR code URL - use the lovable app domain
    const domain = 'https://jseyxxsptcckjumjcljk.lovable.app';
    const qrUrl = `${domain}/studyhall/${studyHallId}/booking`;

    // Validate that the URL is correctly formatted
    if (!validateQRContent(qrUrl, studyHallId)) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate valid booking URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating scannable QR code for URL: ${qrUrl}`);

    try {
      // Generate QR code PNG with validation
      const qrCodeBuffer = await generateQRCodePNG(qrUrl);
      console.log('QR code PNG generated successfully');

      // Clean up old QR codes for this study hall
      const { data: oldFiles } = await supabase.storage
        .from('qr-codes')
        .list('', {
          search: `qr-${studyHallId}-`
        });

      if (oldFiles && oldFiles.length > 0) {
        const filesToDelete = oldFiles.map(file => file.name);
        await supabase.storage
          .from('qr-codes')
          .remove(filesToDelete);
        console.log('Cleaned up old QR codes:', filesToDelete);
      }

      // Upload new QR code to Supabase Storage as PNG
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

      // Verify the URL is accessible
      try {
        const verifyResponse = await fetch(publicUrl.publicUrl);
        if (!verifyResponse.ok) {
          throw new Error('QR code not accessible at public URL');
        }
      } catch (verifyError) {
        console.error('QR code verification failed:', verifyError);
        return new Response(
          JSON.stringify({ error: 'Generated QR code is not accessible' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update study hall with QR code URL
      const { error: updateError } = await supabase
        .from('study_halls')
        .update({ 
          qr_code_url: publicUrl.publicUrl,
          qr_booking_enabled: true // Auto-enable QR booking when QR is generated
        })
        .eq('id', studyHallId);

      if (updateError) {
        console.error('Error updating study hall with QR code URL:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update study hall', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Scannable QR code generated successfully for study hall ${studyHallId}`);

      return new Response(
        JSON.stringify({
          success: true,
          qrCodeUrl: publicUrl.publicUrl,
          studyHallName: studyHall.name,
          bookingUrl: qrUrl,
          message: 'Scannable QR code generated successfully'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (qrError: any) {
      console.error('Error generating QR code:', qrError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate scannable QR code', details: qrError.message }),
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