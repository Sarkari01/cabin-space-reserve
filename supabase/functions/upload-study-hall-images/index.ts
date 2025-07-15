import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UploadRequest {
  studyHallId: string;
  images: Array<{
    fileData: string;
    fileName: string;
    isMain: boolean;
    displayOrder: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { studyHallId, images }: UploadRequest = await req.json();

    if (!studyHallId || !images || images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Uploading ${images.length} images for study hall ${studyHallId}`);

    // Verify study hall exists and user has permission
    const { data: studyHall, error: studyHallError } = await supabase
      .from('study_halls')
      .select('id, merchant_id')
      .eq('id', studyHallId)
      .single();

    if (studyHallError || !studyHall) {
      console.error('Study hall not found:', studyHallError);
      return new Response(
        JSON.stringify({ error: 'Study hall not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const uploadedImages = [];
    let hasMainImage = false;

    // Process each image
    for (const [index, imageData] of images.entries()) {
      try {
        // Convert base64 to binary
        const binaryData = Uint8Array.from(atob(imageData.fileData), c => c.charCodeAt(0));
        
        // Generate unique filename
        const fileExt = imageData.fileName.split('.').pop() || 'jpg';
        const fileName = `${studyHallId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `study-hall-images/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('study-hall-images')
          .upload(filePath, binaryData, {
            contentType: `image/${fileExt}`,
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('study-hall-images')
          .getPublicUrl(filePath);

        // Determine if this should be the main image
        const isMain = imageData.isMain || (!hasMainImage && index === 0);
        if (isMain) hasMainImage = true;

        // Save to database
        const { data: dbImage, error: dbError } = await supabase
          .from('study_hall_images')
          .insert({
            study_hall_id: studyHallId,
            image_url: publicUrl,
            file_path: filePath,
            file_size: binaryData.length,
            mime_type: `image/${fileExt}`,
            is_main: isMain,
            display_order: imageData.displayOrder || index
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database error:', dbError);
          // Clean up uploaded file
          await supabase.storage
            .from('study-hall-images')
            .remove([filePath]);
          continue;
        }

        uploadedImages.push(dbImage);
        console.log(`Successfully uploaded image: ${fileName}`);

      } catch (error) {
        console.error(`Error processing image ${index}:`, error);
        continue;
      }
    }

    // If we have a main image, ensure only one is marked as main
    if (hasMainImage) {
      await supabase
        .from('study_hall_images')
        .update({ is_main: false })
        .eq('study_hall_id', studyHallId)
        .neq('id', uploadedImages.find(img => img.is_main)?.id);
    }

    // Update study hall with main image URL for backward compatibility
    const mainImage = uploadedImages.find(img => img.is_main);
    if (mainImage) {
      await supabase
        .from('study_halls')
        .update({ image_url: mainImage.image_url })
        .eq('id', studyHallId);
    }

    console.log(`Successfully uploaded ${uploadedImages.length} images`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        images: uploadedImages,
        count: uploadedImages.length 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})