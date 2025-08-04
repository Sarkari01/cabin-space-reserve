import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface UploadRequest {
  privateHallId: string;
  images: Array<{
    data: string; // base64
    name: string;
    type: string;
    size: number;
    isMain: boolean;
    displayOrder?: number;
  }>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Parse request body
    const { privateHallId, images }: UploadRequest = await req.json();

    if (!privateHallId || !images || images.length === 0) {
      throw new Error('Private hall ID and images are required');
    }

    // Verify the private hall exists and user has permission
    const { data: privateHall, error: hallError } = await supabaseClient
      .from('private_halls')
      .select('id, merchant_id')
      .eq('id', privateHallId)
      .single();

    if (hallError || !privateHall) {
      throw new Error('Private hall not found or access denied');
    }

    const uploadedImages = [];
    let hasMainImage = false;

    // Process each image
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      try {
        // Convert base64 to binary
        const imageData = Uint8Array.from(atob(image.data), c => c.charCodeAt(0));
        
        // Generate unique file path
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2);
        const fileExtension = image.name.split('.').pop() || 'jpg';
        const fileName = `private-halls/${privateHallId}/${timestamp}-${randomId}.${fileExtension}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from('private-hall-images')
          .upload(fileName, imageData, {
            contentType: image.type,
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Failed to upload ${image.name}: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
          .from('private-hall-images')
          .getPublicUrl(fileName);

        // Ensure only one main image
        const isMain = image.isMain && !hasMainImage;
        if (isMain) hasMainImage = true;

        // Insert image record to database
        const { data: imageRecord, error: dbError } = await supabaseClient
          .from('private_hall_images')
          .insert({
            private_hall_id: privateHallId,
            image_url: publicUrl,
            file_path: fileName,
            is_main: isMain,
            display_order: image.displayOrder ?? i,
            file_size: image.size,
            mime_type: image.type,
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database error:', dbError);
          // Clean up uploaded file on database error
          await supabaseClient.storage
            .from('private-hall-images')
            .remove([fileName]);
          throw new Error(`Failed to save image record for ${image.name}: ${dbError.message}`);
        }

        uploadedImages.push(imageRecord);

      } catch (error) {
        console.error(`Error processing image ${image.name}:`, error);
        throw error;
      }
    }

    // If no main image was set, make the first one main
    if (!hasMainImage && uploadedImages.length > 0) {
      const { error: updateError } = await supabaseClient
        .from('private_hall_images')
        .update({ is_main: true })
        .eq('id', uploadedImages[0].id);
      
      if (updateError) {
        console.error('Error setting main image:', updateError);
      } else {
        uploadedImages[0].is_main = true;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: uploadedImages,
        message: `Successfully uploaded ${uploadedImages.length} image(s)`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});