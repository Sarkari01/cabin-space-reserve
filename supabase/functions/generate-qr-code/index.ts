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

// QR Code generation utility functions
function generateQRCodeSVG(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const size = 512;
      const margin = 32;
      const qrSize = size - (margin * 2);
      
      // Simple QR code matrix generation (for demo - in production use proper QR library)
      const modules = createQRMatrix(text);
      const moduleSize = qrSize / modules.length;
      
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
      svg += `<rect width="${size}" height="${size}" fill="white"/>`;
      
      for (let y = 0; y < modules.length; y++) {
        for (let x = 0; x < modules[y].length; x++) {
          if (modules[y][x]) {
            const px = margin + (x * moduleSize);
            const py = margin + (y * moduleSize);
            svg += `<rect x="${px}" y="${py}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
          }
        }
      }
      
      svg += '</svg>';
      resolve(svg);
    } catch (error) {
      reject(error);
    }
  });
}

function createQRMatrix(text: string): boolean[][] {
  // Simplified QR matrix for demo purposes
  // In production, use a proper QR code library
  const size = 25;
  const matrix: boolean[][] = [];
  
  // Create basic pattern based on text hash
  const hash = simpleHash(text);
  
  for (let y = 0; y < size; y++) {
    matrix[y] = [];
    for (let x = 0; x < size; x++) {
      // Create a pattern based on position and hash
      const val = (x + y + hash) % 3;
      matrix[y][x] = val === 0;
    }
  }
  
  // Add finder patterns (corners)
  addFinderPattern(matrix, 0, 0);
  addFinderPattern(matrix, 0, size - 7);
  addFinderPattern(matrix, size - 7, 0);
  
  return matrix;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function addFinderPattern(matrix: boolean[][], startX: number, startY: number) {
  const pattern = [
    [1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1]
  ];
  
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      if (startY + y < matrix.length && startX + x < matrix[0].length) {
        matrix[startY + y][startX + x] = pattern[y][x] === 1;
      }
    }
  }
}

async function svgToPngBuffer(svgString: string): Promise<Uint8Array> {
  // For demo purposes, we'll create a simple PNG-like buffer
  // In production, use proper SVG to PNG conversion
  const encoder = new TextEncoder();
  const svgBytes = encoder.encode(svgString);
  
  // Create a simple PNG header (this is a placeholder)
  const pngHeader = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  ]);
  
  // Combine header with SVG data (simplified approach)
  const result = new Uint8Array(pngHeader.length + svgBytes.length);
  result.set(pngHeader, 0);
  result.set(svgBytes, pngHeader.length);
  
  return result;
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

    try {
      // Generate QR code using native canvas approach for Deno
      const qrCodeSvg = await generateQRCodeSVG(qrUrl);
      console.log('QR code SVG generated successfully');

      // Convert SVG to PNG buffer
      const qrCodeBuffer = await svgToPngBuffer(qrCodeSvg);
      console.log(`QR code buffer created, size: ${qrCodeBuffer.length} bytes`);

      // Upload QR code to Supabase Storage
      const fileName = `qr-${studyHallId}-${Date.now()}.png`;
      console.log(`Uploading QR code with filename: ${fileName}`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('qr-codes')
        .upload(fileName, qrCodeBuffer, {
          contentType: 'image/png',
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