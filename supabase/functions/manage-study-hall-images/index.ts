import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ManageRequest {
  action: 'delete' | 'setMain' | 'reorder';
  studyHallId: string;
  imageId?: string;
  imageOrders?: Array<{ id: string; display_order: number }>;
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

    const { action, studyHallId, imageId, imageOrders }: ManageRequest = await req.json();

    if (!action || !studyHallId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Managing images for study hall ${studyHallId}, action: ${action}`);

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

    let result;

    switch (action) {
      case 'delete':
        if (!imageId) {
          return new Response(
            JSON.stringify({ error: 'Image ID required for delete action' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Get image details first
        const { data: imageToDelete, error: getError } = await supabase
          .from('study_hall_images')
          .select('file_path, is_main')
          .eq('id', imageId)
          .eq('study_hall_id', studyHallId)
          .single();

        if (getError || !imageToDelete) {
          return new Response(
            JSON.stringify({ error: 'Image not found' }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('study-hall-images')
          .remove([imageToDelete.file_path]);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
        }

        // Delete from database
        const { error: deleteError } = await supabase
          .from('study_hall_images')
          .delete()
          .eq('id', imageId)
          .eq('study_hall_id', studyHallId);

        if (deleteError) {
          console.error('Database deletion error:', deleteError);
          return new Response(
            JSON.stringify({ error: 'Failed to delete image' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // If we deleted the main image, set another as main
        if (imageToDelete.is_main) {
          const { data: remainingImages } = await supabase
            .from('study_hall_images')
            .select('id, image_url')
            .eq('study_hall_id', studyHallId)
            .order('display_order')
            .limit(1);

          if (remainingImages && remainingImages.length > 0) {
            await supabase
              .from('study_hall_images')
              .update({ is_main: true })
              .eq('id', remainingImages[0].id);

            // Update study hall main image
            await supabase
              .from('study_halls')
              .update({ image_url: remainingImages[0].image_url })
              .eq('id', studyHallId);
          } else {
            // No more images, clear study hall image
            await supabase
              .from('study_halls')
              .update({ image_url: null })
              .eq('id', studyHallId);
          }
        }

        result = { success: true, action: 'delete' };
        break;

      case 'setMain':
        if (!imageId) {
          return new Response(
            JSON.stringify({ error: 'Image ID required for setMain action' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Unset all main images for this study hall
        await supabase
          .from('study_hall_images')
          .update({ is_main: false })
          .eq('study_hall_id', studyHallId);

        // Set new main image
        const { data: newMainImage, error: setMainError } = await supabase
          .from('study_hall_images')
          .update({ is_main: true })
          .eq('id', imageId)
          .eq('study_hall_id', studyHallId)
          .select('image_url')
          .single();

        if (setMainError) {
          console.error('Set main image error:', setMainError);
          return new Response(
            JSON.stringify({ error: 'Failed to set main image' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Update study hall main image
        await supabase
          .from('study_halls')
          .update({ image_url: newMainImage.image_url })
          .eq('id', studyHallId);

        result = { success: true, action: 'setMain' };
        break;

      case 'reorder':
        if (!imageOrders || imageOrders.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Image orders required for reorder action' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Update display orders
        for (const { id, display_order } of imageOrders) {
          await supabase
            .from('study_hall_images')
            .update({ display_order })
            .eq('id', id)
            .eq('study_hall_id', studyHallId);
        }

        result = { success: true, action: 'reorder' };
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

    console.log(`Successfully completed ${action} action`);

    return new Response(
      JSON.stringify(result),
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