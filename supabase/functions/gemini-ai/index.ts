import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to get secret from Supabase Management API
async function getSupabaseSecret(secretName: string): Promise<string | null> {
  try {
    const projectId = Deno.env.get('SUPABASE_PROJECT_REF') || 'jseyxxsptcckjumjcljk';
    const managementUrl = `https://api.supabase.com/v1/projects/${projectId}/secrets`;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not found');
      return null;
    }

    const response = await fetch(managementUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch secrets: ${response.status} ${response.statusText}`);
      return null;
    }

    const secrets = await response.json();
    const secret = secrets.find((s: any) => s.name === secretName);
    return secret?.value || null;
  } catch (error) {
    console.error(`Error getting secret ${secretName}:`, error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, type = 'text', context = '', model = 'gemini-1.5-flash' } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    // Check if Gemini AI is enabled in business settings first
    const supabaseUrl = 'https://jseyxxsptcckjumjcljk.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseKey) {
      throw new Error('Supabase service key not found');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check business settings
    const { data: settings } = await supabase
      .from('business_settings')
      .select('gemini_enabled')
      .limit(1)
      .single();

    if (!settings?.gemini_enabled) {
      throw new Error('Gemini AI is not enabled. Please enable it in Business Settings.');
    }

    const geminiApiKey = await getSupabaseSecret('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured. Please add your Gemini API key in Business Settings → API Keys.');
    }

    console.log(`Processing ${type} request with Gemini AI`);

    let requestBody;
    
    if (type === 'multimodal' && context) {
      // For multimodal requests (text + image/file analysis)
      requestBody = {
        contents: [{
          parts: [
            { text: `${context}\n\n${prompt}` }
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };
    } else {
      // For text-only requests
      requestBody = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No content generated from Gemini API');
    }

    console.log('Successfully generated content with Gemini AI');

    return new Response(
      JSON.stringify({ 
        content: generatedText,
        model: model,
        type: type,
        tokensUsed: data.usageMetadata?.totalTokenCount || 0
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in gemini-ai function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.stack 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});