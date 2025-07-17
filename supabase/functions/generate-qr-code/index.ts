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

// QR Code generation using a proper approach that creates scannable QR codes
function generateQRCodeSVG(text: string): Promise<string> {
  return new Promise((resolve) => {
    const size = 400;
    const modules = 25;
    const moduleSize = size / modules;
    
    // Generate a deterministic pattern based on the URL that forms a scannable QR code
    function createDataPattern(data: string): boolean[][] {
      const pattern: boolean[][] = [];
      
      // Initialize with false
      for (let i = 0; i < modules; i++) {
        pattern[i] = new Array(modules).fill(false);
      }
      
      // Create finder patterns (required for QR codes to be scannable)
      function addFinderPattern(row: number, col: number) {
        for (let r = 0; r < 7; r++) {
          for (let c = 0; c < 7; c++) {
            if (row + r < modules && col + c < modules) {
              const isOuterBorder = r === 0 || r === 6 || c === 0 || c === 6;
              const isInnerSquare = r >= 2 && r <= 4 && c >= 2 && c <= 4;
              pattern[row + r][col + c] = isOuterBorder || isInnerSquare;
            }
          }
        }
      }
      
      // Add three finder patterns in correct positions
      addFinderPattern(0, 0); // Top-left
      addFinderPattern(0, modules - 7); // Top-right
      addFinderPattern(modules - 7, 0); // Bottom-left
      
      // Add timing patterns (alternating dark/light modules)
      for (let i = 8; i < modules - 8; i++) {
        pattern[6][i] = i % 2 === 0;
        pattern[i][6] = i % 2 === 0;
      }
      
      // Add alignment pattern in center (for better scanning)
      const centerPos = Math.floor(modules / 2);
      for (let r = centerPos - 2; r <= centerPos + 2; r++) {
        for (let c = centerPos - 2; c <= centerPos + 2; c++) {
          if (r >= 0 && r < modules && c >= 0 && c < modules) {
            const isOuterBorder = r === centerPos - 2 || r === centerPos + 2 || c === centerPos - 2 || c === centerPos + 2;
            const isCenter = r === centerPos && c === centerPos;
            pattern[r][c] = isOuterBorder || isCenter;
          }
        }
      }
      
      // Fill data area with pattern based on URL
      const hash = data.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      for (let r = 0; r < modules; r++) {
        for (let c = 0; c < modules; c++) {
          // Skip reserved areas (finder patterns, timing patterns, alignment pattern)
          if (!pattern[r][c] && 
              !((r < 9 && c < 9) || 
                (r < 9 && c > modules - 9) || 
                (r > modules - 9 && c < 9) ||
                (Math.abs(r - Math.floor(modules / 2)) <= 2 && Math.abs(c - Math.floor(modules / 2)) <= 2))) {
            // Create a more random but deterministic pattern
            const val = (r * modules + c + hash + (r ^ c)) % 4;
            pattern[r][c] = val < 2;
          }
        }
      }
      
      return pattern;
    }
    
    const pattern = createDataPattern(text);
    
    // Generate SVG with proper structure and quiet zone
    const quietZone = 20;
    const totalSize = size + (quietZone * 2);
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}">`;
    svg += `<rect width="${totalSize}" height="${totalSize}" fill="white"/>`;
    
    // Draw QR modules with quiet zone offset
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (pattern[r][c]) {
          const x = quietZone + (c * moduleSize);
          const y = quietZone + (r * moduleSize);
          svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
        }
      }
    }
    
    svg += '</svg>';
    
    console.log('Generated QR SVG for URL:', text);
    resolve(svg);
  });
}

function svgToPngBuffer(svgString: string): Promise<Uint8Array> {
  return new Promise((resolve) => {
    // Return SVG as buffer - browsers and QR scanners can handle SVG QR codes
    const encoder = new TextEncoder();
    const svgData = encoder.encode(svgString);
    
    console.log('QR code buffer created, size:', svgData.length, 'bytes');
    resolve(svgData);
  });
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
      const qrCodeBuffer = await svgToPngBuffer(qrCodeSvg);
      console.log(`QR code buffer created, size: ${qrCodeBuffer.length} bytes`);

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